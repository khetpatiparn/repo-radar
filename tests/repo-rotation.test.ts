import { describe, it, expect } from "vitest";
import type { RepositoryData } from "../src/types";
import {
  COOLDOWN_DAYS,
  MAX_CONSECUTIVE_DAYS,
  MAX_STREAK_SLOTS,
  TARGET_REPO_COUNT,
  bootstrapSeenHistory,
  classifyCandidate,
  mergeCandidatePools,
  parseTrendingHtml,
  selectRotatedCandidates,
  updateSeenHistory,
  type RawTrendingCandidate,
  type RepoHistoryMap,
} from "../scripts/lib/repo-rotation";

function makeRepo(
  owner: string,
  name: string,
  firstSeenIso: string,
  updatedIso: string
): RepositoryData {
  return {
    id: `${owner}-${name}`,
    name,
    owner,
    url: `https://github.com/${owner}/${name}`,
    stars: 1000,
    stars_today: 100,
    language: "TypeScript",
    topics: [],
    license: "MIT",
    open_issues: 5,
    one_liner: "Test repo summary",
    problem_solved: "Solves a test problem cleanly.",
    alternative_comparison: "Better than manual scripts.",
    maturity_rating: "Production-Ready",
    maturity_reason: "Has tests and docs.",
    ai_opportunity: {
      monetization_idea: "Dev workflow automation",
      stack_synergy: "TypeScript + Node",
    },
    human_vibe_check: {
      pros: ["Fast", "Simple"],
      gotchas_and_traps: ["Needs API key", "Rate limits"],
      hype_vs_reality: 8,
    },
    quick_start: "npm install",
    first_seen_at: firstSeenIso,
    updated_at: updatedIso,
  };
}

describe("Repo Trending Rotation & Cooldown", () => {
  it("parses daily and weekly GitHub Trending HTML and filters non-code lists", () => {
    const dailyHtml = `
      <article class="Box-row">
        <h2><a href="/org-a/cool-agent">org-a / cool-agent</a></h2>
        <span>1,250 stars today</span>
      </article>
      <article class="Box-row">
        <h2><a href="/org-b/awesome-ai">org-b / awesome-ai</a></h2>
        <span>3,000 stars today</span>
      </article>
      <article class="Box-row">
        <h2><a href="/org-a/cool-agent">org-a / cool-agent</a></h2>
        <span>1,250 stars today</span>
      </article>
    `;
    const daily = parseTrendingHtml(dailyHtml, "daily");
    expect(daily).toEqual([
      { fullName: "org-a/cool-agent", starsToday: 1250, tier: "daily" },
    ]);

    const weeklyHtml = `
      <article class="Box-row">
        <h2><a href="/org-c/fast-db">org-c / fast-db</a></h2>
        <span>2,100 stars this week</span>
      </article>
    `;
    const weekly = parseTrendingHtml(weeklyHtml, "weekly");
    expect(weekly).toEqual([
      { fullName: "org-c/fast-db", starsToday: 300, tier: "weekly" },
    ]);
  });

  it("classifies fresh, 2-day streak, cooldown, same-day rerun, and expired cooldown correctly", () => {
    const history: RepoHistoryMap = {
      "org/day1-yesterday": {
        first_seen_date: "2026-11-26",
        last_seen_date: "2026-11-26",
        appearances: 1,
      },
      "org/day2-yesterday": {
        first_seen_date: "2026-11-25",
        last_seen_date: "2026-11-26",
        appearances: 2,
      },
      "org/dropped-3-days-ago": {
        first_seen_date: "2026-11-24",
        last_seen_date: "2026-11-24",
        appearances: 1,
      },
      "org/expired-cooldown": {
        first_seen_date: "2026-11-10",
        last_seen_date: "2026-11-11",
        appearances: 2,
      },
      "org/same-day-fresh": {
        first_seen_date: "2026-11-27",
        last_seen_date: "2026-11-27",
        appearances: 1,
      },
      "org/same-day-stuck-8-days": {
        first_seen_date: "2026-11-18",
        last_seen_date: "2026-11-27",
        appearances: 9,
      },
    };

    const today = "2026-11-27";
    expect(classifyCandidate("org/brand-new", history, today)).toBe("fresh");
    expect(classifyCandidate("org/day1-yesterday", history, today)).toBe("streak");
    expect(classifyCandidate("org/day2-yesterday", history, today)).toBe("cooldown");
    // Prevents ping-ponging back after dropping off
    expect(classifyCandidate("org/dropped-3-days-ago", history, today)).toBe("cooldown");
    // Older than COOLDOWN_DAYS (14) can trend again
    expect(classifyCandidate("org/expired-cooldown", history, today)).toBe("fresh");
    // Same-day rerun keeps Day-1 repo fresh, but rotates out long-stuck repos
    expect(classifyCandidate("org/same-day-fresh", history, today)).toBe("fresh");
    expect(classifyCandidate("org/same-day-stuck-8-days", history, today)).toBe("cooldown");
  });

  it("merges multi-tier candidate pools without duplicates, preserving daily order and sorting fallback tiers by starsToday", () => {
    const daily: RawTrendingCandidate[] = [
      { fullName: "a/first", starsToday: 300, tier: "daily" },
      { fullName: "a/second", starsToday: 900, tier: "daily" },
    ];
    const lang: RawTrendingCandidate[] = [
      { fullName: "a/second", starsToday: 900, tier: "language" },
      { fullName: "b/low", starsToday: 200, tier: "language" },
      { fullName: "b/high", starsToday: 800, tier: "language" },
    ];
    const weekly: RawTrendingCandidate[] = [
      { fullName: "c/week-low", starsToday: 100, tier: "weekly" },
      { fullName: "c/week-high", starsToday: 500, tier: "weekly" },
    ];

    const merged = mergeCandidatePools([daily, lang, weekly]);
    expect(merged.map((c) => c.fullName)).toEqual([
      "a/first",
      "a/second",
      "b/high",
      "b/low",
      "c/week-high",
      "c/week-low",
    ]);
  });

  it("rotates frozen board over 3 consecutive days while preserving up to MAX_STREAK_SLOTS streaks and zero ping-pong", () => {
    // Frozen daily board (12 same repos every day) + 25 language-tier fresh candidates
    const frozenDaily: RawTrendingCandidate[] = Array.from({ length: 12 }, (_, i) => ({
      fullName: `frozen/repo-${i + 1}`,
      starsToday: 1000 - i * 50,
      tier: "daily",
    }));
    const langPool: RawTrendingCandidate[] = Array.from({ length: 25 }, (_, i) => ({
      fullName: `fresh/lang-${i + 1}`,
      starsToday: 700 - i * 20,
      tier: "language",
    }));
    const merged = mergeCandidatePools([frozenDaily, langPool]);

    // Day 1: Empty history -> takes the 12 daily trending repos
    let history: RepoHistoryMap = {};
    const day1 = selectRotatedCandidates(merged, history, "2026-11-28");
    expect(day1.selected).toHaveLength(TARGET_REPO_COUNT);
    expect(day1.counts.fresh).toBe(12);
    expect(day1.counts.streak).toBe(0);
    history = updateSeenHistory(
      history,
      day1.selected.map((c) => {
        const [owner, name] = c.fullName.split("/");
        return { owner, name };
      }),
      "2026-11-28"
    );

    // Day 2: Frozen board -> keeps at most MAX_STREAK_SLOTS (3) streaks + 9 fresh repos
    const day2 = selectRotatedCandidates(merged, history, "2026-11-29");
    expect(day2.selected).toHaveLength(TARGET_REPO_COUNT);
    expect(day2.counts.streak).toBe(MAX_STREAK_SLOTS);
    expect(day2.counts.fresh).toBe(TARGET_REPO_COUNT - MAX_STREAK_SLOTS);
    expect(day2.counts.cooldownFallback).toBe(0);
    history = updateSeenHistory(
      history,
      day2.selected.map((c) => {
        const [owner, name] = c.fullName.split("/");
        return { owner, name };
      }),
      "2026-11-29"
    );

    // Day 3: The 3 Day-1+2 streak repos now have appearances=2 (cooldown),
    // and the 9 dropped Day-1 repos are also in cooldown (no ping-pong!).
    // Up to 3 of Day-2's fresh repos can become Day-3 streaks, plus 9 brand-new repos.
    const day3 = selectRotatedCandidates(merged, history, "2026-11-30");
    expect(day3.selected).toHaveLength(TARGET_REPO_COUNT);
    expect(day3.counts.streak).toBe(MAX_STREAK_SLOTS);
    expect(day3.counts.fresh).toBe(TARGET_REPO_COUNT - MAX_STREAK_SLOTS);
    expect(day3.counts.cooldownFallback).toBe(0);

    // None of the frozen/repo-* from Day 1 should ping-pong back on Day 3
    const day3Names = day3.selected.map((c) => c.fullName);
    expect(day3Names.some((n) => n.startsWith("frozen/"))).toBe(false);
  });

  it("gracefully backfills from cooldown repos when total eligible candidates < TARGET_REPO_COUNT", () => {
    const history: RepoHistoryMap = {};
    const candidates: RawTrendingCandidate[] = [];
    for (let i = 1; i <= 12; i++) {
      const fullName = `stuck/repo-${i}`;
      candidates.push({ fullName, starsToday: i * 100, tier: "daily" });
      history[fullName] = {
        first_seen_date: "2026-11-20",
        last_seen_date: "2026-11-26",
        appearances: 7,
      };
    }
    // Only 2 fresh repos exist
    candidates.push(
      { fullName: "new/alpha", starsToday: 400, tier: "language" },
      { fullName: "new/beta", starsToday: 300, tier: "language" }
    );

    const res = selectRotatedCandidates(candidates, history, "2026-11-27");
    expect(res.selected).toHaveLength(TARGET_REPO_COUNT);
    expect(res.counts.fresh).toBe(2);
    expect(res.counts.cooldownFallback).toBe(10);
    // Fresh repos come first, followed by highest starsToday cooldown repos
    expect(res.selected[0].fullName).toBe("new/alpha");
    expect(res.selected[1].fullName).toBe("new/beta");
    expect(res.selected[2].fullName).toBe("stuck/repo-12");
  });

  it("keeps updateSeenHistory idempotent on same-day reruns and prunes entries past COOLDOWN_DAYS", () => {
    const initial: RepoHistoryMap = {
      "old/expired": {
        first_seen_date: "2026-11-01",
        last_seen_date: "2026-11-02",
        appearances: 2,
      },
    };

    const run1 = updateSeenHistory(
      initial,
      [{ owner: "org", name: "alpha" }],
      "2026-11-27"
    );
    expect(run1["old/expired"]).toBeUndefined();
    expect(run1["org/alpha"]).toEqual({
      first_seen_date: "2026-11-27",
      last_seen_date: "2026-11-27",
      appearances: 1,
    });

    // Same-day rerun should NOT increment appearances
    const run2 = updateSeenHistory(
      run1,
      [{ owner: "org", name: "alpha" }],
      "2026-11-27"
    );
    expect(run2["org/alpha"].appearances).toBe(1);

    // Next-day run increments appearances to 2
    const run3 = updateSeenHistory(
      run2,
      [{ owner: "org", name: "alpha" }],
      "2026-11-28"
    );
    expect(run3["org/alpha"].appearances).toBe(MAX_CONSECUTIVE_DAYS);

    // After COOLDOWN_DAYS + 1, re-appearing resets appearances to 1
    const afterCooldown = updateSeenHistory(
      run3,
      [{ owner: "org", name: "alpha" }],
      "2026-12-15"
    );
    expect(afterCooldown["org/alpha"]).toEqual({
      first_seen_date: "2026-12-15",
      last_seen_date: "2026-12-15",
      appearances: 1,
    });
    expect(COOLDOWN_DAYS).toBe(14);
  });

  it("bootstraps seen_history from legacy repos using newer prevToday updated_at and cools down long-stuck repos", () => {
    const prevYesterday = [
      makeRepo("stuck", "alpha", "2026-11-18T04:00:00.000Z", "2026-11-26T04:00:00.000Z"),
      makeRepo("stuck", "beta", "2026-11-20T04:00:00.000Z", "2026-11-26T04:00:00.000Z"),
    ];
    const prevToday = [
      makeRepo("stuck", "alpha", "2026-11-18T04:00:00.000Z", "2026-11-27T04:00:00.000Z"),
      makeRepo("stuck", "beta", "2026-11-20T04:00:00.000Z", "2026-11-27T04:00:00.000Z"),
      makeRepo("fresh", "one-day", "2026-11-27T04:00:00.000Z", "2026-11-27T04:00:00.000Z"),
    ];

    const history = bootstrapSeenHistory(undefined, prevToday, prevYesterday, "2026-11-28");

    // Must take prevToday's newer updated_at (2026-11-27), NOT prevYesterday's (2026-11-26)
    expect(history["stuck/alpha"].last_seen_date).toBe("2026-11-27");
    expect(history["stuck/beta"].last_seen_date).toBe("2026-11-27");
    expect(classifyCandidate("stuck/alpha", history, "2026-11-28")).toBe("cooldown");
    expect(classifyCandidate("stuck/beta", history, "2026-11-28")).toBe("cooldown");

    // Brand-new Day-1 repo bootstrapped from prevToday is allowed a Day-2 streak
    expect(classifyCandidate("fresh/one-day", history, "2026-11-28")).toBe("streak");
  });

  it("preserves daily starsToday over higher weekly average, clamps targetCount < maxStreakSlots, and strips href query/footer", () => {
    // 1. Weekly average (400) must NOT overwrite real daily starsToday (50)
    const merged = mergeCandidatePools([
      [{ fullName: "org/cooled", starsToday: 50, tier: "daily" }],
      [{ fullName: "org/cooled", starsToday: 400, tier: "weekly" }],
    ]);
    expect(merged[0]).toEqual({ fullName: "org/cooled", starsToday: 50, tier: "daily" });

    // 2. targetCount < maxStreakSlots must never exceed targetCount
    const streakHistory: RepoHistoryMap = {
      "s/one": { first_seen_date: "2026-11-26", last_seen_date: "2026-11-26", appearances: 1 },
      "s/two": { first_seen_date: "2026-11-26", last_seen_date: "2026-11-26", appearances: 1 },
      "s/three": { first_seen_date: "2026-11-26", last_seen_date: "2026-11-26", appearances: 1 },
    };
    const capped = selectRotatedCandidates(
      [
        { fullName: "s/one", starsToday: 100 },
        { fullName: "s/two", starsToday: 90 },
        { fullName: "s/three", starsToday: 80 },
      ],
      streakHistory,
      "2026-11-27",
      { targetCount: 2, maxStreakSlots: 3 }
    );
    expect(capped.selected).toHaveLength(2);

    // 3. parseTrendingHtml trims </article> boundary and ignores query/hash in href
    const noisyHtml = `
      <article class="Box-row">
        <h2><a href="/org/clean-repo?tab=readme#top">org / clean-repo</a></h2>
      </article>
      <footer>9,999 stars today</footer>
    `;
    const parsed = parseTrendingHtml(noisyHtml, "daily");
    expect(parsed).toEqual([{ fullName: "org/clean-repo", starsToday: 0, tier: "daily" }]);
  });
});
