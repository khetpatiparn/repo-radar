import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  NewsArticleSchema,
  NEWS_CATEGORIES,
  type DeepReadingGuide,
  type NewsArticleData,
  type NewsCategory,
  type NewsFeedData,
} from "../src/types";
import {
  DEEP_READING_JSON_SPEC,
  DEEP_READING_RULES,
  decodeHtmlEntities,
  extractReadableTextFromHtml,
  hasBackfill3PassFlag,
  hasRefreshLatestFlag,
  sanitizeReadingGuide,
} from "./lib/deep-reading";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NEWS_FILE_PATH = path.join(process.cwd(), "src/data/news.json");
const MAX_ARTICLES = 45;
const MAX_NEW_PER_RUN = 24;
const REFRESH_LATEST_NEWS_COUNT = 10;
const BATCH_SIZE = 3; // Smaller batches because full article bodies are much richer

const RSS_FEEDS = [
  "https://blog.google/rss/",
  "https://blog.google/innovation-and-ai/rss/",
  "https://blog.google/innovation-and-ai/technology/ai/rss/",
  "https://blog.google/innovation-and-ai/models-and-research/rss/",
  "https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/rss/",
  "https://blog.google/technology/ai/rss/",
  "https://blog.google/technology/developers/rss/",
];

interface RawRSSItem {
  id: string;
  title: string;
  url: string;
  description: string;
  article_body?: string;
  source_depth?: DeepReadingGuide["source_depth"];
  published_at: string;
  published_date: string;
  rss_categories: string[];
  thumbnail_url: string | null;
  authors: string[];
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i");
  const match = block.match(regex);
  return match ? decodeHtmlEntities(match[1]).trim() : "";
}

function extractAllTags(block: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "gi");
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(block)) !== null) {
    const val = decodeHtmlEntities(match[1]).trim();
    if (val) results.push(val);
  }
  return results;
}

function buildArticleId(url: string): string {
  const slug = url
    .replace(/^https?:\/\/[^/]+/, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .slice(-2)
    .join("-")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 6);
  return slug ? `${slug.slice(0, 48)}-${hash}` : `gblog-${hash}`;
}

export function isRelevantAITechItem(
  title: string,
  description: string,
  categories: string[],
  url: string
): boolean {
  const lowerUrl = url.toLowerCase();
  const lowerCats = categories.join(" ").toLowerCase();
  const combined = `${title} ${description} ${lowerCats} ${lowerUrl}`.toLowerCase();

  // Strictly block corporate PR, regional CSR events, cultural celebrations, and non-engineering fluff
  const excludedUrlPatterns = [
    "/around-the-globe/",
    "/inside-google/",
    "/outreach-initiatives/",
    "/company-news/outreach",
    "google-for-mexico",
    "google-for-india",
    "google-for-africa",
    "google-for-brazil",
    "google-for-japan",
    "google-for-taiwan",
    "google-for-indonesia",
    "veterans-day",
    "energy-impact-program",
    "esther-mahlangu",
    "phd-fellows",
    "invalid-traffic-overview",
    "henry-cavill",
    "new-google-domains",
    "google-org",
    "sustainability",
    "earth-day",
    "womens-history",
    "black-history",
    "pride-month",
    "doodle",
  ];
  if (excludedUrlPatterns.some((kw) => lowerUrl.includes(kw))) {
    return false;
  }

  const excludedCategoryPatterns = [
    /google in latin america/i,
    /google in africa/i,
    /google in asia/i,
    /google in europe/i,
    /google\.org/i,
    /life at google/i,
    /public policy/i,
    /arts & culture/i,
    /diversity/i,
  ];
  const hasStrongModelOrDevSignal =
    /\b(gemini|gemma|deepmind|vertex|ai studio|tpu|api|sdk|benchmark|agentic|llm|open weights|transformer|quantum|cybersecurity)\b/i.test(
      `${title} ${description}`
    );
  if (
    excludedCategoryPatterns.some((re) => re.test(lowerCats)) &&
    !hasStrongModelOrDevSignal
  ) {
    return false;
  }

  const shortTokens = [/\bai\b/, /\bapi\b/, /\bxr\b/, /\btpu\b/, /\bml\b/, /\bllm\b/, /\bsdk\b/];
  const phraseKeywords = [
    "gemini",
    "gemma",
    "deepmind",
    "google labs",
    "google research",
    "google cloud",
    "developer",
    "ai studio",
    "vertex",
    "agentic",
    "multimodal",
    "benchmark",
    "cybersecurity",
    "quantum",
    "flow tools",
    "tabletop",
    "android",
    "pixel",
    "chrome",
    "workspace",
    "notebooklm",
    "veo",
    "imagen",
    "jules",
    "firebase",
  ];

  return (
    shortTokens.some((re) => re.test(combined)) ||
    phraseKeywords.some((kw) => combined.includes(kw))
  );
}

function inferNewsCategory(
  title: string,
  description: string,
  rssCategories: string[]
): NewsCategory {
  const text = `${title} ${description} ${rssCategories.join(" ")}`.toLowerCase();
  if (
    rssCategories.some((c) => /gemini models/i.test(c)) ||
    text.includes("gemini 4") ||
    text.includes("gemini 3") ||
    text.includes("gemini 2") ||
    text.includes("gemma") ||
    text.includes("benchmark") ||
    text.includes("decisions api")
  ) {
    return "Gemini & Models";
  }
  if (
    rssCategories.some((c) => /google research|google labs|deepmind/i.test(c)) ||
    text.includes("google labs") ||
    text.includes("google research") ||
    text.includes("deepmind") ||
    text.includes("flow tools") ||
    text.includes("tabletop")
  ) {
    return "Google Research & Labs";
  }
  if (
    rssCategories.some((c) => /developer tools|google cloud/i.test(c)) ||
    text.includes("developer") ||
    text.includes("google cloud") ||
    text.includes("ai studio") ||
    text.includes("api") ||
    text.includes("cybersecurity") ||
    text.includes("agentic architect")
  ) {
    return "Cloud & Developer Tools";
  }
  return "AI Products & Ecosystem";
}

function inferSourceLabel(rssCategories: string[]): string {
  if (rssCategories.some((c) => /deepmind/i.test(c))) return "Google DeepMind";
  if (rssCategories.some((c) => /google labs/i.test(c))) return "Google Labs";
  if (rssCategories.some((c) => /google research/i.test(c))) return "Google Research";
  if (rssCategories.some((c) => /google cloud/i.test(c))) return "Google Cloud";
  if (rssCategories.some((c) => /developer tools/i.test(c))) return "Google Developers";
  return "Google Official Blog";
}

async function fetchFullArticleText(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RepoRadar-NewsSync/2.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!res.ok) return "";
    const html = await res.text();
    return extractReadableTextFromHtml(html, 6800);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function enrichItemsWithFullArticles(items: RawRSSItem[]): Promise<void> {
  for (const item of items) {
    const fullText = await fetchFullArticleText(item.url);
    if (fullText.length >= 350) {
      item.article_body = fullText;
      item.source_depth = "full_article";
    } else {
      item.article_body = item.description;
      item.source_depth = "abstract_only";
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function fetchGoogleBlogRSS(): Promise<RawRSSItem[]> {
  const itemsByUrl = new Map<string, RawRSSItem>();

  for (const feedUrl of RSS_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "RepoRadar-NewsSync/2.0" },
      });
      if (!res.ok) {
        console.warn(`RSS feed ${feedUrl} returned HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const itemBlocks = xml.split(/<item>/i).slice(1);

      for (const rawBlock of itemBlocks) {
        const block = rawBlock.split(/<\/item>/i)[0] || rawBlock;
        const url = extractTag(block, "link");
        if (!url || itemsByUrl.has(url)) continue;

        const title = stripHtmlTags(extractTag(block, "title"));
        const rawDesc = extractTag(block, "description");
        const ogDesc = extractTag(block, "og:description");
        const descText = stripHtmlTags(rawDesc) || stripHtmlTags(ogDesc);

        const pubDateRaw = extractTag(block, "pubDate");
        const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
        const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

        const rssCategories = extractAllTags(block, "category");
        if (!isRelevantAITechItem(title, descText, rssCategories, url)) {
          continue;
        }

        const mediaMatch = block.match(/<media:content[^>]*\burl=["']([^"']+)["']/i);
        const imgMatch = rawDesc.match(/<img[^>]*\bsrc=["']([^"']+)["']/i);
        const thumbnail_url = mediaMatch?.[1] || imgMatch?.[1] || null;

        const authorBlockRegex = /<author[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi;
        const authors: string[] = [];
        let aMatch: RegExpExecArray | null;
        while ((aMatch = authorBlockRegex.exec(block)) !== null) {
          const name = decodeHtmlEntities(aMatch[1]).trim();
          if (name) authors.push(name);
        }

        itemsByUrl.set(url, {
          id: buildArticleId(url),
          title,
          url,
          description: descText,
          published_at: validDate.toISOString(),
          published_date: validDate.toISOString().slice(0, 10),
          rss_categories: rssCategories,
          thumbnail_url,
          authors: authors.slice(0, 4),
        });
      }
    } catch (error) {
      console.warn(`Error fetching RSS ${feedUrl}:`, error);
    }
  }

  return Array.from(itemsByUrl.values()).sort((a, b) =>
    b.published_at.localeCompare(a.published_at)
  );
}

async function loadExistingNews(): Promise<Map<string, NewsArticleData>> {
  const cachedByUrl = new Map<string, NewsArticleData>();
  try {
    const raw = await fs.readFile(NEWS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as NewsFeedData;
    if (parsed && Array.isArray(parsed.articles)) {
      for (const art of parsed.articles) {
        if (art && art.url) {
          cachedByUrl.set(art.url, art);
        }
      }
    }
  } catch {
    // No existing news.json yet
  }
  return cachedByUrl;
}

interface GeminiNewsPayload {
  id?: string;
  category?: NewsCategory;
  reading_time_minutes?: number;
  hook_headline?: string;
  short_teaser?: string;
  tldr_takeaways?: string[];
  layman_story?: string[];
  impact_comparison?: {
    before?: string;
    after?: string;
    why_it_matters?: string;
  };
  actionable_playbook?: Array<{
    title: string;
    role: string;
    description: string;
    example: string;
  }>;
  key_highlights?: {
    whats_new?: string[];
    watchouts?: string[];
  };
  reading_guide?: unknown;
  facebook_post?: string;
}

async function processBatchWithGemini(
  items: RawRSSItem[]
): Promise<Map<string, GeminiNewsPayload>> {
  const resultMap = new Map<string, GeminiNewsPayload>();
  if (!GEMINI_API_KEY || items.length === 0) return resultMap;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
  ];

  const newsInput = items.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    published_date: item.published_date,
    rss_categories: item.rss_categories,
    source_depth: item.source_depth || "abstract_only",
    rss_summary: item.description.slice(0, 600),
    article_body: (item.article_body || item.description).slice(0, 6500),
  }));

  const prompt = `
You are a sharp, no-BS Thai AI systems engineer & technical editor explaining Google AI/Lab announcements to a solo Thai developer who wants REAL technical substance (benchmarks, model IDs, pricing, architecture, limitations) — NOT corporate PR fluff.

Convert the following ${newsInput.length} official Google Blog AI/Tech articles into deeply grounded, 3-Pass Thai technical briefings + a collapsed ready-to-share Facebook post draft.

${DEEP_READING_RULES}

IMPORTANT WRITING & STYLE RULES:
1. Write ALL descriptive text in natural, direct, technically accurate **Thai (ภาษาไทย)** (keep product/model/tech names like Gemini, Gemma, Vertex AI, AI Studio, API, Context Window, Latency, Benchmark, SDK in English).
2. Extract REAL facts from "article_body": exact model names/versions, benchmark scores, context length, pricing, availability dates, API endpoints, or capabilities actually stated in the text. NEVER pad with vague PR phrases like "ฉลาดกว่าเดิมอย่างก้าวกระโดด" unless backed by the actual source text.
3. "category" MUST be strictly one of:
   - "Gemini & Models"
   - "Google Research & Labs"
   - "Cloud & Developer Tools"
   - "AI Products & Ecosystem"
4. "layman_story" MUST be an array of 3-4 crisp, substantive paragraphs in Thai (each 3-4 sentences):
   - Paragraph 1: ประกาศนี้คืออะไรกันแน่ แก้ปัญหาคอขวดอะไรในมุมวิศวกรรม
   - Paragraph 2: เจาะลึกความสามารถจริง สเปก เทคนิค หรือสถาปัตยกรรมที่ระบุในบทความต้นฉบับ
   - Paragraph 3: เปรียบเทียบกับรุ่นก่อนหรือคู่แข่งในตลาด และข้อจำกัดที่ควรรู้ก่อนหยิบมาใช้
5. "actionable_playbook" MUST contain 3 practical technical steps/angles (for schema compatibility).
6. "facebook_post" MUST be a clean Thai summary draft (~180-260 words) grounded ONLY in real facts from the article, with bullet points and 3-5 hashtags.

Input News JSON:
${JSON.stringify(newsInput, null, 2)}

Return a JSON array matching this exact structure:
[
  {
    "id": "<item id>",
    "category": "<one of the 4 categories>",
    "reading_time_minutes": 4,
    "hook_headline": "พาดหัวภาษาไทยที่ตรงประเด็น บอกสิ่งที่เปิดตัวและจุดเปลี่ยนสำคัญทันที (ไม่คลิกเบตลอยๆ)",
    "short_teaser": "สรุปเกริ่นนำ 2 ประโยคพร้อมข้อเท็จจริงสำคัญจากต้นฉบับ (ภาษาไทย)",
    "tldr_takeaways": [
      "ประเด็นสำคัญข้อที่ 1 พร้อมสเปก/ข้อเท็จจริงจากต้นฉบับ (ภาษาไทย)",
      "ประเด็นสำคัญข้อที่ 2 พร้อมสเปก/ข้อเท็จจริงจากต้นฉบับ (ภาษาไทย)",
      "ประเด็นสำคัญข้อที่ 3 พร้อมข้อจำกัดหรือสถานะการเปิดใช้งาน (ภาษาไทย)"
    ],
    "layman_story": [
      "ย่อหน้าที่ 1: ประกาศนี้คืออะไร และแก้ปัญหาอะไร...",
      "ย่อหน้าที่ 2: เจาะลึกสเปก กลไก และตัวเลขจริงจากต้นฉบับ...",
      "ย่อหน้าที่ 3: ข้อเปรียบเทียบและสิ่งที่นักพัฒนาต้องระวัง..."
    ],
    "impact_comparison": {
      "before": "ก่อนอัปเดต: ข้อจำกัดจริงที่นักพัฒนาเจอ (ภาษาไทย)",
      "after": "หลังอัปเดต: สิ่งที่ทำได้จริงหรือดีขึ้นตามประกาศ (ภาษาไทย)",
      "why_it_matters": "ทำไมนักพัฒนาควรสนใจหรือเก็บไว้ในเรดาร์ (ภาษาไทย)"
    },
    "actionable_playbook": [
      {
        "title": "ทดสอบผ่าน AI Studio / API",
        "role": "ทดลองใช้งานจริง",
        "description": "ขั้นตอนทดลองสั้นๆ ที่ทำได้ทันที (ภาษาไทย)",
        "example": "ตัวอย่างการทดสอบที่เป็นรูปธรรม (ภาษาไทย)"
      },
      {
        "title": "เช็กสเปกและราคาเทียบรุ่นเดิม",
        "role": "ประเมินก่อนใช้ในโปรเจกต์",
        "description": "จุดที่ต้องวัดเทียบ Latency / Cost / คุณภาพ (ภาษาไทย)",
        "example": "เกณฑ์การเปรียบเทียบจริง (ภาษาไทย)"
      },
      {
        "title": "เตรียมจุดเชื่อมต่อหรือศึกษาต่อ",
        "role": "ต่อยอดความรู้",
        "description": "เอกสารหรือหัวข้อที่ควรอ่านเพิ่ม (ภาษาไทย)",
        "example": "ตัวอย่างการประยุกต์ในโปรเจกต์ส่วนตัว (ภาษาไทย)"
      }
    ],
    "key_highlights": {
      "whats_new": [
        "สิ่งใหม่ที่จับต้องได้จากต้นฉบับ ข้อที่ 1 (ภาษาไทย)",
        "สิ่งใหม่ที่จับต้องได้จากต้นฉบับ ข้อที่ 2 (ภาษาไทย)"
      ],
      "watchouts": [
        "ข้อจำกัด/ราคา/ภูมิภาค/เงื่อนไขที่ต้องระวัง ข้อที่ 1 (ภาษาไทย)",
        "ข้อจำกัดหรือสิ่งที่ต้นฉบับยังไม่เปิดเผย ข้อที่ 2 (ภาษาไทย)"
      ]
    },
    ${DEEP_READING_JSON_SPEC},
    "facebook_post": "ฉบับร่างโพสต์ Facebook ภาษาไทยพร้อมแชร์ในอนาคต อิงข้อมูลจริงจากต้นฉบับเท่านั้น"
  }
]
`;

  for (const modelName of modelsToTry) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await model.generateContent(prompt);
        const parsed = JSON.parse(res.response.text());
        const arr = Array.isArray(parsed) ? parsed : parsed?.articles || [];
        for (const item of arr) {
          if (item && item.id) {
            resultMap.set(String(item.id), item as GeminiNewsPayload);
          }
        }
        if (resultMap.size > 0) {
          return resultMap;
        }
      } catch (error: unknown) {
        const errObj = error as { status?: number; message?: string };
        const status = errObj?.status;
        const isFatal = status === 404 || status === 401 || status === 403;
        console.warn(
          `[${modelName}] News batch attempt ${attempt} failed (${status ?? "error"}): ${errObj?.message || String(error)}`
        );
        if (!isFatal && attempt < 3) {
          await new Promise((r) => setTimeout(r, 2500 * attempt));
        } else {
          break;
        }
      }
    }
  }

  return resultMap;
}

function buildNewsObject(
  item: RawRSSItem,
  aiData: GeminiNewsPayload | null
): NewsArticleData {
  const fallbackCategory = inferNewsCategory(
    item.title,
    item.description,
    item.rss_categories
  );
  const category: NewsCategory =
    aiData?.category && NEWS_CATEGORIES.includes(aiData.category)
      ? aiData.category
      : fallbackCategory;
  const source = inferSourceLabel(item.rss_categories);

  const nowIso = new Date().toISOString();
  const readingGuide = sanitizeReadingGuide(
    aiData?.reading_guide,
    item.source_depth || "abstract_only"
  );

  const built: NewsArticleData = {
    id: item.id,
    title: item.title,
    url: item.url,
    source,
    published_date: item.published_date,
    published_at: item.published_at,
    updated_at: nowIso,
    first_seen_at: nowIso,
    authors: item.authors,
    rss_categories: item.rss_categories,
    category,
    thumbnail_url: item.thumbnail_url,
    reading_time_minutes: aiData?.reading_time_minutes || 4,
    hook_headline: aiData?.hook_headline || `${source} อัปเดตใหม่: ${item.title}`,
    short_teaser:
      aiData?.short_teaser ||
      item.description ||
      `อัปเดตล่าสุดจาก ${source} ในหมวด ${category} ที่นักพัฒนาสาย AI ควรติดตาม`,
    tldr_takeaways:
      Array.isArray(aiData?.tldr_takeaways) && aiData.tldr_takeaways.length > 0
        ? aiData.tldr_takeaways.slice(0, 3)
        : [
            `ประกาศอย่างเป็นทางการจาก ${source} ในกลุ่ม ${category}`,
            item.description || `ขยายความสามารถของระบบนิเวศ AI จาก Google`,
            `สามารถติดตามรายละเอียดฉบับเต็มได้จากลิงก์ต้นทางของ Google Blog`,
          ],
    layman_story:
      Array.isArray(aiData?.layman_story) && aiData.layman_story.length > 0
        ? aiData.layman_story.slice(0, 5)
        : [
            item.description || item.title,
            `การอัปเดตครั้งนี้จัดอยู่ในกลุ่ม ${category} สามารถอ่านรายละเอียดสเปกเต็มจากประกาศต้นทาง`,
          ],
    impact_comparison: {
      before:
        aiData?.impact_comparison?.before ||
        "ก่อนอัปเดต: ต้องพึ่งพาเครื่องมือหรือรุ่นเดิมที่มีข้อจำกัดมากกว่า",
      after:
        aiData?.impact_comparison?.after ||
        "หลังอัปเดต: มีความสามารถและเครื่องมือชุดใหม่จาก Google ตามรายละเอียดประกาศต้นฉบับ",
      why_it_matters:
        aiData?.impact_comparison?.why_it_matters ||
        "สะท้อนทิศทางเทคโนโลยีและเครื่องมือฝั่งนักพัฒนาจาก Google",
    },
    actionable_playbook:
      Array.isArray(aiData?.actionable_playbook) && aiData.actionable_playbook.length === 3
        ? aiData.actionable_playbook
        : [
            {
              title: "ตรวจสอบสเปกและเอกสารทางการ",
              role: "ทดลองใช้งานจริง",
              description: "ดูรายละเอียด API, Model ID และเงื่อนไขการใช้งานจากประกาศต้นฉบับ",
              example: "เปิด Google AI Studio หรือลิงก์ต้นทางเพื่อลองรันทดสอบ",
            },
            {
              title: "เทียบประสิทธิภาพกับตัวที่ใช้อยู่",
              role: "ประเมินก่อนใช้ในโปรเจกต์",
              description: "เทียบ Latency, คุณภาพคำตอบ และราคาต่อ Token จากโจทย์จริง",
              example: "ลองรัน Prompt เดิม 5 ข้อเทียบกับโมเดลปัจจุบัน",
            },
            {
              title: "จดจุดสำคัญไว้ในคลังความรู้",
              role: "ต่อยอดความรู้",
              description: "ศึกษาหัวข้อเทคนิคที่เกี่ยวข้องเพิ่มเติมเมื่อต้องนำไปใช้จริง",
              example: "คั่นหน้าบทความนี้ไว้เป็นจุดอ้างอิง",
            },
          ],
    key_highlights: {
      whats_new:
        Array.isArray(aiData?.key_highlights?.whats_new) &&
        aiData.key_highlights.whats_new.length > 0
          ? aiData.key_highlights.whats_new.slice(0, 3)
          : [`เปิดตัวความสามารถใหม่ในหมวด ${category}`, `อัปเดตโดยตรงจากทีม ${source}`],
      watchouts:
        Array.isArray(aiData?.key_highlights?.watchouts) &&
        aiData.key_highlights.watchouts.length > 0
          ? aiData.key_highlights.watchouts.slice(0, 3)
          : [
              "ตรวจสอบการเปิดให้บริการตามภูมิภาคและภาษาที่รองรับ",
              "ติดตามราคาและโควตาการใช้งานจริงหากนำไปใช้ในโปรดักชัน",
            ],
    },
    reading_guide: readingGuide,
    facebook_post:
      typeof aiData?.facebook_post === "string" && aiData.facebook_post.trim().length > 0
        ? aiData.facebook_post.trim()
        : undefined,
  };

  return NewsArticleSchema.parse(built);
}

async function main() {
  const refreshLatest = hasRefreshLatestFlag();
  const backfill3Pass = hasBackfill3PassFlag();
  console.log(
    `📰 Starting Google Official Blog RSS Sync...${
      backfill3Pass
        ? " [BACKFILL 3-PASS MODE]"
        : refreshLatest
        ? " [REFRESH LATEST MODE]"
        : ""
    }`
  );

  const cachedByUrl = await loadExistingNews();
  console.log(`Loaded ${cachedByUrl.size} cached news articles.`);

  const rssItems = await fetchGoogleBlogRSS();
  console.log(
    `Found ${rssItems.length} relevant AI/Tech news items from Google Blog RSS.`
  );

  if (rssItems.length === 0 && !backfill3Pass) {
    console.log("No RSS items fetched. Keeping existing news.json intact.");
    return;
  }

  let toSummarize: RawRSSItem[];
  if (backfill3Pass) {
    // Backfill ALL cached articles and RSS items that are still missing 3-Pass reading_guide
    const byUrl = new Map<string, RawRSSItem>();
    for (const item of rssItems) {
      const cached = cachedByUrl.get(item.url);
      if (!cached || cached.layman_story.length < 2 || !cached.reading_guide) {
        byUrl.set(item.url, item);
      }
    }
    for (const [url, art] of cachedByUrl.entries()) {
      if (byUrl.has(url)) continue;
      if (!isRelevantAITechItem(art.title, art.short_teaser, art.rss_categories, art.url)) {
        continue;
      }
      if (!art.reading_guide || art.layman_story.length < 2) {
        byUrl.set(url, {
          id: art.id,
          title: art.title,
          url: art.url,
          description: art.short_teaser || art.title,
          published_at: art.published_at,
          published_date: art.published_date,
          rss_categories: art.rss_categories,
          thumbnail_url: art.thumbnail_url,
          authors: art.authors,
        });
      }
    }
    toSummarize = Array.from(byUrl.values()).sort((a, b) =>
      b.published_at.localeCompare(a.published_at)
    );
  } else if (refreshLatest) {
    // Re-generate top N latest articles with full body + 3-Pass reading_guide
    const latestSet = new Set(
      rssItems.slice(0, REFRESH_LATEST_NEWS_COUNT).map((item) => item.url)
    );
    toSummarize = rssItems
      .filter((item) => {
        if (latestSet.has(item.url)) return true;
        const cached = cachedByUrl.get(item.url);
        return !cached || cached.layman_story.length < 2 || !cached.reading_guide;
      })
      .slice(0, MAX_NEW_PER_RUN);
  } else {
    toSummarize = rssItems
      .filter((item) => {
        const cached = cachedByUrl.get(item.url);
        return !cached || cached.layman_story.length < 2 || !cached.reading_guide;
      })
      .slice(0, MAX_NEW_PER_RUN);
  }

  console.log(`Articles to fetch full body & summarize: ${toSummarize.length}`);

  const aiResultsMap = new Map<string, GeminiNewsPayload>();

  if (GEMINI_API_KEY && toSummarize.length > 0) {
    console.log(`Fetching full blog.google article bodies for ${toSummarize.length} items...`);
    await enrichItemsWithFullArticles(toSummarize);
    const fullCount = toSummarize.filter((i) => i.source_depth === "full_article").length;
    console.log(`  -> Extracted full article text for ${fullCount}/${toSummarize.length} items.`);

    console.log(
      `Summarizing ${toSummarize.length} news articles in batches of ${BATCH_SIZE}...`
    );
    for (let i = 0; i < toSummarize.length; i += BATCH_SIZE) {
      const batch = toSummarize.slice(i, i + BATCH_SIZE);
      console.log(
        `  -> Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toSummarize.length / BATCH_SIZE)}`
      );
      const batchMap = await processBatchWithGemini(batch);
      for (const [k, v] of batchMap.entries()) {
        aiResultsMap.set(k, v);
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
  } else if (!GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY not set — preserving cached Thai summaries.");
  }

  const finalMap = new Map<string, NewsArticleData>();
  // Preserve existing cached articles that still pass the tightened AI/Tech filter
  for (const [url, art] of cachedByUrl.entries()) {
    if (isRelevantAITechItem(art.title, art.short_teaser, art.rss_categories, art.url)) {
      finalMap.set(url, art);
    }
  }

  // Merge both live RSS items and any backfilled cached articles
  const itemsToMerge = new Map<string, RawRSSItem>();
  for (const item of rssItems) {
    itemsToMerge.set(item.url, item);
  }
  for (const item of toSummarize) {
    if (!itemsToMerge.has(item.url)) {
      itemsToMerge.set(item.url, item);
    }
  }

  for (const item of itemsToMerge.values()) {
    const cached = cachedByUrl.get(item.url);
    const aiData = aiResultsMap.get(item.id);

    if (aiData) {
      const built = buildNewsObject(item, aiData);
      if (cached?.first_seen_at) {
        built.first_seen_at = cached.first_seen_at;
      }
      finalMap.set(item.url, built);
    } else if (cached) {
      finalMap.set(item.url, {
        ...cached,
        thumbnail_url: item.thumbnail_url || cached.thumbnail_url,
        first_seen_at: cached.first_seen_at || cached.updated_at,
        updated_at: new Date().toISOString(),
      });
    } else if (process.env.ALLOW_NEWS_FALLBACK === "true") {
      const built = buildNewsObject(item, null);
      finalMap.set(item.url, built);
    }
  }

  const finalArticles = Array.from(finalMap.values())
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, MAX_ARTICLES);

  if (finalArticles.length > 0) {
    const payload: NewsFeedData = {
      updated_at: new Date().toISOString(),
      articles: finalArticles,
    };
    await fs.writeFile(NEWS_FILE_PATH, JSON.stringify(payload, null, 2));
    console.log(
      `✅ Saved ${finalArticles.length} AI Lab News articles to ${NEWS_FILE_PATH}`
    );
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch(console.error);
}
