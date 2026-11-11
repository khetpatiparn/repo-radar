import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { type RepositoryData } from "../src/types";

dotenv.config({ path: ".env.local" });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const REPOS_FILE_PATH = path.join(process.cwd(), "src/data/repos.json");
const MVPS_DIR_PATH = path.join(process.cwd(), "public/mvps");

const MAX_MVPS_PER_DAY = 6;

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
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  const prompt = `
You are an elite Principal Product Engineer and Full-Stack Indie Hacker.
Your mission is to build a **Full-Mode, Multi-View, Production-Grade Interactive Web Application Studio** inspired by this trending GitHub repository:

SOURCE REPOSITORY:
- Name: ${repo.owner}/${repo.name} (${repo.url})
- Language: ${repo.language || "Multi-language"}
- Topics: ${repo.topics.join(", ")}
- Summary: ${repo.one_liner}
- Problem Solved: ${repo.problem_solved}
- Micro-SaaS / Monetization Idea: ${repo.ai_opportunity.monetization_idea}
- Stack Synergy: ${repo.ai_opportunity.stack_synergy}
- Quick Start: ${repo.quick_start}

MANDATORY FULL-SYSTEM STUDIO REQUIREMENTS:
1. DO NOT build a toy 2-input form or a static marketing page. Build a **complete, rich, multi-tab interactive web studio** that demonstrates the full power of this repository and its Micro-SaaS potential.
2. Include **at least 3 switchable Interactive Views / Tabs** OR a **3-Pane Workspace**:
   - View/Pane 1: **Interactive Control Center / Live Simulator / Playground** with 3+ realistic preset scenarios that users can load and tweak in real time.
   - View/Pane 2: **Live Visual Dashboard / Real-Time Preview / Analytics Matrix** showing visual charts, metrics, state tables, or live execution results.
   - View/Pane 3: **Production Code / Config / API Exporter** where users can copy ready-to-use code, CLI commands, or JSON configurations generated from their live state.
3. Optional Backend Integration: The host Next.js app provides a live server endpoint \`POST /api/mvp-engine\` supporting \`{ action: "browser-snapshot", url, task }\`, \`{ action: "craft-cleanroom", targetUrl, customPrompt }\`, and \`{ action: "agent-skills-build", idea }\` if helpful.
4. Self-contained HTML5 document (\`<!DOCTYPE html>\`) using Tailwind CSS CDN (\`<script src="https://cdn.tailwindcss.com"></script>\`), modern dark UI (\`bg-zinc-950 text-zinc-100\`), and rich working Vanilla JavaScript.
5. All UI text, explanations, and preset scenarios must be in **Thai (ภาษาไทย)**.

Return ONLY a valid JSON object matching this exact structure:
{
  "app_name": "Catchy product studio name",
  "tagline": "คำอธิบายสั้นๆ 1 ประโยคว่า Full-Mode Studio ตัวนี้ทำอะไรได้ (ภาษาไทย)",
  "html_code": "<!DOCTYPE html><html lang=\\"th\\">...complete full-featured multi-view HTML5 application...</html>"
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

  await fs.mkdir(MVPS_DIR_PATH, { recursive: true });

  const rawRepos = await fs.readFile(REPOS_FILE_PATH, "utf-8");
  const repos = JSON.parse(rawRepos) as RepositoryData[];

  if (repos.length === 0) {
    console.log("No repositories found in repos.json.");
    return;
  }

  // Prioritize repos that already have a rich built studio OR highest star velocity + hype
  const candidates = [...repos]
    .sort((a, b) => {
      const scoreA = a.stars_today + a.human_vibe_check.hype_vs_reality * 120;
      const scoreB = b.stars_today + b.human_vibe_check.hype_vs_reality * 120;
      return scoreB - scoreA;
    })
    .slice(0, MAX_MVPS_PER_DAY);

  const candidateIds = new Set(candidates.map((c) => c.id));
  let builtCount = 0;

  for (const repo of repos) {
    const fileName = `mvp-${repo.id}.html`;
    const filePath = path.join(MVPS_DIR_PATH, fileName);
    const publicUrl = `/mvps/${fileName}`;

    let fileSize = 0;
    try {
      const stat = await fs.stat(filePath);
      fileSize = stat.size;
    } catch {
      fileSize = 0;
    }

    // If a rich studio file already exists on disk, always preserve and link it
    if (fileSize > 3000 && repo.mvp?.url === publicUrl) {
      console.log(`⚡ Full-Mode MVP Studio already exists for ${repo.owner}/${repo.name} (${repo.mvp.app_name}), preserving.`);
      builtCount++;
      continue;
    }

    if (!candidateIds.has(repo.id)) {
      continue;
    }

    if (!GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY, skipping new AI MVP generation.");
      continue;
    }

    console.log(`🛠️ Building Full-Mode Interactive MVP Studio for ${repo.owner}/${repo.name}...`);
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

  // Clean up old HTML files not in current repos list
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
