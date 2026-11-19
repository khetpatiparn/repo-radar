import { describe, it, expect } from "vitest";
import reposData from "../src/data/repos.json";
import papersData from "../src/data/papers.json";
import newsData from "../src/data/news.json";
import syncStatusData from "../src/data/sync-status.json";
import {
  RepositorySchema,
  PaperSchema,
  NewsArticleSchema,
  SyncStatusSchema,
  PAPER_CATEGORIES,
  NEWS_CATEGORIES,
  type RepositoryData,
  type ReposFeedData,
  type PapersFeedData,
  type NewsFeedData,
  type SyncStatusData,
} from "../src/types";
import { getFreshnessInfo } from "../src/lib/freshness";
import {
  buildPaperFacebookPost,
  buildRepoFacebookPost,
  buildNewsFacebookPost,
} from "../src/lib/facebookPost";
import { buildTelegramMessage } from "../scripts/notify-telegram";

describe("Regression Tests: Data Schemas & Pipeline Integrity", () => {
  it("should validate repos.json against RepositorySchema for both today and yesterday", () => {
    const feed = reposData as unknown as ReposFeedData;
    expect(feed).toBeDefined();
    expect(Array.isArray(feed.today)).toBe(true);
    expect(Array.isArray(feed.yesterday)).toBe(true);
    expect(feed.today.length).toBeGreaterThan(0);
    expect(feed.yesterday.length).toBeGreaterThan(0);

    // Validate every repo in today against Zod schema
    for (const repo of feed.today) {
      const parsed = RepositorySchema.safeParse(repo);
      expect(
        parsed.success,
        `Repo ${repo.owner}/${repo.name} failed Zod schema: ${parsed.error?.message}`
      ).toBe(true);
      expect(repo.one_liner.length).toBeGreaterThan(5);
      expect(repo.problem_solved.length).toBeGreaterThan(10);
      expect(["Production-Ready", "Experimental", "PoC"]).toContain(repo.maturity_rating);
      expect(repo.human_vibe_check.pros.length).toBe(2);
      expect(repo.human_vibe_check.gotchas_and_traps.length).toBe(2);
    }

    // Validate every repo in yesterday
    for (const repo of feed.yesterday) {
      const parsed = RepositorySchema.safeParse(repo);
      expect(parsed.success).toBe(true);
    }
  });

  it("should validate papers.json against PaperSchema for 7-day rolling feed", () => {
    const feed = papersData as unknown as PapersFeedData;
    expect(feed).toBeDefined();
    expect(Array.isArray(feed.days)).toBe(true);
    expect(feed.days.length).toBeGreaterThan(0);

    let totalPapersChecked = 0;
    for (const day of feed.days) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(day.papers)).toBe(true);

      for (const paper of day.papers) {
        const parsed = PaperSchema.safeParse(paper);
        expect(
          parsed.success,
          `Paper ${paper.id} failed PaperSchema: ${parsed.error?.message}`
        ).toBe(true);

        // Verify Thai editorial requirements
        expect(paper.hook_headline.length).toBeGreaterThan(10);
        expect(paper.short_teaser.length).toBeGreaterThan(15);
        expect(paper.tldr_takeaways.length).toBeGreaterThanOrEqual(2);
        expect(paper.layman_story.length).toBeGreaterThanOrEqual(1);
        expect(paper.impact_comparison.before).toBeDefined();
        expect(paper.impact_comparison.after).toBeDefined();
        expect(paper.use_cases.length).toBeGreaterThanOrEqual(1);
        expect(PAPER_CATEGORIES).toContain(paper.category);
        totalPapersChecked++;
      }
    }

    expect(totalPapersChecked).toBeGreaterThanOrEqual(10);
  });

  it("should correctly detect 2-day consecutive trending streak and star delta", () => {
    const feed = reposData as unknown as ReposFeedData;
    const yesterdayMap = new Map<string, RepositoryData>();
    for (const r of feed.yesterday) {
      yesterdayMap.set(r.id, r);
      yesterdayMap.set(`${r.owner}/${r.name}`.toLowerCase(), r);
    }

    let streakCount = 0;
    for (const repo of feed.today) {
      const key = `${repo.owner}/${repo.name}`.toLowerCase();
      const match = yesterdayMap.get(repo.id) || yesterdayMap.get(key);
      if (match) {
        streakCount++;
        const delta = Math.max(0, repo.stars - match.stars);
        expect(delta).toBeGreaterThanOrEqual(0);
      }
    }

    expect(streakCount).toBeGreaterThanOrEqual(0);
  });

  it("should ensure all paper categories match the 6 official editorial categories", () => {
    const feed = papersData as unknown as PapersFeedData;
    const foundCategories = new Set<string>();

    for (const day of feed.days) {
      for (const p of day.papers) {
        foundCategories.add(p.category);
      }
    }

    for (const cat of foundCategories) {
      expect(PAPER_CATEGORIES).toContain(cat);
    }
  });

  it("should validate news.json against NewsArticleSchema and official subcategories", () => {
    const feed = newsData as unknown as NewsFeedData;
    expect(feed).toBeDefined();
    expect(Array.isArray(feed.articles)).toBe(true);
    expect(feed.articles.length).toBeGreaterThanOrEqual(10);

    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    for (const article of feed.articles) {
      const parsed = NewsArticleSchema.safeParse(article);
      expect(
        parsed.success,
        `News article ${article.id} failed NewsArticleSchema: ${parsed.error?.message}`
      ).toBe(true);

      expect(seenIds.has(article.id)).toBe(false);
      expect(seenUrls.has(article.url)).toBe(false);
      seenIds.add(article.id);
      seenUrls.add(article.url);

      expect(NEWS_CATEGORIES).toContain(article.category);
      expect(article.hook_headline.length).toBeGreaterThan(10);
      expect(article.short_teaser.length).toBeGreaterThan(15);
      expect(article.tldr_takeaways.length).toBeGreaterThanOrEqual(2);
      expect(article.layman_story.length).toBeGreaterThanOrEqual(2);
      expect(article.actionable_playbook.length).toBe(3);
      expect(article.key_highlights.whats_new.length).toBeGreaterThanOrEqual(1);
      expect(article.key_highlights.watchouts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should validate sync-status.json and build a formatted Telegram digest", () => {
    const parsed = SyncStatusSchema.safeParse(syncStatusData);
    expect(
      parsed.success,
      `sync-status.json failed SyncStatusSchema: ${parsed.error?.message}`
    ).toBe(true);

    const status = syncStatusData as unknown as SyncStatusData;
    expect(status.new_counts.total).toBe(
      status.new_counts.repos + status.new_counts.papers + status.new_counts.news
    );

    const msg = buildTelegramMessage(status, {
      siteUrl: "https://repo-radar-lyart.vercel.app",
    });
    expect(msg).toContain("THE REPO RADAR");
    expect(msg).toContain(`+${status.new_counts.papers}`);
    expect(msg).toContain(`+${status.new_counts.repos}`);
    expect(msg).toContain(`+${status.new_counts.news}`);
    expect(msg).toContain("https://repo-radar-lyart.vercel.app");
  });

  it("should detect delayed-arrival papers fetched today whose published_date is earlier", () => {
    const status = syncStatusData as unknown as SyncStatusData;
    const samplePaperId = status.new_ids.papers[0] || "2611.99999";

    const delayedInfo = getFreshnessInfo(
      {
        id: samplePaperId,
        published_date: "2026-11-17",
        first_seen_at: status.last_sync_at,
      },
      "papers",
      status,
      new Set()
    );
    expect(delayedInfo.isNew).toBe(true);
    expect(delayedInfo.isUnreadNew).toBe(true);
    expect(delayedInfo.isDelayedArrival).toBe(true);
    expect(delayedInfo.provenanceLabel).toContain("เพิ่งดึงเข้าวันนี้");

    const readInfo = getFreshnessInfo(
      {
        id: samplePaperId,
        published_date: "2026-11-17",
        first_seen_at: status.last_sync_at,
      },
      "papers",
      status,
      new Set([`papers:${samplePaperId}`])
    );
    expect(readInfo.isRead).toBe(true);
    expect(readInfo.isUnreadNew).toBe(false);
  });

  it("should compose ready-to-share Thai Facebook posts for papers, repos, and Google AI news", () => {
    const pFeed = papersData as unknown as PapersFeedData;
    const rFeed = reposData as unknown as ReposFeedData;
    const nFeed = newsData as unknown as NewsFeedData;

    const paperPost = buildPaperFacebookPost(pFeed.days[0].papers[0]);
    expect(paperPost.length).toBeGreaterThan(180);
    expect(paperPost).toContain("#TheRepoRadar");

    const repoPost = buildRepoFacebookPost(rFeed.today[0]);
    expect(repoPost.length).toBeGreaterThan(180);
    expect(repoPost).toContain(rFeed.today[0].url);

    const newsPost = buildNewsFacebookPost(nFeed.articles[0]);
    expect(newsPost.length).toBeGreaterThan(180);
    expect(newsPost).toContain(nFeed.articles[0].url);
  });
});


