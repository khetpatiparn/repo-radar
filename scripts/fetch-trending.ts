import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { RepositorySchema, type RepositoryData } from "../src/types";
import {
  DEEP_READING_JSON_SPEC,
  DEEP_READING_RULES,
  hasBackfill3PassFlag,
  hasRefreshLatestFlag,
  sanitizeReadingGuide,
} from "./lib/deep-reading";
import {
  COOLDOWN_DAYS,
  MAX_CONSECUTIVE_DAYS,
  MAX_STREAK_SLOTS,
  TARGET_REPO_COUNT,
  bootstrapSeenHistory,
  classifyCandidate,
  isInterestingCodeRepo,
  mergeCandidatePools,
  normalizeRepoKey,
  parseTrendingHtml,
  selectRotatedCandidates,
  toBangkokDate,
  updateSeenHistory,
  type RawTrendingCandidate,
  type RepoHistoryMap,
  type TrendingSourceTier,
} from "./lib/repo-rotation";

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

const LANGUAGE_TRENDING_URLS = [
  "https://github.com/trending/python?since=daily",
  "https://github.com/trending/typescript?since=daily",
  "https://github.com/trending/rust?since=daily",
  "https://github.com/trending/go?since=daily",
];

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

async function scrapeTrendingPage(
  url: string,
  tier: TrendingSourceTier
): Promise<RawTrendingCandidate[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RepoRadar/2.0)" },
    });
    if (!res.ok) {
      console.warn(`Trending page ${url} returned ${res.status}: ${res.statusText}`);
      return [];
    }
    const html = await res.text();
    return parseTrendingHtml(html, tier);
  } catch (error) {
    console.warn(`Could not scrape ${url}:`, error);
    return [];
  }
}

function countEligibleCandidates(
  candidates: RawTrendingCandidate[],
  seenHistory: RepoHistoryMap,
  todayIct: string
): { fresh: number; streak: number; usable: number } {
  let fresh = 0;
  let streak = 0;
  const seen = new Set<string>();

  for (const c of candidates) {
    const key = normalizeRepoKey(c.fullName);
    if (seen.has(key)) continue;
    seen.add(key);

    const status = classifyCandidate(key, seenHistory, todayIct, {
      maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
      cooldownDays: COOLDOWN_DAYS,
    });
    if (status === "fresh") fresh++;
    else if (status === "streak") streak++;
  }

  return {
    fresh,
    streak,
    usable: fresh + Math.min(streak, MAX_STREAK_SLOTS),
  };
}

/**
 * Fetch trending & breakout repositories using a 4-tier waterfall with 14-day cooldown rotation:
 * Tier 1: https://github.com/trending?since=daily (all articles, real stars today)
 * Tier 2: Language-specific daily trending pages (python, typescript, rust, go) — real stars today
 * Tier 2b: https://github.com/trending?since=weekly (daily-averaged stars) if still short
 * Tier 3: GitHub Search API breakout repos created in the last 14 days (non-cooldown)
 * Tier 4: Graceful cooldown fallback only if all tiers combined still yield < TARGET_REPO_COUNT
 */
async function fetchGitHubTrending(
  seenHistory: RepoHistoryMap,
  todayIct: string
): Promise<GitHubSearchRepoItem[]> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoRadar-Script",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  // Buffer extra candidates so topic-filtering or metadata fetch errors still leave >= TARGET_REPO_COUNT
  const desiredEligibleBuffer = TARGET_REPO_COUNT + 4;

  // Tier 1: Global Daily Trending
  const dailyCandidates = await scrapeTrendingPage(
    "https://github.com/trending?since=daily",
    "daily"
  );
  const pools: RawTrendingCandidate[][] = [dailyCandidates];
  let eligibleStats = countEligibleCandidates(dailyCandidates, seenHistory, todayIct);
  console.log(
    `Tier 1 (Daily Trending): scraped ${dailyCandidates.length} candidates (${eligibleStats.fresh} fresh, ${eligibleStats.streak} streak eligible).`
  );

  // Tier 2: Language-specific Daily Trending (when global daily board is frozen or saturated with cooldown repos)
  if (eligibleStats.usable < desiredEligibleBuffer) {
    const langPools = await Promise.all(
      LANGUAGE_TRENDING_URLS.map((url) => scrapeTrendingPage(url, "language"))
    );
    pools.push(...langPools);
    const mergedSoFar = mergeCandidatePools(pools);
    eligibleStats = countEligibleCandidates(mergedSoFar, seenHistory, todayIct);
    console.log(
      `Tier 2 (Language Daily Trending): pool now ${mergedSoFar.length} unique (${eligibleStats.fresh} fresh, ${eligibleStats.streak} streak eligible).`
    );
  }

  // Tier 2b: Weekly Trending (only if still short on eligible candidates)
  if (eligibleStats.usable < desiredEligibleBuffer) {
    const weeklyCandidates = await scrapeTrendingPage(
      "https://github.com/trending?since=weekly",
      "weekly"
    );
    pools.push(weeklyCandidates);
    const mergedSoFar = mergeCandidatePools(pools);
    eligibleStats = countEligibleCandidates(mergedSoFar, seenHistory, todayIct);
    console.log(
      `Tier 2b (Weekly Trending): pool now ${mergedSoFar.length} unique (${eligibleStats.fresh} fresh, ${eligibleStats.streak} streak eligible).`
    );
  }

  const mergedPool = mergeCandidatePools(pools);

  // Partition scraped candidates into non-cooldown eligible, streak overflow, and cooldown reserve
  const eligibleShortlist: RawTrendingCandidate[] = [];
  const streakOverflow: RawTrendingCandidate[] = [];
  const cooldownReserve: RawTrendingCandidate[] = [];
  const { selected: prioritizedAll } = selectRotatedCandidates(
    mergedPool,
    seenHistory,
    todayIct,
    {
      targetCount: mergedPool.length,
      maxStreakSlots: MAX_STREAK_SLOTS,
      maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
      cooldownDays: COOLDOWN_DAYS,
    }
  );

  let eligibleStreaksAllowed = 0;
  for (const candidate of prioritizedAll) {
    const status = classifyCandidate(candidate.fullName, seenHistory, todayIct, {
      maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
      cooldownDays: COOLDOWN_DAYS,
    });
    if (status === "fresh") {
      eligibleShortlist.push(candidate);
    } else if (status === "streak") {
      if (eligibleStreaksAllowed < MAX_STREAK_SLOTS) {
        eligibleShortlist.push(candidate);
        eligibleStreaksAllowed++;
      } else {
        streakOverflow.push(candidate);
      }
    } else {
      cooldownReserve.push(candidate);
    }
  }

  const collected: GitHubSearchRepoItem[] = [];
  const seen = new Set<string>();
  let collectedStreaks = 0;
  let rateLimited = false;

  const fetchAndCollect = async (
    candidates: RawTrendingCandidate[],
    options: { allowCooldown?: boolean; enforceStreakCap?: boolean } = {}
  ) => {
    const { allowCooldown = false, enforceStreakCap = true } = options;

    for (const candidate of candidates) {
      if (collected.length >= TARGET_REPO_COUNT || rateLimited) break;
      const key = normalizeRepoKey(candidate.fullName);
      if (seen.has(key)) continue;

      try {
        const metaRes = await fetch(`https://api.github.com/repos/${candidate.fullName}`, {
          headers,
        });
        if (
          metaRes.status === 429 ||
          (metaRes.status === 403 && metaRes.headers.get("x-ratelimit-remaining") === "0")
        ) {
          console.warn(
            `GitHub REST API rate limit reached (${metaRes.status}) while fetching ${candidate.fullName}. Short-circuiting metadata fetches.`
          );
          rateLimited = true;
          break;
        }
        if (!metaRes.ok) {
          console.warn(
            `GitHub API returned ${metaRes.status} for ${candidate.fullName}, skipping.`
          );
          continue;
        }
        const repoData = (await metaRes.json()) as GitHubSearchRepoItem;
        const resolvedKey = normalizeRepoKey(repoData.full_name);

        // Guard against renamed/redirected repos duplicating an already-collected or cooldown repo
        if (seen.has(resolvedKey)) {
          seen.add(key);
          continue;
        }
        if (!isInterestingCodeRepo(repoData.name, repoData.topics || [])) {
          seen.add(key);
          seen.add(resolvedKey);
          continue;
        }

        const resolvedStatus = classifyCandidate(resolvedKey, seenHistory, todayIct, {
          maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
          cooldownDays: COOLDOWN_DAYS,
        });
        if (!allowCooldown && resolvedStatus === "cooldown") {
          seen.add(key);
          seen.add(resolvedKey);
          continue;
        }
        if (enforceStreakCap && resolvedStatus === "streak" && collectedStreaks >= MAX_STREAK_SLOTS) {
          continue;
        }

        repoData.stars_today =
          candidate.starsToday > 0 ? candidate.starsToday : getStarsTodayApprox(repoData);
        collected.push(repoData);
        if (resolvedStatus === "streak") {
          collectedStreaks++;
        }
        seen.add(resolvedKey);
        seen.add(key);
      } catch {
        console.warn(`Could not fetch metadata for trending repo ${candidate.fullName}`);
      }
    }
  };

  // Fetch metadata for eligible (fresh + capped streak) scraped candidates first
  await fetchAndCollect(eligibleShortlist, {
    allowCooldown: false,
    enforceStreakCap: true,
  });
  console.log(
    `Collected ${collected.length}/${TARGET_REPO_COUNT} repositories from Trending tiers (${collectedStreaks} streaks).`
  );

  // Tier 3: GitHub Search API breakout repos (last 14 days) — only non-cooldown repos & respecting MAX_STREAK_SLOTS
  if (collected.length < TARGET_REPO_COUNT && !rateLimited) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const dateStr = fourteenDaysAgo.toISOString().split("T")[0];

    const query = `created:>=${dateStr} stars:>150 has:license`;
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;

    try {
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = (await res.json()) as GithubSearchRepoResponse;
        for (const repo of data.items || []) {
          if (collected.length >= TARGET_REPO_COUNT) break;
          const key = normalizeRepoKey(repo.full_name);
          if (seen.has(key)) continue;
          if (!isInterestingCodeRepo(repo.name, repo.topics || [])) continue;
          const status = classifyCandidate(key, seenHistory, todayIct, {
            maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
            cooldownDays: COOLDOWN_DAYS,
          });
          if (status === "cooldown") continue;
          if (status === "streak" && collectedStreaks >= MAX_STREAK_SLOTS) continue;

          repo.stars_today = getStarsTodayApprox(repo);
          collected.push(repo);
          if (status === "streak") {
            collectedStreaks++;
          }
          seen.add(key);
        }
        console.log(
          `After Tier 3 (Search API breakout): collected ${collected.length}/${TARGET_REPO_COUNT} repositories.`
        );
      } else {
        console.warn(`GitHub Search API returned ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching breakout GitHub repos:", error);
    }
  }

  // Tier 4a: Overflow streak repos before cooldown repos if still short
  if (collected.length < TARGET_REPO_COUNT && !rateLimited && streakOverflow.length > 0) {
    console.warn(
      `Only ${collected.length} repos after Tier 3 — backfilling from streak overflow before cooldown reserve.`
    );
    await fetchAndCollect(streakOverflow, {
      allowCooldown: false,
      enforceStreakCap: false,
    });
  }

  // Tier 4b: Graceful fallback to highest-velocity cooldown repos only if all above tiers fell short
  if (collected.length < TARGET_REPO_COUNT && !rateLimited && cooldownReserve.length > 0) {
    console.warn(
      `Only ${collected.length} fresh/streak repos available — backfilling remaining slots from cooldown reserve.`
    );
    const sortedReserve = [...cooldownReserve].sort((a, b) => b.starsToday - a.starsToday);
    await fetchAndCollect(sortedReserve, {
      allowCooldown: true,
      enforceStreakCap: false,
    });
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

async function loadPreviousFeed(todayIct: string): Promise<{
  yesterdayRepos: RepositoryData[];
  cachedById: Map<string, RepositoryData>;
  seenHistory: RepoHistoryMap;
}> {
  const cachedById = new Map<string, RepositoryData>();
  let yesterdayRepos: RepositoryData[] = [];
  let seenHistory: RepoHistoryMap = {};

  try {
    const raw = await fs.readFile(REPOS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      yesterdayRepos = parsed as RepositoryData[];
      for (const r of yesterdayRepos) {
        cachedById.set(r.id, r);
        cachedById.set(normalizeRepoKey(r.owner, r.name), r);
      }
      seenHistory = bootstrapSeenHistory(undefined, [], yesterdayRepos, todayIct);
    } else if (parsed && typeof parsed === "object") {
      const prevToday: RepositoryData[] = Array.isArray(parsed.today) ? parsed.today : [];
      const prevYesterday: RepositoryData[] = Array.isArray(parsed.yesterday)
        ? parsed.yesterday
        : [];

      for (const r of [...prevYesterday, ...prevToday]) {
        cachedById.set(r.id, r);
        cachedById.set(normalizeRepoKey(r.owner, r.name), r);
      }

      const prevDate = toBangkokDate(prevToday[0]?.updated_at);

      if ((prevDate && todayIct && prevDate !== todayIct) || prevYesterday.length === 0) {
        yesterdayRepos = prevToday;
      } else {
        yesterdayRepos = prevYesterday;
      }

      seenHistory = bootstrapSeenHistory(
        parsed.seen_history,
        prevToday,
        prevYesterday,
        todayIct
      );
    }
  } catch {
    console.warn("Could not read existing repos.json, starting fresh.");
  }

  return { yesterdayRepos, cachedById, seenHistory };
}

async function main() {
  const refreshLatest = hasRefreshLatestFlag();
  const backfill3Pass = hasBackfill3PassFlag();
  const todayIct = toBangkokDate(new Date()) || new Date().toISOString().slice(0, 10);

  console.log(
    `Starting RepoRadar Data Pipeline (${todayIct} ICT)...${
      backfill3Pass
        ? " [BACKFILL 3-PASS MODE]"
        : refreshLatest
        ? " [REFRESH LATEST MODE]"
        : ""
    }`
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

  const { yesterdayRepos, cachedById, seenHistory } = await loadPreviousFeed(todayIct);
  console.log(`Loaded seen_history with ${Object.keys(seenHistory).length} tracked repos (14-day window).`);

  const repos = await fetchGitHubTrending(seenHistory, todayIct);
  if (repos.length === 0) {
    console.log("No repos fetched. Pipeline finished.");
    return;
  }

  console.log(`Found ${repos.length} trending repositories. Processing...`);

  const results: RepositoryData[] = [];

  for (const repo of repos) {
    const existing =
      cachedById.get(repo.id.toString()) ||
      cachedById.get(normalizeRepoKey(repo.full_name));

    if (existing && !refreshLatest && existing.reading_guide) {
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
      `${(refreshLatest || backfill3Pass) && existing ? "🔄 Refreshing" : "Processing"}: ${repo.full_name}...`
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
    const nextSeenHistory = updateSeenHistory(seenHistory, results, todayIct);
    const payload = {
      today: results,
      yesterday: yesterdayRepos,
      seen_history: nextSeenHistory,
    };
    await fs.writeFile(REPOS_FILE_PATH, JSON.stringify(payload, null, 2));
    console.log(
      `Successfully wrote ${results.length} today repos, ${yesterdayRepos.length} yesterday repos, and ${Object.keys(nextSeenHistory).length} history entries to ${REPOS_FILE_PATH}`
    );
  } else {
    console.log("No repositories were successfully processed. Keeping existing data.");
  }
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("fetch-trending.ts");

if (isDirectRun) {
  main().catch((err) => {
    console.error("Failed in fetch-trending.ts:", err);
    process.exitCode = 1;
  });
}
