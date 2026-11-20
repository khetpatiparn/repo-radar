import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import {
  PaperSchema,
  PAPER_CATEGORIES,
  type DeepReadingGuide,
  type PaperData,
  type PaperCategory,
  type PapersFeedData,
  type PaperDayBatch,
} from "../src/types";
import {
  DEEP_READING_JSON_SPEC,
  DEEP_READING_RULES,
  extractArxivHtmlHighlights,
  hasRefreshLatestFlag,
  sanitizeReadingGuide,
} from "./lib/deep-reading";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PAPERS_FILE_PATH = path.join(process.cwd(), "src/data/papers.json");
const MAX_ROLLING_DAYS = 7;
const BATCH_SIZE = 3; // Smaller batch to fit arXiv HTML + GitHub README context cleanly

interface HFDailyPaperItem {
  title: string;
  summary: string;
  publishedAt: string;
  thumbnail?: string;
  mediaUrls?: string[];
  numComments?: number;
  organization?: { name?: string; fullname?: string };
  paper: {
    id: string;
    title: string;
    summary: string;
    upvotes: number;
    publishedAt: string;
    submittedOnDailyAt?: string;
    githubRepo?: string;
    githubStars?: number;
    projectPage?: string;
    authors?: Array<{ name: string }>;
    organization?: { name?: string; fullname?: string };
  };
}

interface PaperSourceContext {
  arxivHighlights: string;
  githubReadme: string;
  sourceDepth: DeepReadingGuide["source_depth"];
}

function inferCategoryFromText(title: string, summary: string): PaperCategory {
  const text = `${title} ${summary}`.toLowerCase();
  if (
    text.includes("agent") ||
    text.includes("memory") ||
    text.includes("tool use") ||
    text.includes("multi-agent") ||
    text.includes("planning")
  ) {
    return "AI Agents & Memory";
  }
  if (
    text.includes("quantiz") ||
    text.includes("serving") ||
    text.includes("inference") ||
    text.includes("infra") ||
    text.includes("distill") ||
    text.includes("pruning") ||
    text.includes("kernel") ||
    text.includes("acceleration")
  ) {
    return "Infra, Speed & Quantization";
  }
  if (
    text.includes("image") ||
    text.includes("video") ||
    text.includes("vision") ||
    text.includes("audio") ||
    text.includes("speech") ||
    text.includes("waveform") ||
    text.includes("multimodal") ||
    text.includes("3d") ||
    text.includes("diffusion")
  ) {
    return "Vision, Audio & Multimodal";
  }
  if (
    text.includes("benchmark") ||
    text.includes("code") ||
    text.includes("tabular") ||
    text.includes("dataset") ||
    text.includes("evaluation")
  ) {
    return "Coding, Data & Benchmarks";
  }
  if (
    text.includes("protein") ||
    text.includes("robot") ||
    text.includes("dexterous") ||
    text.includes("embodied") ||
    text.includes("finance") ||
    text.includes("medical") ||
    text.includes("game") ||
    text.includes("molecule")
  ) {
    return "Applied AI & Science";
  }
  return "LLM & Reasoning";
}

async function fetchHFDailyPapers(): Promise<HFDailyPaperItem[]> {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers?limit=100", {
      headers: { "User-Agent": "RepoRadar-PaperSync/2.0" },
    });
    if (!res.ok) {
      throw new Error(`HF API returned ${res.status}`);
    }
    return (await res.json()) as HFDailyPaperItem[];
  } catch (error) {
    console.error("Error fetching Hugging Face Daily Papers:", error);
    return [];
  }
}

async function fetchArxivHtmlText(arxivId: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://arxiv.org/html/${arxivId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RepoRadar-PaperSync/2.0)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });
    if (!res.ok) return "";
    const html = await res.text();
    const extracted = extractArxivHtmlHighlights(html, 5200);
    return extracted.length >= 400 ? extracted : "";
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPaperGithubReadme(githubUrl: string | undefined): Promise<string> {
  if (!githubUrl) return "";
  const match = githubUrl.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!match) return "";
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "");

  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoRadar-PaperSync/2.0",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
      signal: controller.signal,
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { content?: string };
    if (!data?.content) return "";
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 2600);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

async function enrichPapersWithSourceContext(
  items: HFDailyPaperItem[]
): Promise<Map<string, PaperSourceContext>> {
  const contextMap = new Map<string, PaperSourceContext>();
  for (const item of items) {
    const [arxivHighlights, githubReadme] = await Promise.all([
      fetchArxivHtmlText(item.paper.id),
      fetchPaperGithubReadme(item.paper.githubRepo),
    ]);

    let sourceDepth: DeepReadingGuide["source_depth"] = "abstract_only";
    if (arxivHighlights && githubReadme) {
      sourceDepth = "arxiv_and_readme";
    } else if (arxivHighlights) {
      sourceDepth = "arxiv_html";
    } else if (githubReadme) {
      sourceDepth = "readme_and_issues";
    }

    contextMap.set(item.paper.id, {
      arxivHighlights,
      githubReadme,
      sourceDepth,
    });
    await new Promise((r) => setTimeout(r, 200));
  }
  return contextMap;
}

async function loadExistingPapers(): Promise<{
  existingDays: PaperDayBatch[];
  cachedById: Map<string, PaperData>;
}> {
  const cachedById = new Map<string, PaperData>();
  let existingDays: PaperDayBatch[] = [];

  try {
    const raw = await fs.readFile(PAPERS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as PapersFeedData;
    if (parsed && Array.isArray(parsed.days)) {
      existingDays = parsed.days;
      for (const day of parsed.days) {
        for (const p of day.papers || []) {
          cachedById.set(p.id, p);
        }
      }
    }
  } catch {
    // No existing papers.json yet
  }

  return { existingDays, cachedById };
}

async function processBatchWithGemini(
  items: HFDailyPaperItem[],
  sourceContextMap: Map<string, PaperSourceContext>
): Promise<Map<string, Record<string, unknown>>> {
  const resultMap = new Map<string, Record<string, unknown>>();
  if (!GEMINI_API_KEY || items.length === 0) return resultMap;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
  ];

  const papersInput = items.map((item) => {
    const ctx = sourceContextMap.get(item.paper.id);
    return {
      id: item.paper.id,
      title: item.title || item.paper.title,
      organization:
        item.paper.organization?.fullname ||
        item.organization?.fullname ||
        null,
      upvotes: item.paper.upvotes || 0,
      github_url: item.paper.githubRepo || null,
      source_depth: ctx?.sourceDepth || "abstract_only",
      abstract: (item.summary || item.paper.summary || "").slice(0, 2000),
      arxiv_full_excerpts: ctx?.arxivHighlights || "",
      github_readme_excerpt: ctx?.githubReadme || "",
    };
  });

  const prompt = `
You are a senior Thai ML/AI research mentor explaining cutting-edge arXiv / Hugging Face papers to a solo Thai developer who wants to genuinely understand how the paper works (mental model, real benchmark numbers, jargon decoded, honest limitations, and what to try or learn next) — NOT hype or generic SaaS sales fluff.

Convert the following ${papersInput.length} AI research papers into deeply grounded 3-Pass Thai technical reading guides + a collapsed ready-to-share Facebook post draft.

${DEEP_READING_RULES}

IMPORTANT WRITING & STYLE RULES:
1. Write ALL descriptive text in natural, lucid, intellectually honest **Thai (ภาษาไทย)** (keep technical terms like LLM, Agent, LoRA, SFT, Quantization, Transformer, GPU, Benchmark, RAG in English).
2. Ground EVERY technical claim and metric in "abstract", "arxiv_full_excerpts", or "github_readme_excerpt". If a benchmark number or hardware requirement is stated in the excerpts, cite it accurately! If not stated, explicitly say "ต้นฉบับไม่ระบุตัวเลข".
3. "category" MUST be strictly one of:
   - "AI Agents & Memory"
   - "LLM & Reasoning"
   - "Vision, Audio & Multimodal"
   - "Infra, Speed & Quantization"
   - "Coding, Data & Benchmarks"
   - "Applied AI & Science"
4. "layman_story" MUST be an array of 3-4 clear, deep editorial paragraphs in Thai (each 3-4 sentences):
   - Paragraph 1 (Problem & Why Existing Approaches Fail): คอขวดเดิมคืออะไร ทำไมวิธีเก่าถึงพัง ช้า หรือแพง
   - Paragraph 2 (Core Idea & Mental Model): เปเปอร์นี้แก้ยังไง อธิบายแก่นไอเดียด้วยภาพจำ/อนาโลยีที่นักพัฒนาเข้าใจทันที
   - Paragraph 3 (Real Experimental Evidence): ผลทดลองและตัวเลขจริงจากเปเปอร์ (เทียบ Baseline อะไร ได้คะแนน/ความเร็วเพิ่มแค่ไหน)
   - Paragraph 4 (Honest Assessment): งานนี้เอาไปใช้จริงได้เลยไหม หรือยังเป็นแค่งานวิจัยพื้นฐาน และน่าจับตาอย่างไร
5. "use_cases" MUST contain 2-3 concrete engineering/technical application scenarios (keep schema compatible; focus on real engineering problems rather than generic "สร้าง SaaS").
6. "facebook_post" MUST be a clean Thai summary draft (~180-280 words) grounded strictly in facts from the paper, with bullet points and 3-5 hashtags.

Input Papers JSON:
${JSON.stringify(papersInput, null, 2)}

Return a JSON array where each element matches this exact structure:
[
  {
    "id": "<paper id>",
    "category": "<one of the 6 categories>",
    "reading_time_minutes": 5,
    "hook_headline": "พาดหัวภาษาไทยที่คมชัด บอกปัญหาและวิธีแก้หลักของเปเปอร์นี้ทันที (ไม่เวอร์เกินจริง)",
    "short_teaser": "เกริ่นนำ 2 ประโยคที่สรุปปัญหา กลไกใหม่ และผลลัพธ์จริงจากเปเปอร์ (ภาษาไทย)",
    "tldr_takeaways": [
      "สรุปแก่นข้อที่ 1 แบบเจาะจง (ภาษาไทย)",
      "สรุปแก่นข้อที่ 2 พร้อมวิธีทำหรือตัวเลขจริง (ภาษาไทย)",
      "สรุปแก่นข้อที่ 3 พร้อมข้อจำกัดหรือสถานะโค้ด (ภาษาไทย)"
    ],
    "layman_story": [
      "ย่อหน้าที่ 1: ปัญหาเดิมและคอขวดที่วิธีเก่าติดอยู่...",
      "ย่อหน้าที่ 2: กลไกหลักและภาพจำการทำงานของวิธีใหม่...",
      "ย่อหน้าที่ 3: ผลทดลอง ตัวเลขเปรียบเทียบจริงจากเปเปอร์...",
      "ย่อหน้าที่ 4: ประเมินตรงไปตรงมาว่าพร้อมใช้จริงแค่ไหน..."
    ],
    "impact_comparison": {
      "before": "วิธีเดิม: ต้องทำอย่างไร และติดข้อจำกัดอะไรบ้าง (ภาษาไทย)",
      "after": "วิธีใหม่จากเปเปอร์นี้: เปลี่ยนกลไกอย่างไร และดีขึ้นตรงไหนตามผลทดลอง (ภาษาไทย)",
      "why_it_matters": "ทำไมแนวคิดนี้ถึงสำคัญต่อการพัฒนา AI ในทางปฏิบัติ (ภาษาไทย)"
    },
    "use_cases": [
      {
        "title": "การประยุกต์เชิงวิศวกรรมที่ 1 (ภาษาไทย)",
        "role": "งานด้าน AI / ML Engineering",
        "description": "วิธีนำแนวคิดหรือโค้ดไปปรับใช้กับโจทย์เทคนิคจริง (ภาษาไทย)",
        "example": "ตัวอย่างสถานการณ์ใช้งานจริง (ภาษาไทย)"
      },
      {
        "title": "การประยุกต์เชิงวิศวกรรมที่ 2 (ภาษาไทย)",
        "role": "โปรเจกต์/ระบบที่เกี่ยวข้อง",
        "description": "โจทย์ประเภทไหนที่จะได้ประโยชน์จากเทคนิคนี้มากที่สุด (ภาษาไทย)",
        "example": "ตัวอย่างโจทย์จริง (ภาษาไทย)"
      }
    ],
    "community_pulse": {
      "summary": "สรุปจุดแข็งและข้อควรระวังของเปเปอร์นี้ในมุมนักวิจัย/นักพัฒนา (ภาษาไทย)",
      "praises": [
        "จุดแข็งเชิงเทคนิคที่โดดเด่น ข้อที่ 1 (ภาษาไทย)",
        "จุดแข็งเชิงเทคนิคที่โดดเด่น ข้อที่ 2 (ภาษาไทย)"
      ],
      "critiques": [
        "ข้อจำกัด/จุดอ่อน/ต้นทุนแฝงที่ต้องรู้ ข้อที่ 1 (ภาษาไทย)",
        "ข้อจำกัด/จุดอ่อน/ต้นทุนแฝงที่ต้องรู้ ข้อที่ 2 (ภาษาไทย)"
      ],
      "hype_score": 8.0
    },
    ${DEEP_READING_JSON_SPEC},
    "facebook_post": "ฉบับร่างโพสต์ Facebook ภาษาไทยพร้อมแชร์ในอนาคต อิงข้อมูลจริงจากเปเปอร์เท่านั้น"
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
        const arr = Array.isArray(parsed) ? parsed : parsed?.papers || [];
        for (const item of arr) {
          if (item && item.id) {
            resultMap.set(String(item.id), item as Record<string, unknown>);
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
          `[${modelName}] Paper batch attempt ${attempt} failed (${status ?? "error"}): ${errObj?.message || String(error)}`
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

function buildPaperObject(
  item: HFDailyPaperItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiData: any,
  dateStr: string,
  sourceDepth?: DeepReadingGuide["source_depth"]
): PaperData {
  const id = item.paper.id;
  const title = item.title || item.paper.title;
  const summary = item.summary || item.paper.summary || "";
  const org =
    item.paper.organization?.fullname ||
    item.organization?.fullname ||
    item.paper.organization?.name ||
    item.organization?.name ||
    null;
  const authors = (item.paper.authors || []).slice(0, 6).map((a) => a.name);
  const fallbackCategory = inferCategoryFromText(title, summary);
  const category: PaperCategory = PAPER_CATEGORIES.includes(aiData?.category)
    ? aiData.category
    : fallbackCategory;

  const nowIso = new Date().toISOString();
  const readingGuide = sanitizeReadingGuide(
    aiData?.reading_guide,
    sourceDepth || "abstract_only"
  );

  const full: PaperData = {
    id,
    title,
    authors,
    organization: org,
    upvotes: item.paper.upvotes || 0,
    num_comments: item.numComments || 0,
    published_date: dateStr,
    updated_at: nowIso,
    first_seen_at: nowIso,
    arxiv_url: `https://arxiv.org/abs/${id}`,
    pdf_url: `https://arxiv.org/pdf/${id}`,
    hf_url: `https://huggingface.co/papers/${id}`,
    github_url: item.paper.githubRepo || null,
    github_stars: item.paper.githubStars ?? null,
    project_url: item.paper.projectPage || null,
    thumbnail_url:
      item.thumbnail ||
      `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${id}.png`,
    media_urls: Array.isArray(item.mediaUrls) ? item.mediaUrls.slice(0, 4) : [],
    category,
    reading_time_minutes: aiData?.reading_time_minutes || 5,
    hook_headline:
      aiData?.hook_headline ||
      `เจาะลึก ${title}: นวัตกรรมใหม่ในกลุ่ม ${category}`,
    short_teaser:
      aiData?.short_teaser ||
      `งานวิจัยบน Hugging Face (${item.paper.upvotes || 0} Upvotes) นำเสนอแนวทางใหม่ในกลุ่ม ${category}`,
    tldr_takeaways:
      Array.isArray(aiData?.tldr_takeaways) && aiData.tldr_takeaways.length > 0
        ? aiData.tldr_takeaways.slice(0, 3)
        : [
            `นำเสนอสถาปัตยกรรมและแนวคิดใหม่สำหรับ ${category}`,
            `ผ่านการทดสอบและเทียบวัดผลบน Benchmark มาตรฐาน`,
            item.paper.githubRepo
              ? `มีซอร์สโค้ดเปิดให้ทดลองใช้งานจริงบน GitHub`
              : `เผยแพร่รายละเอียดการทดลองครบถ้วนบน arXiv และ Hugging Face`,
          ],
    layman_story:
      Array.isArray(aiData?.layman_story) && aiData.layman_story.length > 0
        ? aiData.layman_story.slice(0, 5)
        : [summary],
    impact_comparison: {
      before:
        aiData?.impact_comparison?.before ||
        "วิธีเดิมมีข้อจำกัดด้านความแม่นยำและใช้ทรัพยากรในการประมวลผลสูงเมื่อเจองานที่ซับซ้อน",
      after:
        aiData?.impact_comparison?.after ||
        "ลดข้อจำกัดเดิมด้วยวิธีคิดใหม่ที่ช่วยให้โมเดลทำงานได้มีประสิทธิภาพและเสถียรขึ้น",
      why_it_matters:
        aiData?.impact_comparison?.why_it_matters ||
        "ช่วยให้เข้าใจทิศทางการแก้คอขวดสำคัญในระบบ AI ยุคใหม่",
    },
    use_cases:
      Array.isArray(aiData?.use_cases) && aiData.use_cases.length > 0
        ? aiData.use_cases.slice(0, 3)
        : [
            {
              title: "ยกระดับประสิทธิภาพโมเดลในระบบจริง",
              role: "งานด้าน AI / ML Engineering",
              description: "นำแนวคิดจากเปเปอร์ไปปรับปรุง Pipeline การทำงานของ AI",
              example: "ประยุกต์ใช้กับระบบ Backend ที่ต้องการความแม่นยำสูง",
            },
          ],
    community_pulse: {
      summary:
        aiData?.community_pulse?.summary ||
        `ได้รับความสนใจจากคอมมูนิตี้นักวิจัยบน Hugging Face ด้วยคะแนนโหวต ${item.paper.upvotes || 0} Upvotes`,
      praises:
        Array.isArray(aiData?.community_pulse?.praises) &&
        aiData.community_pulse.praises.length > 0
          ? aiData.community_pulse.praises.slice(0, 2)
          : [
              "แนวคิดแก้ปัญหาได้ตรงจุดและมีผลการทดลองรองรับชัดเจน",
              "อธิบายขั้นตอนและสถาปัตยกรรมได้เข้าใจง่าย",
            ],
      critiques:
        Array.isArray(aiData?.community_pulse?.critiques) &&
        aiData.community_pulse.critiques.length > 0
          ? aiData.community_pulse.critiques.slice(0, 2)
          : [
              "ต้องทดสอบเพิ่มเติมเมื่อนำไปใช้กับข้อมูลภาษาอื่นหรือโดเมนเฉพาะทาง",
              "อาจต้องใช้ทรัพยากร GPU ในการปรับจูนเข้ากับงานจริง",
            ],
      hype_score:
        typeof aiData?.community_pulse?.hype_score === "number"
          ? Math.min(10, Math.max(0, aiData.community_pulse.hype_score))
          : Math.min(
              9.5,
              Math.max(
                6.5,
                Number(
                  (6.5 + Math.log10((item.paper.upvotes || 1) + 1) * 1.4).toFixed(1)
                )
              )
            ),
    },
    reading_guide: readingGuide,
    facebook_post:
      typeof aiData?.facebook_post === "string" &&
      aiData.facebook_post.trim().length > 0
        ? aiData.facebook_post.trim()
        : undefined,
  };

  return PaperSchema.parse(full);
}

async function main() {
  const refreshLatest = hasRefreshLatestFlag();
  console.log(
    `Starting RepoRadar Daily Papers Pipeline...${refreshLatest ? " [REFRESH LATEST MODE]" : ""}`
  );

  const { existingDays, cachedById } = await loadExistingPapers();
  const hfItems = await fetchHFDailyPapers();

  if (hfItems.length === 0) {
    console.log("No papers fetched from Hugging Face API. Exiting.");
    return;
  }

  // Group fetched items by date (YYYY-MM-DD of submittedOnDailyAt or publishedAt)
  const groupedByDate = new Map<string, HFDailyPaperItem[]>();
  for (const item of hfItems) {
    if (!item?.paper?.id) continue;
    const rawDate =
      item.paper.submittedOnDailyAt || item.publishedAt || new Date().toISOString();
    const dateStr = rawDate.slice(0, 10);
    const list = groupedByDate.get(dateStr) || [];
    list.push(item);
    groupedByDate.set(dateStr, list);
  }

  // Sort dates newest first, take top 2 active dates from API to refresh, merge with existing rolling 7 days
  const apiDates = Array.from(groupedByDate.keys()).sort((a, b) =>
    b.localeCompare(a)
  );
  const datesToProcess = apiDates.slice(0, 2);
  const latestDateStr = datesToProcess[0];

  const updatedDaysMap = new Map<string, PaperData[]>();
  for (const oldDay of existingDays) {
    updatedDaysMap.set(oldDay.date, oldDay.papers);
  }

  for (const dateStr of datesToProcess) {
    const dayItems = (groupedByDate.get(dateStr) || []).sort(
      (a, b) => (b.paper.upvotes || 0) - (a.paper.upvotes || 0)
    );

    console.log(`Date ${dateStr}: found ${dayItems.length} papers.`);

    const forceRefreshDay = refreshLatest && dateStr === latestDateStr;
    const needGemini: HFDailyPaperItem[] = [];
    for (const item of dayItems) {
      const existing = cachedById.get(item.paper.id);
      if (forceRefreshDay || !existing || existing.layman_story.length < 3) {
        needGemini.push(item);
      }
    }

    const aiResultsMap = new Map<string, Record<string, unknown>>();
    let sourceContextMap = new Map<string, PaperSourceContext>();

    if (GEMINI_API_KEY && needGemini.length > 0) {
      console.log(
        `Fetching arXiv HTML & GitHub READMEs for ${needGemini.length} papers...`
      );
      sourceContextMap = await enrichPapersWithSourceContext(needGemini);
      const enrichedCount = Array.from(sourceContextMap.values()).filter(
        (c) => c.sourceDepth !== "abstract_only"
      ).length;
      console.log(
        `  -> Enriched ${enrichedCount}/${needGemini.length} papers beyond abstract.`
      );

      console.log(
        `Processing ${needGemini.length} papers for ${dateStr} in batches of ${BATCH_SIZE}...`
      );
      for (let i = 0; i < needGemini.length; i += BATCH_SIZE) {
        const batch = needGemini.slice(i, i + BATCH_SIZE);
        console.log(
          `  -> Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needGemini.length / BATCH_SIZE)} (${batch.map((b) => b.paper.id).join(", ")})`
        );
        const batchMap = await processBatchWithGemini(batch, sourceContextMap);
        for (const [k, v] of batchMap.entries()) {
          aiResultsMap.set(k, v);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const dayPapers: PaperData[] = [];
    for (const item of dayItems) {
      const cached = cachedById.get(item.paper.id);
      const aiData = aiResultsMap.get(item.paper.id);

      if (aiData) {
        const sourceDepth = sourceContextMap.get(item.paper.id)?.sourceDepth;
        const built = buildPaperObject(item, aiData, dateStr, sourceDepth);
        if (cached?.first_seen_at) {
          built.first_seen_at = cached.first_seen_at;
        }
        dayPapers.push(built);
        cachedById.set(built.id, built);
      } else if (cached && cached.layman_story.length >= 3) {
        dayPapers.push({
          ...cached,
          upvotes: item.paper.upvotes || cached.upvotes,
          num_comments: item.numComments ?? cached.num_comments,
          github_url: item.paper.githubRepo || cached.github_url,
          github_stars: item.paper.githubStars ?? cached.github_stars,
          project_url: item.paper.projectPage || cached.project_url,
          first_seen_at: cached.first_seen_at || cached.updated_at,
          updated_at: new Date().toISOString(),
        });
      } else if (cached) {
        dayPapers.push({
          ...cached,
          upvotes: item.paper.upvotes || cached.upvotes,
          num_comments: item.numComments ?? cached.num_comments,
          first_seen_at: cached.first_seen_at || cached.updated_at,
          updated_at: new Date().toISOString(),
        });
      } else if (process.env.ALLOW_PAPER_FALLBACK === "true") {
        const built = buildPaperObject(item, null, dateStr, "abstract_only");
        dayPapers.push(built);
        cachedById.set(built.id, built);
      }
    }

    if (dayPapers.length > 0) {
      updatedDaysMap.set(dateStr, dayPapers);
    }
  }

  const finalDays: PaperDayBatch[] = Array.from(updatedDaysMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, MAX_ROLLING_DAYS)
    .map(([date, papers]) => ({
      date,
      papers: papers.sort((a, b) => b.upvotes - a.upvotes),
    }));

  if (finalDays.length > 0) {
    const payload: PapersFeedData = {
      updated_at: new Date().toISOString(),
      days: finalDays,
    };
    await fs.writeFile(PAPERS_FILE_PATH, JSON.stringify(payload, null, 2));
    console.log(
      `✅ Saved ${finalDays.length} days of papers (${finalDays.reduce((acc, d) => acc + d.papers.length, 0)} total papers) to ${PAPERS_FILE_PATH}`
    );
  }
}

main().catch(console.error);
