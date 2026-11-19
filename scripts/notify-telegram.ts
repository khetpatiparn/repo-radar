import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import {
  SyncStatusSchema,
  type ReposFeedData,
  type PapersFeedData,
  type NewsFeedData,
  type SyncStatusData,
  type RepositoryData,
  type PaperData,
  type NewsArticleData,
} from "../src/types";

dotenv.config({ path: ".env.local" });

const DATA_DIR = path.join(process.cwd(), "src/data");
const REPOS_PATH = path.join(DATA_DIR, "repos.json");
const PAPERS_PATH = path.join(DATA_DIR, "papers.json");
const NEWS_PATH = path.join(DATA_DIR, "news.json");
const SYNC_STATUS_PATH = path.join(DATA_DIR, "sync-status.json");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITE_URL = process.env.SITE_URL || "https://repo-radar-lyart.vercel.app";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getBangkokDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatThaiTimestamp(date: Date): string {
  const datePart = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} เวลา ${timePart} น.`;
}

async function readJsonSafe<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isNewSince(isoTimestamp: string | undefined, cutoffMs: number | null): boolean {
  if (!isoTimestamp || cutoffMs === null) return false;
  const parsed = Date.parse(isoTimestamp);
  return !Number.isNaN(parsed) && parsed > cutoffMs;
}

export function buildTelegramMessage(
  status: SyncStatusData,
  options: {
    siteUrl: string;
    isTest?: boolean;
    topPaper?: PaperData;
    topRepo?: RepositoryData;
    topNews?: NewsArticleData;
  }
): string {
  const syncDate = new Date(status.last_sync_at);
  const thaiTime = formatThaiTimestamp(syncDate);
  const { repos, papers, news, total } = status.new_counts;

  const lines: string[] = [];
  if (options.isTest) {
    lines.push("🧪 <b>[TEST] THE REPO RADAR — ทดสอบแจ้งเตือน Telegram</b>");
  } else {
    lines.push("🟠 <b>THE REPO RADAR — อัปเดตข่าว AI ประจำวัน</b>");
  }
  lines.push(`🕒 ซิงก์ล่าสุด: ${escapeHtml(thaiTime)}`);
  lines.push("");

  if (total > 0) {
    lines.push(`✨ <b>มีรายการอัปเดตใหม่วันนี้ทั้งหมด ${total} รายการ</b>`);
  } else {
    lines.push("ℹ️ <b>ซิงก์ข้อมูลรอบเช้าเรียบร้อยแล้ว</b> (วันนี้ยังไม่มีรายการใหม่เพิ่มเติม)");
  }

  lines.push(
    `• 📄 <b>AI Papers ใหม่:</b> +${papers} เปเปอร์ (ฉบับวันนี้รวม ${status.total_counts.papers_today})`
  );
  lines.push(
    `• 💻 <b>GitHub Repos ใหม่:</b> +${repos} repo (ติดเทรนด์วันนี้รวม ${status.total_counts.repos_today})`
  );
  lines.push(
    `• 📰 <b>ข่าว Google AI ใหม่:</b> +${news} ข่าว (คลังข่าวทั้งหมด ${status.total_counts.news_total})`
  );

  const highlightLines: string[] = [];
  if (options.topPaper) {
    highlightLines.push(
      `• <b>[Paper]</b> ${escapeHtml(options.topPaper.hook_headline)}`
    );
  }
  if (options.topRepo) {
    highlightLines.push(
      `• <b>[Repo]</b> ${escapeHtml(options.topRepo.owner)}/${escapeHtml(options.topRepo.name)} (+${options.topRepo.stars_today.toLocaleString()}⭐) — ${escapeHtml(options.topRepo.one_liner)}`
    );
  }
  if (options.topNews) {
    highlightLines.push(
      `• <b>[Google]</b> ${escapeHtml(options.topNews.hook_headline)}`
    );
  }

  if (highlightLines.length > 0) {
    lines.push("");
    lines.push("🔥 <b>ไฮไลต์น่าอ่านวันนี้:</b>");
    lines.push(...highlightLines);
  }

  lines.push("");
  lines.push(`👉 <a href="${escapeHtml(options.siteUrl)}">เปิดอ่านสรุปฉบับเต็มบน THE REPO RADAR</a>`);

  return lines.join("\n");
}

async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log(
      "ℹ️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured — skipping Telegram push."
    );
    return false;
  }

  const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Telegram API error (${res.status}): ${body}`);
    return false;
  }

  console.log("✅ Telegram daily notification sent successfully!");
  return true;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isDryRun = args.has("--dry-run");
  const isInitStatus = args.has("--init-status");
  const isTest = args.has("--test");

  const reposFeed = await readJsonSafe<ReposFeedData>(REPOS_PATH);
  const papersFeed = await readJsonSafe<PapersFeedData>(PAPERS_PATH);
  const newsFeed = await readJsonSafe<NewsFeedData>(NEWS_PATH);
  const prevStatus = await readJsonSafe<SyncStatusData>(SYNC_STATUS_PATH);

  const todayRepos = Array.isArray(reposFeed?.today) ? reposFeed.today : [];
  const yesterdayRepos = Array.isArray(reposFeed?.yesterday) ? reposFeed.yesterday : [];
  const paperDays = Array.isArray(papersFeed?.days) ? papersFeed.days : [];
  const todayPapers = paperDays[0]?.papers || [];
  const recentPapers = [...(paperDays[0]?.papers || []), ...(paperDays[1]?.papers || [])];
  const allNews = Array.isArray(newsFeed?.articles) ? newsFeed.articles : [];

  const prevCutoffMs =
    !isInitStatus && prevStatus?.last_sync_at ? Date.parse(prevStatus.last_sync_at) : null;
  const validCutoffMs = prevCutoffMs !== null && !Number.isNaN(prevCutoffMs) ? prevCutoffMs : null;

  // 1. Detect newly discovered Repos
  const yesterdayRepoKeys = new Set<string>();
  for (const r of yesterdayRepos) {
    yesterdayRepoKeys.add(r.id);
    yesterdayRepoKeys.add(`${r.owner}/${r.name}`.toLowerCase());
  }

  const newRepos = todayRepos.filter((r) => {
    if (r.first_seen_at && validCutoffMs !== null) {
      return isNewSince(r.first_seen_at, validCutoffMs);
    }
    return !yesterdayRepoKeys.has(r.id) && !yesterdayRepoKeys.has(`${r.owner}/${r.name}`.toLowerCase());
  });

  // 2. Detect newly discovered Papers (checks both today and yesterday batch so newly fetched yesterday papers are caught!)
  const seenPaperIds = new Set<string>();
  const newPapers = recentPapers.filter((p) => {
    if (seenPaperIds.has(p.id)) return false;
    seenPaperIds.add(p.id);
    if (p.first_seen_at && validCutoffMs !== null) {
      return isNewSince(p.first_seen_at, validCutoffMs);
    }
    // Baseline fallback: treat latest day's papers as new on initial status creation
    return p.published_date === paperDays[0]?.date;
  });

  // 3. Detect newly discovered Google AI Lab News
  const latestNewsDate = allNews[0]?.published_date;
  const newNews = allNews.filter((a) => {
    if (a.first_seen_at && validCutoffMs !== null) {
      return isNewSince(a.first_seen_at, validCutoffMs);
    }
    return Boolean(latestNewsDate && a.published_date === latestNewsDate);
  });

  // Pick latest timestamp across feeds for --init-status, otherwise current sync timestamp
  const feedLatestIso = [
    papersFeed?.updated_at,
    newsFeed?.updated_at,
    todayRepos[0]?.updated_at,
  ]
    .filter((v): v is string => Boolean(v))
    .sort((a, b) => b.localeCompare(a))[0];

  const syncDate = isInitStatus && feedLatestIso ? new Date(feedLatestIso) : new Date();
  const syncIso = syncDate.toISOString();

  const topPaper = newPapers[0] || todayPapers[0];
  const topRepo = newRepos[0] || todayRepos[0];
  const topNews = newNews[0] || allNews[0];

  const statusDraft: SyncStatusData = {
    last_sync_at: syncIso,
    last_sync_date_ict: getBangkokDateStr(syncDate),
    new_counts: {
      repos: newRepos.length,
      papers: newPapers.length,
      news: newNews.length,
      total: newRepos.length + newPapers.length + newNews.length,
    },
    total_counts: {
      repos_today: todayRepos.length,
      papers_today: todayPapers.length,
      news_total: allNews.length,
    },
    new_ids: {
      repos: newRepos.map((r) => r.id),
      papers: newPapers.map((p) => p.id),
      news: newNews.map((a) => a.id),
    },
    highlights: {
      top_paper: topPaper?.hook_headline ?? null,
      top_repo: topRepo ? `${topRepo.owner}/${topRepo.name}: ${topRepo.one_liner}` : null,
      top_news: topNews?.hook_headline ?? null,
    },
    telegram_sent_at: prevStatus?.telegram_sent_at ?? null,
    run_source: process.env.GITHUB_ACTIONS === "true" ? "github-actions" : "local",
  };

  const message = buildTelegramMessage(statusDraft, {
    siteUrl: SITE_URL,
    isTest,
    topPaper,
    topRepo,
    topNews,
  });

  if (isDryRun) {
    console.log("--- Telegram Dry Run Preview ---\n");
    console.log(message);
    console.log("\n--- Sync Status Preview ---");
    console.log(JSON.stringify(statusDraft, null, 2));
    return;
  }

  if (!isInitStatus) {
    const sent = await sendTelegramMessage(message);
    if (sent) {
      statusDraft.telegram_sent_at = new Date().toISOString();
    }
  }

  const validated = SyncStatusSchema.parse(statusDraft);
  await fs.writeFile(SYNC_STATUS_PATH, JSON.stringify(validated, null, 2));
  console.log(
    `✅ Updated sync status (${validated.new_counts.papers} new papers, ${validated.new_counts.repos} new repos, ${validated.new_counts.news} new Google news) -> ${SYNC_STATUS_PATH}`
  );
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].endsWith("notify-telegram.ts");

if (isDirectRun) {
  main().catch((err) => {
    console.error("Failed in notify-telegram.ts:", err);
    process.exitCode = 1;
  });
}
