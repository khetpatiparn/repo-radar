import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  NewsArticleSchema,
  NEWS_CATEGORIES,
  type NewsArticleData,
  type NewsCategory,
  type NewsFeedData,
} from "../src/types";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NEWS_FILE_PATH = path.join(process.cwd(), "src/data/news.json");
const MAX_ARTICLES = 45;
const MAX_NEW_PER_RUN = 24;
const BATCH_SIZE = 4;

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
  published_at: string;
  published_date: string;
  rss_categories: string[];
  thumbnail_url: string | null;
  authors: string[];
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i");
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1]).trim() : "";
}

function extractAllTags(block: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "gi");
  const results: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(block)) !== null) {
    const val = decodeXmlEntities(match[1]).trim();
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

function isRelevantAITechItem(title: string, description: string, categories: string[], url: string): boolean {
  const combined = `${title} ${description} ${categories.join(" ")} ${url}`.toLowerCase();
  const shortTokens = [/\bai\b/, /\bapi\b/, /\bxr\b/, /\btpu\b/, /\bml\b/, /\bllm\b/];
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
    "search",
    "workspace",
  ];
  const excludedKeywords = [
    "veterans-day",
    "energy-impact-program",
    "esther-mahlangu",
    "phd-fellows",
    "invalid-traffic-overview",
    "henry-cavill",
    "new-google-domains",
  ];
  if (excludedKeywords.some((kw) => url.toLowerCase().includes(kw))) {
    return false;
  }
  return (
    shortTokens.some((re) => re.test(combined)) ||
    phraseKeywords.some((kw) => combined.includes(kw))
  );
}

function inferNewsCategory(title: string, description: string, rssCategories: string[]): NewsCategory {
  const text = `${title} ${description} ${rssCategories.join(" ")}`.toLowerCase();
  if (
    rssCategories.some((c) => /gemini models/i.test(c)) ||
    text.includes("gemini 4") ||
    text.includes("gemini 3") ||
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

async function fetchGoogleBlogRSS(): Promise<RawRSSItem[]> {
  const itemsByUrl = new Map<string, RawRSSItem>();

  for (const feedUrl of RSS_FEEDS) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "RepoRadar-NewsSync/1.0" },
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
          const name = decodeXmlEntities(aMatch[1]).trim();
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
}

async function processBatchWithGemini(items: RawRSSItem[]): Promise<Map<string, GeminiNewsPayload>> {
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
    summary: item.description.slice(0, 1600),
  }));

  const prompt = `
You are a senior AI tech journalist and editor writing for Thai developers, product builders, and tech readers.
Convert the following ${newsInput.length} official Google Blog AI/Tech news items into rich, engaging, easy-to-read Thai editorial news articles.

IMPORTANT RULES:
1. Write ALL descriptive text in natural, engaging **Thai (ภาษาไทย)** that is easy to scan and read like a quality tech newspaper (keep product/model names like Gemini, Google Cloud, AI Studio, API, Agentic, Chrome, Pixel in English).
2. "category" MUST be strictly one of:
   - "Gemini & Models"
   - "Google Research & Labs"
   - "Cloud & Developer Tools"
   - "AI Products & Ecosystem"
3. "layman_story" MUST be an array of 3 crisp paragraphs in Thai:
   - Paragraph 1: ประกาศนี้คืออะไร มีบริบทหรือปัญหาเดิมอะไรที่ Google กำลังแก้
   - Paragraph 2: ความสามารถใหม่หรือเทคโนโลยีเบื้องหลังที่เปิดตัวทำงานอย่างไร อธิบายให้เห็นภาพชัดเจน
   - Paragraph 3: ผลกระทบต่อนักพัฒนา ธุรกิจ หรือผู้ใช้งานทั่วไป และทิศทางต่อไปที่น่าจับตา
4. "actionable_playbook" MUST contain 3 distinct, practical ways readers can use or benefit from this news across different roles.

Input News JSON:
${JSON.stringify(newsInput, null, 2)}

Return a JSON array matching this exact structure:
[
  {
    "id": "<item id>",
    "category": "<one of the 4 categories>",
    "reading_time_minutes": 3,
    "hook_headline": "พาดหัวข่าวภาษาไทยที่คมชัด น่าสนใจ และบอกประเด็นสำคัญทันที",
    "short_teaser": "สรุปเกริ่นนำสั้นๆ 2 ประโยคว่าประกาศนี้มีอะไรใหม่และสำคัญอย่างไร (ภาษาไทย)",
    "tldr_takeaways": [
      "ประเด็นสำคัญข้อที่ 1 (ภาษาไทย)",
      "ประเด็นสำคัญข้อที่ 2 (ภาษาไทย)",
      "ประเด็นสำคัญข้อที่ 3 (ภาษาไทย)"
    ],
    "layman_story": [
      "ย่อหน้าที่ 1: บริบทและที่มาของข่าว...",
      "ย่อหน้าที่ 2: รายละเอียดฟีเจอร์หรือความก้าวหน้าใหม่...",
      "ย่อหน้าที่ 3: ผลกระทบและสิ่งที่น่าจับตาต่อจากนี้..."
    ],
    "impact_comparison": {
      "before": "ก่อนอัปเดต: ข้อจำกัดหรือขั้นตอนเดิมที่ผู้ใช้งาน/นักพัฒนาต้องเจอ (ภาษาไทย)",
      "after": "หลังอัปเดต: สิ่งที่ดีขึ้น เร็วขึ้น หรือทำได้ใหม่ทันทีหลังประกาศนี้ (ภาษาไทย)",
      "why_it_matters": "เหตุผลว่าทำไมอัปเดตนี้ถึงสำคัญต่อระบบนิเวศ AI และการพัฒนาซอฟต์แวร์ (ภาษาไทย)"
    },
    "actionable_playbook": [
      {
        "title": "แนวทางที่ 1 (ภาษาไทย)",
        "role": "สำหรับนักพัฒนา / AI Builder",
        "description": "วิธีทดลองใช้งานหรือเชื่อมต่อเข้ากับโปรเจกต์ (ภาษาไทย)",
        "example": "ตัวอย่างการนำไปใช้งานจริง (ภาษาไทย)"
      },
      {
        "title": "แนวทางที่ 2 (ภาษาไทย)",
        "role": "สำหรับทีม Product / ธุรกิจ",
        "description": "วิธีประเมินความคุ้มค่าหรือต่อยอดเป็นฟีเจอร์ใหม่ (ภาษาไทย)",
        "example": "ตัวอย่างการนำไปใช้งานจริง (ภาษาไทย)"
      },
      {
        "title": "แนวทางที่ 3 (ภาษาไทย)",
        "role": "สำหรับผู้ใช้งานทั่วไป / องค์กร",
        "description": "วิธีนำเครื่องมือนี้มาช่วยลดเวลาทำงานประจำวัน (ภาษาไทย)",
        "example": "ตัวอย่างการนำไปใช้งานจริง (ภาษาไทย)"
      }
    ],
    "key_highlights": {
      "whats_new": [
        "สิ่งใหม่ที่โดดเด่นข้อที่ 1 (ภาษาไทย)",
        "สิ่งใหม่ที่โดดเด่นข้อที่ 2 (ภาษาไทย)"
      ],
      "watchouts": [
        "ข้อจำกัดหรือสิ่งที่ต้องติดตามเพิ่มเติม ข้อที่ 1 (ภาษาไทย)",
        "ข้อจำกัดหรือสิ่งที่ต้องติดตามเพิ่มเติม ข้อที่ 2 (ภาษาไทย)"
      ]
    }
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

function buildNewsObject(item: RawRSSItem, aiData: GeminiNewsPayload | null): NewsArticleData {
  const fallbackCategory = inferNewsCategory(item.title, item.description, item.rss_categories);
  const category: NewsCategory =
    aiData?.category && NEWS_CATEGORIES.includes(aiData.category)
      ? aiData.category
      : fallbackCategory;
  const source = inferSourceLabel(item.rss_categories);

  const built: NewsArticleData = {
    id: item.id,
    title: item.title,
    url: item.url,
    source,
    published_date: item.published_date,
    published_at: item.published_at,
    updated_at: new Date().toISOString(),
    authors: item.authors,
    rss_categories: item.rss_categories,
    category,
    thumbnail_url: item.thumbnail_url,
    reading_time_minutes: aiData?.reading_time_minutes || 3,
    hook_headline:
      aiData?.hook_headline ||
      `${source} อัปเดตใหม่: ${item.title}`,
    short_teaser:
      aiData?.short_teaser ||
      item.description ||
      `อัปเดตล่าสุดจาก ${source} ในหมวด ${category} ที่นักพัฒนาและสาย AI ควรติดตาม`,
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
        ? aiData.layman_story.slice(0, 3)
        : [
            item.description || item.title,
            `การอัปเดตครั้งนี้จัดอยู่ในกลุ่ม ${category} เพื่อยกระดับประสบการณ์ทั้งสำหรับนักพัฒนาและผู้ใช้งานทั่วไป`,
          ],
    impact_comparison: {
      before:
        aiData?.impact_comparison?.before ||
        "ก่อนอัปเดต: ผู้ใช้งานและนักพัฒนาต้องอาศัยเครื่องมือแยกส่วนหรือขั้นตอนที่ซับซ้อนกว่าเดิม",
      after:
        aiData?.impact_comparison?.after ||
        "หลังอัปเดต: มีความสามารถใหม่จาก Google เข้ามาช่วยให้ทำงานได้สะดวกและมีประสิทธิภาพมากขึ้น",
      why_it_matters:
        aiData?.impact_comparison?.why_it_matters ||
        "สะท้อนทิศทางการพัฒนาผลิตภัณฑ์และโมเดล AI ของ Google ที่มุ่งสู่การใช้งานจริงในวงกว้าง",
    },
    actionable_playbook:
      Array.isArray(aiData?.actionable_playbook) && aiData.actionable_playbook.length > 0
        ? aiData.actionable_playbook.slice(0, 3)
        : [
            {
              title: "ติดตามสเปกและเอกสารทางการ",
              role: "สำหรับนักพัฒนา / AI Builder",
              description: "ตรวจสอบรายละเอียด API, ความเข้ากันได้ และเงื่อนไขการใช้งานจากประกาศต้นฉบับ",
              example: "อ่านคู่มือเริ่มต้นใน Google AI Studio หรือ Blog ต้นทางเพื่อเตรียมทดสอบ",
            },
            {
              title: "ประเมินโอกาสต่อยอดเข้ากับโปรดักต์",
              role: "สำหรับทีม Product / ธุรกิจ",
              description: "พิจารณาว่าฟีเจอร์ใหม่นี้ช่วยลดต้นทุนหรือเพิ่มคุณค่าให้ผู้ใช้งานในระบบเดิมได้อย่างไร",
              example: "ออกแบบฟีเจอร์ต้นแบบขนาดเล็กเพื่อวัดผลความพึงพอใจของผู้ใช้",
            },
            {
              title: "ทดลองใช้ในเวิร์กโฟลว์ประจำวัน",
              role: "สำหรับผู้ใช้งานทั่วไป / องค์กร",
              description: "อัปเดตแอปหรือบริการที่เกี่ยวข้องเพื่อลองใช้ความสามารถใหม่ทันทีที่เปิดให้ใช้งาน",
              example: "นำความสามารถด้านสรุปข้อมูลหรือช่วยค้นหามาใช้ลดเวลาทำงานประจำวัน",
            },
          ],
    key_highlights: {
      whats_new:
        Array.isArray(aiData?.key_highlights?.whats_new) &&
        aiData.key_highlights.whats_new.length > 0
          ? aiData.key_highlights.whats_new.slice(0, 2)
          : [
              `เปิดตัวความสามารถใหม่ในหมวด ${category}`,
              `อัปเดตโดยตรงจากทีม ${source}`,
            ],
      watchouts:
        Array.isArray(aiData?.key_highlights?.watchouts) &&
        aiData.key_highlights.watchouts.length > 0
          ? aiData.key_highlights.watchouts.slice(0, 2)
          : [
              "ตรวจสอบการเปิดให้บริการตามภูมิภาคและภาษาที่รองรับ",
              "ติดตามราคาและโควตาการใช้งานจริงหากนำไปใช้ในระดับโปรดักชัน",
            ],
    },
  };

  return NewsArticleSchema.parse(built);
}

async function main() {
  console.log("📰 Starting Google Official Blog RSS Sync...");

  const cachedByUrl = await loadExistingNews();
  console.log(`Loaded ${cachedByUrl.size} cached news articles.`);

  const rssItems = await fetchGoogleBlogRSS();
  console.log(`Found ${rssItems.length} relevant AI/Tech news items from Google Blog RSS.`);

  if (rssItems.length === 0) {
    console.log("No RSS items fetched. Keeping existing news.json intact.");
    return;
  }

  const uncached = rssItems.filter((item) => {
    const cached = cachedByUrl.get(item.url);
    return !cached || cached.layman_story.length < 2;
  });
  console.log(`New uncached articles to summarize: ${uncached.length}`);

  const aiResultsMap = new Map<string, GeminiNewsPayload>();
  const toSummarize = uncached.slice(0, MAX_NEW_PER_RUN);

  if (GEMINI_API_KEY && toSummarize.length > 0) {
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
  // Preserve existing cached articles first
  for (const [url, art] of cachedByUrl.entries()) {
    finalMap.set(url, art);
  }

  // Add/update from latest RSS
  for (const item of rssItems) {
    const cached = cachedByUrl.get(item.url);
    const aiData = aiResultsMap.get(item.id);

    if (aiData) {
      const built = buildNewsObject(item, aiData);
      finalMap.set(item.url, built);
    } else if (cached) {
      finalMap.set(item.url, {
        ...cached,
        thumbnail_url: item.thumbnail_url || cached.thumbnail_url,
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
    console.log(`✅ Saved ${finalArticles.length} AI Lab News articles to ${NEWS_FILE_PATH}`);
  }
}

main().catch(console.error);
