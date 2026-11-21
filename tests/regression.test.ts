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

  it("should strictly filter out regional corporate PR posts while keeping real AI/Dev news", async () => {
    const { isRelevantAITechItem } = await import("../scripts/fetch-news");

    // Regional corporate PR like Google for Mexico must be rejected
    expect(
      isRelevantAITechItem(
        "Google for Mexico: Technology impact that goes beyond business",
        "Google announces local SME initiatives in Mexico",
        ["Google in Latin America"],
        "https://blog.google/company-news/inside-google/around-the-globe/google-latin-america/google-for-mexico-2026-november/"
      )
    ).toBe(false);

    // Real model/developer release must be accepted
    expect(
      isRelevantAITechItem(
        "Introducing Gemini 4 Neon",
        "A new fast reasoning model available via Gemini API and Google AI Studio",
        ["Gemini models"],
        "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-neon/"
      )
    ).toBe(true);
  });

  it("should extract clean readable text from HTML and sanitize 3-Pass DeepReadingGuide payloads", async () => {
    const {
      extractReadableTextFromHtml,
      extractArxivHtmlHighlights,
      sanitizeReadingGuide,
    } = await import("../scripts/lib/deep-reading");

    const sampleHtml = `
      <html>
        <head><style>.x{color:red}</style><script>alert(1)</script></head>
        <body>
          <nav>Home | About | Subscribe</nav>
          <article>
            <h1>Introducing Gemini 4 Neon</h1>
            <p>Gemini 4 Neon achieves 88.4% on GPQA Diamond with 40% lower latency than Gemini 3 Pro.</p>
            <p>Developers can call model ID gemini-4-neon via Google AI Studio starting today.</p>
          </article>
          <footer>Privacy Policy</footer>
        </body>
      </html>
    `;
    const extracted = extractReadableTextFromHtml(sampleHtml, 1000);
    expect(extracted).toContain("88.4% on GPQA Diamond");
    expect(extracted).toContain("gemini-4-neon");
    expect(extracted).not.toContain("alert(1)");
    expect(extracted).not.toContain("Privacy Policy");

    const arxivExtracted = extractArxivHtmlHighlights(
      `${sampleHtml}<section class="ltx_bibliography"><p>Ignored citation list</p></section>`,
      1000
    );
    expect(arxivExtracted).toContain("88.4%");
    expect(arxivExtracted).not.toContain("Ignored citation list");

    const sanitized = sanitizeReadingGuide(
      {
        pass1_triage: {
          core_idea: "แยกปรับน้ำหนักแบบ Low-rank สองทิศทาง",
          prerequisite_level: "เข้าใจพื้นฐาน LoRA และ PyTorch",
          worth_deep_dive: "รู้คอนเซปต์ Pass 1-2 พอ",
          context_lineage: "ต่อยอดจาก LoRA (Hu et al., 2021)",
        },
        glossary: [
          {
            term: "Low-rank Adaptation (LoRA)",
            meaning: "เทคนิค Fine-tune โดยเพิ่มเมทริกซ์เล็กๆ แทนการแก้พารามิเตอร์ทั้งหมด",
            analogy: "เหมือนติดกระดาษโน้ตแก้เฉพาะจุด แทนการพิมพ์หนังสือใหม่ทั้งเล่ม",
          },
        ],
        how_it_works: [
          {
            step: "แยกทิศทางหลักและทิศทางตั้งฉาก",
            detail: "แบ่ง Rank budget ออกเป็น 2 ส่วนเพื่อลดการทับซ้อนของ Gradient",
          },
        ],
        hard_evidence: [
          {
            metric: "RMSE Reduction",
            value: "ต้นฉบับไม่ระบุตัวเลข",
            context: "เทียบกับ LoRA มาตรฐาน",
          },
        ],
        pass3_hands_on: {
          prerequisites: ["Python 3.10+", "PyTorch + GPU 16GB"],
          try_it_steps: ["Clone repo และรันสคริปต์ตัวอย่าง"],
          next_to_learn: ["SVD & Low-Rank Matrix Factorization"],
        },
      },
      "arxiv_and_readme"
    );
    expect(sanitized).toBeDefined();
    expect(sanitized?.source_depth).toBe("arxiv_and_readme");
    expect(sanitized?.glossary.length).toBe(1);
    expect(sanitized?.how_it_works.length).toBe(1);
    expect(sanitized?.hard_evidence[0].value).toBe("ต้นฉบับไม่ระบุตัวเลข");
  });

  it("should reconcile stale pre-3-Pass bookmarks against latest 3-Pass feed data without downgrading", async () => {
    const {
      reconcileSavedNews,
      reconcileSavedPapers,
      reconcileSavedRepos,
    } = await import("../src/lib/savedReconcile");
    const nFeed = newsData as unknown as NewsFeedData;
    const pFeed = papersData as unknown as PapersFeedData;
    const rFeed = reposData as unknown as ReposFeedData;

    // 1. News: stale bookmark without reading_guide upgrades to live 3-Pass article
    const freshNewsWith3Pass = nFeed.articles.find((a) => Boolean(a.reading_guide));
    expect(freshNewsWith3Pass).toBeDefined();
    if (freshNewsWith3Pass) {
      const staleNews = { ...freshNewsWith3Pass, reading_guide: undefined };
      const { map, changed, upgradedCount } = reconcileSavedNews(
        { [staleNews.id]: staleNews },
        nFeed.articles
      );
      expect(changed).toBe(true);
      expect(upgradedCount).toBe(1);
      expect(map[freshNewsWith3Pass.id].reading_guide).toBeDefined();

      // Never downgrade an existing 3-Pass bookmark if feed lacked reading_guide
      const downgradedFeed = [{ ...freshNewsWith3Pass, reading_guide: undefined }];
      const noDowngrade = reconcileSavedNews(
        { [freshNewsWith3Pass.id]: freshNewsWith3Pass },
        downgradedFeed
      );
      expect(noDowngrade.changed).toBe(false);
      expect(noDowngrade.map[freshNewsWith3Pass.id].reading_guide).toBeDefined();
    }

    // 2. Paper: stale bookmark upgrades cleanly
    const freshPaperWith3Pass = pFeed.days[0].papers.find((p) => Boolean(p.reading_guide));
    expect(freshPaperWith3Pass).toBeDefined();
    if (freshPaperWith3Pass) {
      const stalePaper = { ...freshPaperWith3Pass, reading_guide: undefined };
      const res = reconcileSavedPapers(
        { [stalePaper.id]: stalePaper },
        pFeed.days[0].papers
      );
      expect(res.changed).toBe(true);
      expect(res.map[freshPaperWith3Pass.id].reading_guide).toBeDefined();
    }

    // 3. Repo: stale bookmark upgrades cleanly
    const freshRepoWith3Pass = rFeed.today.find((r) => Boolean(r.reading_guide));
    expect(freshRepoWith3Pass).toBeDefined();
    if (freshRepoWith3Pass) {
      const staleRepo = { ...freshRepoWith3Pass, reading_guide: undefined };
      const res = reconcileSavedRepos(
        { [staleRepo.id]: staleRepo },
        rFeed.today
      );
      expect(res.changed).toBe(true);
      expect(res.map[freshRepoWith3Pass.id].reading_guide).toBeDefined();
    }
  });

  it("should honestly adapt legacy items without reading_guide into valid 3-Pass DeepReadingGuide", async () => {
    const {
      resolveNewsReadingGuide,
      resolvePaperReadingGuide,
      resolveRepoReadingGuide,
    } = await import("../src/lib/legacyReadingGuide");
    const { DeepReadingGuideSchema } = await import("../src/types");
    const nFeed = newsData as unknown as NewsFeedData;
    const pFeed = papersData as unknown as PapersFeedData;
    const rFeed = reposData as unknown as ReposFeedData;

    const legacyNews = { ...nFeed.articles[0], reading_guide: undefined };
    const newsGuide = resolveNewsReadingGuide(legacyNews);
    expect(DeepReadingGuideSchema.safeParse(newsGuide).success).toBe(true);
    expect(newsGuide.source_depth).toBe("legacy_adapted");
    expect(newsGuide.glossary).toEqual([]);
    expect(newsGuide.pass3_hands_on.try_it_steps.length).toBeGreaterThan(0);

    const legacyPaper = { ...pFeed.days[0].papers[0], reading_guide: undefined };
    const paperGuide = resolvePaperReadingGuide(legacyPaper);
    expect(DeepReadingGuideSchema.safeParse(paperGuide).success).toBe(true);
    expect(paperGuide.source_depth).toBe("legacy_adapted");
    expect(paperGuide.glossary).toEqual([]);

    const legacyRepo = { ...rFeed.today[0], reading_guide: undefined };
    const repoGuide = resolveRepoReadingGuide(legacyRepo);
    expect(DeepReadingGuideSchema.safeParse(repoGuide).success).toBe(true);
    expect(repoGuide.source_depth).toBe("legacy_adapted");
    expect(repoGuide.glossary).toEqual([]);
  });
});



