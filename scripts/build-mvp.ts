import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { type RepositoryData } from "../src/types";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REPOS_FILE_PATH = path.join(process.cwd(), "src/data/repos.json");
const MVPS_DIR_PATH = path.join(process.cwd(), "public/mvps");

const MAX_MVPS_PER_DAY = 3;

interface GeneratedMvpPayload {
  app_name: string;
  tagline: string;
  html_code: string;
}

async function generateMvpWithGemini(repo: RepositoryData): Promise<GeneratedMvpPayload | null> {
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found, skipping MVP builder.");
    return null;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
  ];

  const prompt = `
You are an elite indie hacker, product engineer, and creative technologist.
Your job is to build a **working, interactive, single-file Micro-SaaS MVP Web Application** inspired by the following trending GitHub repository.

SOURCE REPOSITORY:
- Name: ${repo.owner}/${repo.name} (${repo.url})
- Language: ${repo.language || "Multi-language"}
- Topics: ${repo.topics.join(", ")}
- Summary: ${repo.one_liner}
- Problem Solved: ${repo.problem_solved}
- Micro-SaaS / Monetization Idea: ${repo.ai_opportunity.monetization_idea}
- Stack Synergy: ${repo.ai_opportunity.stack_synergy}
- Quick Start: ${repo.quick_start}

REQUIREMENTS FOR THE MVP WEB APP:
1. Build an **actual interactive tool / playground / generator / analyzer / simulator** (NOT a static marketing landing page).
2. You can build directly on the Monetization Idea above OR invent an out-of-the-box Micro-SaaS product inspired by this repository.
3. The entire web app MUST be a single, self-contained HTML5 document (\`<!DOCTYPE html>\`) using:
   - Tailwind CSS CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`
   - Clean, modern dark UI (\`bg-zinc-950 text-zinc-100\`, emerald/cyan/indigo accents, responsive layout).
   - Pure Vanilla JavaScript inside \`<script>\` tags with **zero external API keys required** so the user can test and play with it immediately in their browser.
4. MUST INCLUDE THESE INTERACTIVE FEATURES:
   - **2–3 Preset Example Buttons ("ลองข้อมูลตัวอย่าง 1", "ตัวอย่าง 2")** that populate realistic inputs with one click.
   - **Interactive Controls / Editor / Inputs** (textareas, sliders, selects, toggles, etc. tailored to the product).
   - **Working Action / Simulation Engine in JS** that processes the user's input and renders structured visual output (e.g., interactive dashboard metrics, generated code/config/workflow, visual audit report, interactive chart/bars, step-by-step execution log, etc.).
   - **Copy / Export Button** that copies the generated result/code/report to clipboard with visual feedback.
   - A subtle header badge linking back to the source GitHub repo (${repo.url}).
5. All UI labels, instructions, and sample outputs should be in **Thai (ภาษาไทย)** (technical terms/code remain in English).
6. Keep the HTML concise, well-structured, and under 18,000 characters so it loads instantaneously.

Return ONLY a valid JSON object matching this exact structure:
{
  "app_name": "Short catchy product name (e.g. 'AstryxGuard Cloud', 'SkillForge Studio')",
  "tagline": "คำอธิบายสั้นๆ 1 ประโยคว่าเว็บแอป MVP ตัวนี้ใช้ทำอะไรได้ (ภาษาไทย)",
  "html_code": "<!DOCTYPE html><html lang=\\"th\\">...complete working HTML5 code...</html>"
}
`;

  for (const modelName of modelsToTry) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText) as GeneratedMvpPayload;

        if (
          parsed &&
          typeof parsed.app_name === "string" &&
          typeof parsed.tagline === "string" &&
          typeof parsed.html_code === "string" &&
          parsed.html_code.includes("<html")
        ) {
          return parsed;
        }
        throw new Error("Invalid MVP JSON structure returned from model");
      } catch (error: any) {
        const status = error?.status;
        const isFatal = status === 404 || status === 401 || status === 403;
        console.warn(
          `[MVP Builder - ${modelName}] Attempt ${attempt} failed for ${repo.name} (status: ${status ?? "parse"}): ${error?.message || error}`
        );
        if (!isFatal && attempt < 3) {
          const delayMs = 3000 * attempt;
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          break;
        }
      }
    }
  }

  return null;
}

async function main() {
  console.log("🚀 Starting RepoRadar Autonomous MVP Builder...");

  if (!GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY. Skipping MVP generation.");
    return;
  }

  await fs.mkdir(MVPS_DIR_PATH, { recursive: true });

  const rawRepos = await fs.readFile(REPOS_FILE_PATH, "utf-8");
  const repos = JSON.parse(rawRepos) as RepositoryData[];

  if (repos.length === 0) {
    console.log("No repositories found in repos.json.");
    return;
  }

  // Pick top candidates sorted by hype + velocity
  const candidates = [...repos]
    .sort((a, b) => {
      const scoreA = a.human_vibe_check.hype_vs_reality * 100 + Math.min(a.stars_today, 1000);
      const scoreB = b.human_vibe_check.hype_vs_reality * 100 + Math.min(b.stars_today, 1000);
      return scoreB - scoreA;
    })
    .slice(0, MAX_MVPS_PER_DAY);

  const candidateIds = new Set(candidates.map((c) => c.id));
  let builtCount = 0;

  for (const repo of repos) {
    if (!candidateIds.has(repo.id)) {
      continue;
    }

    const fileName = `mvp-${repo.id}.html`;
    const filePath = path.join(MVPS_DIR_PATH, fileName);
    const publicUrl = `/mvps/${fileName}`;

    // Check if already built on disk
    let fileExists = false;
    try {
      await fs.access(filePath);
      fileExists = true;
    } catch {
      fileExists = false;
    }

    if (fileExists && repo.mvp?.url === publicUrl) {
      console.log(`⚡ MVP already exists for ${repo.owner}/${repo.name} (${repo.mvp.app_name}), reusing.`);
      builtCount++;
      continue;
    }

    console.log(`🛠️ Building interactive Micro-SaaS MVP for ${repo.owner}/${repo.name}...`);
    await new Promise((r) => setTimeout(r, 3500));

    const generated = await generateMvpWithGemini(repo);
    if (generated) {
      await fs.writeFile(filePath, generated.html_code, "utf-8");
      repo.mvp = {
        app_name: generated.app_name,
        tagline: generated.tagline,
        url: publicUrl,
        built_at: new Date().toISOString(),
      };
      builtCount++;
      console.log(`✅ Built MVP "${generated.app_name}" -> ${publicUrl}`);
    } else {
      console.warn(`❌ Could not build MVP for ${repo.owner}/${repo.name}`);
    }
  }

  // Clean up old HTML files not in current repos list to keep repo lightweight
  const activeFiles = new Set(
    repos.map((r) => (r.mvp?.url ? path.basename(r.mvp.url) : null)).filter(Boolean) as string[]
  );
  try {
    const existingFiles = await fs.readdir(MVPS_DIR_PATH);
    for (const file of existingFiles) {
      if (file.endsWith(".html") && !activeFiles.has(file)) {
        await fs.unlink(path.join(MVPS_DIR_PATH, file));
        console.log(`🧹 Cleaned up old MVP file: ${file}`);
      }
    }
  } catch (err) {
    console.warn("Could not clean up old MVP files:", err);
  }

  await fs.writeFile(REPOS_FILE_PATH, JSON.stringify(repos, null, 2), "utf-8");
  console.log(`🎉 MVP Builder finished! ${builtCount} live MVPs ready in public/mvps/.`);
}

main().catch(console.error);
