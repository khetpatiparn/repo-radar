import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import {
  PaperSchema,
  PAPER_CATEGORIES,
  type PaperData,
  type PaperCategory,
  type PapersFeedData,
  type PaperDayBatch,
} from "../src/types";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAPERS_FILE_PATH = path.join(process.cwd(), "src/data/papers.json");
const MAX_ROLLING_DAYS = 7;
const BATCH_SIZE = 4;

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
      headers: { "User-Agent": "RepoRadar-PaperSync/1.0" },
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

async function processBatchWithGemini(items: HFDailyPaperItem[]): Promise<Map<string, any>> {
  const resultMap = new Map<string, any>();
  if (!GEMINI_API_KEY || items.length === 0) return resultMap;

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
  ];

  const papersInput = items.map((item) => ({
    id: item.paper.id,
    title: item.title || item.paper.title,
    organization:
      item.paper.organization?.fullname ||
      item.organization?.fullname ||
      null,
    upvotes: item.paper.upvotes || 0,
    has_github: Boolean(item.paper.githubRepo),
    abstract: (item.summary || item.paper.summary || "").slice(0, 1800),
  }));

  const prompt = `
You are a senior AI research communicator and tech editor writing for Thai developers, builders, and tech enthusiasts.
Convert the following ${papersInput.length} AI research papers into engaging, easy-to-read, deeply insightful Thai editorial articles.

IMPORTANT RULES:
1. Write ALL descriptive text in natural, engaging **Thai (ภาษาไทย)** that a normal person or software builder can easily understand without academic jargon (technical terms like LLM, Agent, Quantization, Transformer, GPU, API, Fine-tune, Benchmark can remain in English).
2. "category" MUST be strictly one of:
   - "AI Agents & Memory"
   - "LLM & Reasoning"
   - "Vision, Audio & Multimodal"
   - "Infra, Speed & Quantization"
   - "Coding, Data & Benchmarks"
   - "Applied AI & Science"
3. "layman_story" MUST be an array of 3 rich paragraphs in Thai:
   - Paragraph 1: ปัญหาเดิมคืออะไร ทำไมวิธีเก่าถึงตันหรือมีข้อจำกัดในชีวิตจริง
   - Paragraph 2: เปเปอร์นี้คิดค้นวิธีใหม่อะไรขึ้นมา อธิบายเปรียบเทียบให้เห็นภาพง่ายๆ เหมือนเล่าให้เพื่อนฟัง
   - Paragraph 3: ผลลัพธ์ที่ได้เจ๋งแค่ไหน แม่นยำขึ้นหรือเร็วขึ้นยังไง และทำไมคนในวงการถึงตื่นเต้น
4. "use_cases" MUST contain 3 distinct, concrete real-world applications across different roles (e.g., นักพัฒนา/วิศวกร AI, ธุรกิจ/สร้างโปรดักต์ SaaS, และการใช้งานจริงในสายงานเฉพาะทาง).

Input Papers JSON:
${JSON.stringify(papersInput, null, 2)}

Return a JSON array where each element matches this exact structure:
[
  {
    "id": "<paper id>",
    "category": "<one of the 6 categories>",
    "reading_time_minutes": 4,
    "hook_headline": "พาดหัวภาษาไทยที่น่าดึงดูด ชวนกดอ่าน สรุปจุดเปลี่ยนสำคัญของเปเปอร์นี้ให้เข้าใจทันที",
    "short_teaser": "เกริ่นนำสั้นๆ 2 ประโยคที่สรุปว่าเปเปอร์นี้แก้ปัญหาอะไรและทำไมคุณถึงควรสนใจ (ภาษาไทย)",
    "tldr_takeaways": [
      "สรุปประเด็นสำคัญข้อที่ 1 แบบเข้าใจทันที (ภาษาไทย)",
      "สรุปประเด็นสำคัญข้อที่ 2 แบบเข้าใจทันที (ภาษาไทย)",
      "สรุปประเด็นสำคัญข้อที่ 3 แบบเข้าใจทันที (ภาษาไทย)"
    ],
    "layman_story": [
      "ย่อหน้าที่ 1: เล่าถึงปัญหาเดิมที่คนทำ AI หรือผู้ใช้งานต้องเจอ...",
      "ย่อหน้าที่ 2: อธิบายเทคนิคหรือแนวคิดใหม่ของเปเปอร์นี้แบบภาษาคนทั่วไป...",
      "ย่อหน้าที่ 3: สรุปผลการทดลองและจุดเด่นที่ทำให้วิธีนี้เหนือกว่าวิธีเดิม..."
    ],
    "impact_comparison": {
      "before": "เมื่อก่อน: ต้องทำอย่างไร และมีข้อเสียหรือต้นทุนที่แพงอย่างไร (ภาษาไทย)",
      "after": "หลังจากมีเปเปอร์นี้: เปลี่ยนไปอย่างไร เร็วขึ้น แม่นขึ้น หรือประหยัดขึ้นแค่ไหน (ภาษาไทย)",
      "why_it_matters": "ผลกระทบระยะยาวต่อนักพัฒนาและวงการเทคโนโลยี (ภาษาไทย)"
    },
    "use_cases": [
      {
        "title": "ชื่อยูสเคสที่ 1 (ภาษาไทย)",
        "role": "สำหรับนักพัฒนา / AI Engineer",
        "description": "อธิบายวิธีนำแนวคิดหรือโค้ดจากเปเปอร์นี้ไปปรับใช้ในระบบจริง (ภาษาไทย)",
        "example": "ตัวอย่างสถานการณ์ใช้งานจริงแบบเห็นภาพชัดเจน (ภาษาไทย)"
      },
      {
        "title": "ชื่อยูสเคสที่ 2 (ภาษาไทย)",
        "role": "สำหรับสร้าง Product / SaaS",
        "description": "อธิบายการนำไปต่อยอดเป็นฟีเจอร์หรือบริการใหม่ (ภาษาไทย)",
        "example": "ตัวอย่างสถานการณ์ใช้งานจริงแบบเห็นภาพชัดเจน (ภาษาไทย)"
      },
      {
        "title": "ชื่อยูสเคสที่ 3 (ภาษาไทย)",
        "role": "สำหรับองค์กร / สายงานเฉพาะทาง",
        "description": "อธิบายการนำไปแก้ปัญหาในอุตสาหกรรมหรือชีวิตประจำวัน (ภาษาไทย)",
        "example": "ตัวอย่างสถานการณ์ใช้งานจริงแบบเห็นภาพชัดเจน (ภาษาไทย)"
      }
    ],
    "community_pulse": {
      "summary": "ภาพรวมความคิดเห็นของนักวิจัยและนักพัฒนาบน Hugging Face ต่อเปเปอร์นี้ (ภาษาไทย)",
      "praises": [
        "จุดที่คนในวงการชื่นชมมากที่สุด ข้อที่ 1 (ภาษาไทย)",
        "จุดที่คนในวงการชื่นชมมากที่สุด ข้อที่ 2 (ภาษาไทย)"
      ],
      "critiques": [
        "ข้อจำกัดหรือข้อควรระวังในการนำไปใช้งานจริง ข้อที่ 1 (ภาษาไทย)",
        "ข้อจำกัดหรือข้อควรระวังในการนำไปใช้งานจริง ข้อที่ 2 (ภาษาไทย)"
      ],
      "hype_score": 8.5
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
        const arr = Array.isArray(parsed) ? parsed : parsed?.papers || [];
        for (const item of arr) {
          if (item && item.id) {
            resultMap.set(String(item.id), item);
          }
        }
        if (resultMap.size > 0) {
          return resultMap;
        }
      } catch (error: any) {
        const status = error?.status;
        const isFatal = status === 404 || status === 401 || status === 403;
        console.warn(
          `[${modelName}] Paper batch attempt ${attempt} failed (${status ?? "error"}): ${error?.message || error}`
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

function buildPaperObject(item: HFDailyPaperItem, aiData: any, dateStr: string): PaperData {
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

  const full: PaperData = {
    id,
    title,
    authors,
    organization: org,
    upvotes: item.paper.upvotes || 0,
    num_comments: item.numComments || 0,
    published_date: dateStr,
    updated_at: new Date().toISOString(),
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
    reading_time_minutes: aiData?.reading_time_minutes || 4,
    hook_headline:
      aiData?.hook_headline ||
      `เจาะลึก ${title}: นวัตกรรมใหม่ในกลุ่ม ${category}`,
    short_teaser:
      aiData?.short_teaser ||
      `งานวิจัยที่กำลังได้รับความสนใจบน Hugging Face (${item.paper.upvotes || 0} Upvotes) นำเสนอแนวทางใหม่ในการยกระดับประสิทธิภาพของระบบ AI`,
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
        ? aiData.layman_story.slice(0, 3)
        : [summary],
    impact_comparison: {
      before:
        aiData?.impact_comparison?.before ||
        "ระบบเดิมมีข้อจำกัดด้านความแม่นยำและใช้ทรัพยากรในการประมวลผลสูงเมื่อเจองานที่ซับซ้อน",
      after:
        aiData?.impact_comparison?.after ||
        "ลดข้อจำกัดเดิมด้วยวิธีคิดใหม่ที่ช่วยให้โมเดลทำงานได้มีประสิทธิภาพและเสถียรขึ้น",
      why_it_matters:
        aiData?.impact_comparison?.why_it_matters ||
        "ช่วยให้นักพัฒนาสามารถนำเทคนิคนี้ไปประยุกต์ใช้สร้างระบบ AI ที่ใช้งานได้จริงในโปรดักชัน",
    },
    use_cases:
      Array.isArray(aiData?.use_cases) && aiData.use_cases.length > 0
        ? aiData.use_cases.slice(0, 3)
        : [
            {
              title: "ยกระดับประสิทธิภาพโมเดลในระบบจริง",
              role: "สำหรับนักพัฒนา / AI Engineer",
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
          : Math.min(9.5, Math.max(6.5, Number((6.5 + Math.log10((item.paper.upvotes || 1) + 1) * 1.4).toFixed(1)))),
    },
  };

  return PaperSchema.parse(full);
}

async function main() {
  console.log("Starting RepoRadar Daily Papers Pipeline...");

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
    const rawDate = item.paper.submittedOnDailyAt || item.publishedAt || new Date().toISOString();
    const dateStr = rawDate.slice(0, 10);
    const list = groupedByDate.get(dateStr) || [];
    list.push(item);
    groupedByDate.set(dateStr, list);
  }

  // Sort dates newest first, take top 2 active dates from API to refresh, merge with existing rolling 7 days
  const apiDates = Array.from(groupedByDate.keys()).sort((a, b) => b.localeCompare(a));
  const datesToProcess = apiDates.slice(0, 2); // Today & Yesterday from live API

  const updatedDaysMap = new Map<string, PaperData[]>();
  for (const oldDay of existingDays) {
    updatedDaysMap.set(oldDay.date, oldDay.papers);
  }

  for (const dateStr of datesToProcess) {
    const dayItems = (groupedByDate.get(dateStr) || []).sort(
      (a, b) => (b.paper.upvotes || 0) - (a.paper.upvotes || 0)
    );

    console.log(`Date ${dateStr}: found ${dayItems.length} papers.`);

    const needGemini: HFDailyPaperItem[] = [];
    for (const item of dayItems) {
      const existing = cachedById.get(item.paper.id);
      if (!existing || existing.layman_story.length < 3) {
        needGemini.push(item);
      }
    }

    const aiResultsMap = new Map<string, any>();
    if (GEMINI_API_KEY && needGemini.length > 0) {
      console.log(`Processing ${needGemini.length} papers for ${dateStr} in batches of ${BATCH_SIZE}...`);
      for (let i = 0; i < needGemini.length; i += BATCH_SIZE) {
        const batch = needGemini.slice(i, i + BATCH_SIZE);
        console.log(
          `  -> Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needGemini.length / BATCH_SIZE)} (${batch.map((b) => b.paper.id).join(", ")})`
        );
        const batchMap = await processBatchWithGemini(batch);
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

      if (cached && cached.layman_story.length >= 3 && !aiData) {
        dayPapers.push({
          ...cached,
          upvotes: item.paper.upvotes || cached.upvotes,
          num_comments: item.numComments ?? cached.num_comments,
          github_url: item.paper.githubRepo || cached.github_url,
          github_stars: item.paper.githubStars ?? cached.github_stars,
          project_url: item.paper.projectPage || cached.project_url,
          updated_at: new Date().toISOString(),
        });
      } else if (aiData) {
        const built = buildPaperObject(item, aiData, dateStr);
        dayPapers.push(built);
        cachedById.set(built.id, built);
      } else if (cached) {
        dayPapers.push({
          ...cached,
          upvotes: item.paper.upvotes || cached.upvotes,
          num_comments: item.numComments ?? cached.num_comments,
          updated_at: new Date().toISOString(),
        });
      } else if (process.env.ALLOW_PAPER_FALLBACK === "true") {
        const built = buildPaperObject(item, null, dateStr);
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
