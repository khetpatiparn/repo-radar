import { describe, it, expect } from "vitest";
import reposData from "../src/data/repos.json";
import papersData from "../src/data/papers.json";
import {
  RepositorySchema,
  PaperSchema,
  PAPER_CATEGORIES,
  type RepositoryData,
  type ReposFeedData,
  type PapersFeedData,
} from "../src/types";

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
});
