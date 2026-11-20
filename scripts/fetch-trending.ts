import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { RepositorySchema, type RepositoryData } from "../src/types";
import {
  DEEP_READING_JSON_SPEC,
  DEEP_READING_RULES,
  hasRefreshLatestFlag,
  sanitizeReadingGuide,
} from "./lib/deep-reading";

dotenv.config({ path: ".env.local" });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const REPOS_FILE_PATH = path.join(process.cwd(), "src/data/repos.json");

interface GitHubSearchRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  html_url: string;
  stargazers_count: number;
  stars_today?: number;
  language: string | null;
  topics: string[];
  license: { spdx_id: string } | null;
  open_issues_count: number;
  pushed_at: string;
  created_at?: string;
}

interface GithubSearchRepoResponse {
  items: GitHubSearchRepoItem[];
}

interface HNStory {
  title: string;
  url: string;
  objectID: string;
}

interface HNSearchResponse {
  hits: HNStory[];
}

const TARGET_REPO_COUNT = 12;

function isInterestingCodeRepo(name: string, topics: string[] = []): boolean {
  const lower = name.toLowerCase();
  const excludedKeywords = ["awesome", "list", "interview", "book", "roadmap", "tutorial", "course"];
  if (excludedKeywords.some((kw) => lower.includes(kw))) {
    return false;
  }
  if (topics.some((t) => t === "awesome-list" || t === "interview-questions")) {
    return false;
  }
  return true;
}

function getStarsTodayApprox(repo: GitHubSearchRepoItem): number {
  if (typeof repo.stars_today === "number" && repo.stars_today > 0) {
    return repo.stars_today;
  }
  const refDate = repo.created_at || repo.pushed_at;
  if (refDate) {
    const daysOld = Math.max(1, Math.ceil((Date.now() - new Date(refDate).getTime()) / 86_400_000));
    return Math.max(10, Math.round(repo.stargazers_count / daysOld));
  }
  return 50;
}

/**
 * Fetch trending & breakout repositories:
 * 1. Real daily trending repositories from https://github.com/trending?since=daily (with real stars today)
 * 2. Supplement up to TARGET_REPO_COUNT (12) with breakout repositories created within the last 30 days
 */
async function fetchGitHubTrending(): Promise<GitHubSearchRepoItem[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoRadar-Script",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  const collected: GitHubSearchRepoItem[] = [];
  const seen = new Set<string>();

  try {
    const trendingRes = await fetch("https://github.com/trending?since=daily", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RepoRadar/2.0)" },
    });
    if (trendingRes.ok) {
      const html = await trendingRes.text();
      const articles = html.split('<article class="Box-row">').slice(1);

      for (const article of articles) {
        if (collected.length >= TARGET_REPO_COUNT) break;
        const repoMatch = article.match(/<h2[\s\S]*?<a[^>]*href="\/([^/"\s]+\/[^/"\s]+)"/);
        const todayMatch = article.match(/([\d,]+)\s+stars today/);
        const fullName = repoMatch?.[1];
        if (!fullName || seen.has(fullName.toLowerCase())) continue;

        const repoName = fullName.split("/")[1] || "";
        if (!isInterestingCodeRepo(repoName)) continue;

        const starsToday = todayMatch ? parseInt(todayMatch[1].replace(/,/g, ""), 10) : 0;

        try {
          const metaRes = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
          if (metaRes.ok) {
            const repoData = (await metaRes.json()) as GitHubSearchRepoItem;
            if (!isInterestingCodeRepo(repoData.name, repoData.topics || [])) continue;
            repoData.stars_today = starsToday > 0 ? starsToday : getStarsTodayApprox(repoData);
            collected.push(repoData);
            seen.add(repoData.full_name.toLowerCase());
          }
        } catch {
          console.warn(`Could not fetch metadata for trending repo ${fullName}`);
        }
      }
      console.log(`Fetched ${collected.length} repositories from GitHub Daily Trending.`);
    }
  } catch (error) {
    console.warn("Could not scrape github.com/trending, falling back to search API:", error);
  }

  if (collected.length < TARGET_REPO_COUNT) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const query = `created:>=${dateStr} stars:>200 has:license`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = (await res.json()) as GithubSearchRepoResponse;
        for (const repo of data.items || []) {
          if (collected.length >= TARGET_REPO_COUNT) break;
          const key = repo.full_name.toLowerCase();
          if (seen.has(key)) continue;
          if (!isInterestingCodeRepo(repo.name, repo.topics || [])) continue;

          repo.stars_today = getStarsTodayApprox(repo);
          collected.push(repo);
          seen.add(key);
        }
      } else {
        console.warn(`GitHub Search API returned ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching breakout GitHub repos:", error);
    }
  }

  return collected.slice(0, TARGET_REPO_COUNT);
}

/**
 * Fetch GitHub README, root directory tree, and top Issues
 */
async function fetchRepoDetails(owner: string, repo: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoRadar-Script",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  let readme = "";
  try {
    const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers,
    });
    if (readmeRes.ok) {
      const readmeData = (await readmeRes.json()) as { content?: string };
      if (readmeData.content) {
        readme = Buffer.from(readmeData.content, "base64").toString("utf-8");
      }
    }
  } catch {
    console.warn(`Could not fetch README for ${owner}/${repo}`);
  }

  let rootTree = "";
  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
      headers,
    });
    if (treeRes.ok) {
      const entries = (await treeRes.json()) as Array<{ name: string; type: string }>;
      if (Array.isArray(entries)) {
        rootTree = entries
          .slice(0, 30)
          .map((e) => `${e.type === "dir" ? "[dir]" : "[file]"} ${e.name}`)
          .join(", ");
      }
    }
  } catch {
    // Non-critical
  }

  let issuesContext = "";
  try {
    const issuesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=all&sort=comments&direction=desc&per_page=5`,
      { headers }
    );
    if (issuesRes.ok) {
      const issuesData = (await issuesRes.json()) as Array<{ title?: string; body?: string }>;
      if (Array.isArray(issuesData)) {
        issuesContext = issuesData
          .map(
            (issue) =>
              `Issue: ${issue.title}\nBody: ${(issue.body || "").substring(0, 220)}...`
          )
          .join("\n\n");
      }
    }
  } catch {
    console.warn(`Could not fetch issues for ${owner}/${repo}`);
  }

  return {
    readme: readme.substring(0, 6500),
    rootTree,
    issuesContext,
  };
}

/**
 * Search Hacker News via Algolia for community sentiment
 */
async function fetchHNSentiment(repoName: string): Promise<string> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(repoName)}&tags=story&hitsPerPage=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HN API failed");
    const data = (await res.json()) as HNSearchResponse;
    return data.hits.map((hit) => `HN Discussion: ${hit.title} (${hit.url})`).join("\n");
  } catch (error) {
    console.error("Error fetching HN:", error);
    return "";
  }
}

/**
 * Process repo data with Gemini to extract 3-Pass Deep Reading guide + structured info
 */
async function processWithGemini(
  repo: GitHubSearchRepoItem,
  readme: string,
  rootTree: string,
  issuesContext: string,
  hnContext: string
): Promise<RepositoryData | null> {
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY found, skipping AI processing.");
    return null;
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
  ];

  const prompt = `
You are a senior Thai principal engineer reviewing a trending GitHub repository for a solo Thai developer who wants to deeply understand HOW the codebase works, what real problem it solves, what prerequisites/gotchas it has, and how to test it locally — NOT generic SaaS/Next.js/Supabase boilerplate.

${DEEP_READING_RULES}

IMPORTANT LANGUAGE & WRITING STYLE REQUIREMENTS:
1. Write ALL descriptive text fields in natural, sharp, technically grounded **Thai (ภาษาไทย)** (keep technical terms like API, CLI, Docker, LLM, Agent, SDK, AST, MCP, Python, Rust, TypeScript in English).
2. STRICTLY NO COPY-PASTE STACK CLICHÉS: Do NOT default to "Next.js + Supabase + SaaS Dashboard" unless the repository itself actually uses them! Base your analysis strictly on the actual language, root files, README, and Issues below.
3. "deep_dive_paragraphs" MUST be 3 substantive editorial paragraphs in Thai:
   - Paragraph 1 (Why It Exists & Pain Point): คอขวดจริงของนักพัฒนาที่โปรเจกต์นี้เข้ามาแก้คืออะไร
   - Paragraph 2 (Architecture & Under the Hood): ข้างในมันทำงานยังไง อ้างอิงโครงสร้างไฟล์ กลไก หรือฟีเจอร์จริงจาก README
   - Paragraph 3 (Honest Engineering Verdict): คุ้มที่จะเอามาใช้หรือศึกษาโค้ดแค่ไหน และมีข้อจำกัดอะไรที่ควรรู้ก่อน
4. "quick_start" MUST be real, minimal executable commands directly from the README (never invent fake npm/pip package names!).
5. Keep "maturity_rating" strictly in English as one of: "Production-Ready", "Experimental", or "PoC".
6. "facebook_post" MUST be a clean Thai summary draft (~180-250 words) grounded in real facts from the README, with bullet points and 3-5 hashtags.

Repository: ${repo.full_name}
Stars: ${repo.stargazers_count} (+${getStarsTodayApprox(repo)} today)
URL: ${repo.html_url}
Topics: ${repo.topics.join(", ")}
Language: ${repo.language}
License: ${repo.license?.spdx_id || "None"}
Open Issues: ${repo.open_issues_count}
Root Directory Structure: ${rootTree || "Unavailable"}

README Snippet:
${readme}

GitHub Issues Context:
${issuesContext}

Hacker News Context:
${hnContext}

Provide the output strictly in the following JSON structure:
{
  "one_liner": "สรุปโปรเจกต์ 1 ประโยคที่คมชัดและตรงความจริงว่ามันคืออะไรและทำอะไรได้ (ภาษาไทย)",
  "problem_solved": "อธิบาย Pain point และปัญหาจริงทางเทคนิค 3 ประโยคว่าวิธีเดิมติดขัดตรงไหนและโปรเจกต์นี้แก้ยังไง (ภาษาไทย)",
  "alternative_comparison": "เปรียบเทียบกับเครื่องมือหรือเฟรมเวิร์กที่ใกล้เคียง 2-3 ประโยค ระบุชัดว่าต่างกันตรงไหนและควรเลือกตัวไหนเมื่อไหร่ (ภาษาไทย)",
  "maturity_rating": "One of: 'Production-Ready', 'Experimental', 'PoC'",
  "maturity_reason": "เหตุผลเชิงประจักษ์ 2 ประโยคจากโครงสร้างโค้ด ไลเซนส์ เอกสาร และ Issues (ภาษาไทย)",
  "ai_opportunity": {
    "monetization_idea": "การประยุกต์ใช้งานจริงในโปรเจกต์ส่วนตัวหรือเวิร์กโฟลว์นักพัฒนา (ไม่จำเป็นต้องฝืนคิด SaaS ถ้าไม่เข้ากับตัวเครื่องมือ) (ภาษาไทย)",
    "stack_synergy": "เทคโนโลยีหรือเครื่องมือที่เข้าคู่กับโปรเจกต์นี้จริงตามภาษาและสถาปัตยกรรมของมัน (ภาษาไทย)"
  },
  "human_vibe_check": {
    "pros": ["จุดแข็งเชิงเทคนิคจาก README/คอมมูนิตี้ ข้อที่ 1 (ภาษาไทย)", "จุดแข็งเชิงเทคนิค ข้อที่ 2 (ภาษาไทย)"],
    "gotchas_and_traps": ["ข้อควรระวัง กับดัก หรือข้อจำกัดจริงที่ควรรู้ก่อนลอง ข้อที่ 1 (ภาษาไทย)", "ข้อควรระวังหรือข้อจำกัด ข้อที่ 2 (ภาษาไทย)"],
    "hype_vs_reality": <number between 0 and 10>
  },
  "deep_dive_paragraphs": [
    "ย่อหน้าที่ 1: ปัญหาจริงและเหตุผลที่โปรเจกต์นี้กำลังมาแรง...",
    "ย่อหน้าที่ 2: เจาะลึกโครงสร้างและกลไกการทำงานจริงข้างใน...",
    "ย่อหน้าที่ 3: สรุปแบบตรงไปตรงมาว่าคุ้มค่ากับการลองใช้หรืออ่านโค้ดแค่ไหน..."
  ],
  ${DEEP_READING_JSON_SPEC},
  "facebook_post": "ฉบับร่างโพสต์ Facebook ภาษาไทยพร้อมแชร์ในอนาคต อิงข้อมูลจริงจาก README เท่านั้น",
  "quick_start": "The shortest real executable terminal command(s) directly from the README."
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

        const aiData = JSON.parse(responseText);
        if (aiData?.human_vibe_check) {
          if (Array.isArray(aiData.human_vibe_check.pros)) {
            aiData.human_vibe_check.pros = aiData.human_vibe_check.pros.slice(0, 2);
          }
          if (Array.isArray(aiData.human_vibe_check.gotchas_and_traps)) {
            aiData.human_vibe_check.gotchas_and_traps =
              aiData.human_vibe_check.gotchas_and_traps.slice(0, 2);
          }
        }
        if (Array.isArray(aiData?.deep_dive_paragraphs)) {
          aiData.deep_dive_paragraphs = aiData.deep_dive_paragraphs
            .filter((p: unknown) => typeof p === "string" && p.trim().length > 0)
            .slice(0, 4);
        }

        aiData.reading_guide = sanitizeReadingGuide(
          aiData?.reading_guide,
          "readme_and_issues"
        );

        const nowIso = new Date().toISOString();

        const fullData = {
          id: repo.id.toString(),
          name: repo.name,
          owner: repo.owner.login,
          url: repo.html_url,
          stars: repo.stargazers_count,
          stars_today: getStarsTodayApprox(repo),
          language: repo.language,
          topics: repo.topics,
          license: repo.license?.spdx_id || null,
          open_issues: repo.open_issues_count,
          updated_at: nowIso,
          first_seen_at: nowIso,
          ...aiData,
        };

        return RepositorySchema.parse(fullData);
      } catch (error: unknown) {
        const errObj = error as { status?: number; message?: string };
        const status = errObj?.status;
        const isFatalModelError = status === 404 || status === 401 || status === 403;
        console.warn(
          `[${modelName}] Attempt ${attempt} failed for ${repo.full_name} (status: ${status ?? "parse/validation"}): ${errObj?.message || String(error)}`
        );
        if (!isFatalModelError && attempt < 3) {
          const delayMs = 2500 * attempt;
          console.log(`Waiting ${delayMs}ms before retrying ${modelName}...`);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          console.log(`Switching to fallback model after ${modelName} failed...`);
          break;
        }
      }
    }
  }

  console.error(`Failed to process ${repo.full_name} with all Gemini models.`);
  return null;
}

async function loadPreviousFeed(): Promise<{
  yesterdayRepos: RepositoryData[];
  cachedById: Map<string, RepositoryData>;
}> {
  const cachedById = new Map<string, RepositoryData>();
  let yesterdayRepos: RepositoryData[] = [];

  try {
    const raw = await fs.readFile(REPOS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      yesterdayRepos = parsed as RepositoryData[];
      for (const r of yesterdayRepos) {
        cachedById.set(r.id, r);
        cachedById.set(`${r.owner}/${r.name}`.toLowerCase(), r);
      }
    } else if (parsed && typeof parsed === "object") {
      const prevToday: RepositoryData[] = Array.isArray(parsed.today) ? parsed.today : [];
      const prevYesterday: RepositoryData[] = Array.isArray(parsed.yesterday)
        ? parsed.yesterday
        : [];

      for (const r of [...prevYesterday, ...prevToday]) {
        cachedById.set(r.id, r);
        cachedById.set(`${r.owner}/${r.name}`.toLowerCase(), r);
      }

      const toBangkokDate = (isoOrDate: string | Date | undefined): string | null => {
        if (!isoOrDate) return null;
        const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
        if (Number.isNaN(d.getTime())) return null;
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
      };

      const prevDate = toBangkokDate(prevToday[0]?.updated_at);
      const currDate = toBangkokDate(new Date());

      if ((prevDate && currDate && prevDate !== currDate) || prevYesterday.length === 0) {
        yesterdayRepos = prevToday;
      } else {
        yesterdayRepos = prevYesterday;
      }
    }
  } catch {
    console.warn("Could not read existing repos.json, starting fresh.");
  }

  return { yesterdayRepos, cachedById };
}

async function main() {
  const refreshLatest = hasRefreshLatestFlag();
  console.log(
    `Starting RepoRadar Data Pipeline...${refreshLatest ? " [REFRESH LATEST MODE]" : ""}`
  );

  if (!GITHUB_TOKEN || !GEMINI_API_KEY) {
    console.warn(
      "Missing GITHUB_TOKEN or GEMINI_API_KEY. The pipeline requires both to fetch and process real data."
    );
    console.warn("Make sure they are set in .env.local or environment variables.");
    if (!process.env.CI) {
      console.log("Exiting gracefully. Mock data will be used.");
      return;
    }
  }

  const { yesterdayRepos, cachedById } = await loadPreviousFeed();

  const repos = await fetchGitHubTrending();
  if (repos.length === 0) {
    console.log("No repos fetched. Pipeline finished.");
    return;
  }

  console.log(`Found ${repos.length} trending repositories. Processing...`);

  const results: RepositoryData[] = [];

  for (const repo of repos) {
    const existing =
      cachedById.get(repo.id.toString()) ||
      cachedById.get(repo.full_name.toLowerCase());

    if (existing && !refreshLatest) {
      console.log(
        `♻️ Reusing existing AI analysis for ${repo.full_name} & updating live stats...`
      );
      results.push({
        ...existing,
        id: repo.id.toString(),
        name: repo.name,
        owner: repo.owner.login,
        url: repo.html_url,
        stars: repo.stargazers_count,
        stars_today: getStarsTodayApprox(repo),
        language: repo.language,
        topics: repo.topics,
        license: repo.license?.spdx_id || existing.license || null,
        open_issues: repo.open_issues_count,
        first_seen_at: existing.first_seen_at || existing.updated_at,
        updated_at: new Date().toISOString(),
      });
      continue;
    }

    console.log(
      `${refreshLatest && existing ? "🔄 Refreshing" : "Processing"}: ${repo.full_name}...`
    );
    await new Promise((r) => setTimeout(r, 3000));

    const details = await fetchRepoDetails(repo.owner.login, repo.name);
    const hnContext = await fetchHNSentiment(repo.name);

    const processed = await processWithGemini(
      repo,
      details.readme,
      details.rootTree,
      details.issuesContext,
      hnContext
    );

    if (processed) {
      if (existing?.first_seen_at) {
        processed.first_seen_at = existing.first_seen_at;
      }
      results.push(processed);
      console.log(`✅ Successfully processed ${repo.full_name}`);
    } else if (existing) {
      // Safe fallback to existing analysis if refresh fails for one repo
      results.push({
        ...existing,
        stars: repo.stargazers_count,
        stars_today: getStarsTodayApprox(repo),
        open_issues: repo.open_issues_count,
        updated_at: new Date().toISOString(),
      });
      console.log(`⚠️ Refresh failed for ${repo.full_name}, preserved cached version.`);
    } else {
      console.log(`❌ Failed to process ${repo.full_name}`);
    }
  }

  if (results.length > 0) {
    const payload = {
      today: results,
      yesterday: yesterdayRepos,
    };
    await fs.writeFile(REPOS_FILE_PATH, JSON.stringify(payload, null, 2));
    console.log(
      `Successfully wrote ${results.length} today repos and ${yesterdayRepos.length} yesterday repos to ${REPOS_FILE_PATH}`
    );
  } else {
    console.log("No repositories were successfully processed. Keeping existing data.");
  }
}

main().catch(console.error);
