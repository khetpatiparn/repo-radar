import type { RepoHistoryEntry, RepositoryData } from "../../src/types";

export const TARGET_REPO_COUNT = 12;
export const MAX_CONSECUTIVE_DAYS = 2;
export const MAX_STREAK_SLOTS = 3;
export const COOLDOWN_DAYS = 14;

export type TrendingSourceTier = "daily" | "language" | "weekly" | "search";

export interface RawTrendingCandidate {
  fullName: string;
  starsToday: number;
  tier: TrendingSourceTier;
}

export type RepoHistoryMap = Record<string, RepoHistoryEntry>;

/**
 * Normalize repo identifier to lowercase "owner/name" for consistent history lookup.
 */
export function normalizeRepoKey(ownerOrFullName: string, name?: string): string {
  if (name !== undefined) {
    return `${ownerOrFullName}/${name}`.toLowerCase();
  }
  return ownerOrFullName.trim().toLowerCase();
}

/**
 * Convert an ISO timestamp or Date to YYYY-MM-DD in Asia/Bangkok timezone.
 */
export function toBangkokDate(isoOrDate: string | Date | undefined): string | null {
  if (!isoOrDate) return null;
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Compute whole-day difference (dateB - dateA) for YYYY-MM-DD strings.
 */
export function diffCalendarDays(dateA: string, dateB: string): number {
  const msA = Date.parse(`${dateA}T00:00:00Z`);
  const msB = Date.parse(`${dateB}T00:00:00Z`);
  if (Number.isNaN(msA) || Number.isNaN(msB)) return 0;
  return Math.round((msB - msA) / 86_400_000);
}

/**
 * Filter out non-code list/tutorial repositories.
 */
export function isInterestingCodeRepo(name: string, topics: string[] = []): boolean {
  const lower = name.toLowerCase();
  const excludedKeywords = [
    "awesome",
    "list",
    "interview",
    "book",
    "roadmap",
    "tutorial",
    "course",
  ];
  if (excludedKeywords.some((kw) => lower.includes(kw))) {
    return false;
  }
  if (topics.some((t) => t === "awesome-list" || t === "interview-questions")) {
    return false;
  }
  return true;
}

/**
 * Parse raw HTML from github.com/trending (daily, language-specific, or weekly)
 * into structured RawTrendingCandidate entries without making REST API calls yet.
 */
export function parseTrendingHtml(
  html: string,
  tier: TrendingSourceTier
): RawTrendingCandidate[] {
  const articles = html.split('<article class="Box-row">').slice(1);
  const candidates: RawTrendingCandidate[] = [];
  const seen = new Set<string>();

  for (const rawArticle of articles) {
    const article = rawArticle.split("</article>")[0] || rawArticle;
    const repoMatch = article.match(
      /<h2[\s\S]*?<a[^>]*href="\/([^/"\s?#]+\/[^/"\s?#]+)(?:[?#][^"]*)?"/
    );
    const fullName = repoMatch?.[1];
    if (!fullName) continue;

    const key = normalizeRepoKey(fullName);
    if (seen.has(key)) continue;

    const repoName = fullName.split("/")[1] || "";
    if (!isInterestingCodeRepo(repoName)) continue;

    const todayMatch = article.match(/([\d,]+)\s+stars\s+today/i);
    const weekMatch = article.match(/([\d,]+)\s+stars\s+this\s+week/i);

    let starsToday = 0;
    if (todayMatch) {
      starsToday = parseInt(todayMatch[1].replace(/,/g, ""), 10);
    } else if (weekMatch) {
      starsToday = Math.max(
        1,
        Math.round(parseInt(weekMatch[1].replace(/,/g, ""), 10) / 7)
      );
    }

    seen.add(key);
    candidates.push({ fullName, starsToday, tier });
  }

  return candidates;
}

/**
 * Seed seen_history from existing today/yesterday arrays when migrating from
 * a repos.json that predates seen_history tracking.
 */
export function bootstrapSeenHistory(
  existingHistory: RepoHistoryMap | undefined,
  prevToday: RepositoryData[],
  prevYesterday: RepositoryData[],
  todayIct: string
): RepoHistoryMap {
  const history: RepoHistoryMap = {};

  if (existingHistory && typeof existingHistory === "object") {
    for (const [key, entry] of Object.entries(existingHistory)) {
      if (
        entry &&
        typeof entry.first_seen_date === "string" &&
        typeof entry.last_seen_date === "string" &&
        typeof entry.appearances === "number"
      ) {
        history[normalizeRepoKey(key)] = { ...entry };
      }
    }
  }

  const todayKeys = new Set(
    prevToday.map((r) => normalizeRepoKey(r.owner, r.name))
  );
  const yesterdayKeys = new Set(
    prevYesterday.map((r) => normalizeRepoKey(r.owner, r.name))
  );

  // Iterate prevToday first so newer updated_at takes precedence over prevYesterday
  for (const repo of [...prevToday, ...prevYesterday]) {
    const key = normalizeRepoKey(repo.owner, repo.name);
    if (history[key]) continue;

    const firstSeen =
      toBangkokDate(repo.first_seen_at) ||
      toBangkokDate(repo.updated_at) ||
      todayIct;
    const lastSeen = toBangkokDate(repo.updated_at) || todayIct;
    const spanDays = Math.max(0, diffCalendarDays(firstSeen, lastSeen)) + 1;
    const inBoth = yesterdayKeys.has(key) && todayKeys.has(key);

    history[key] = {
      first_seen_date: firstSeen,
      last_seen_date: lastSeen,
      appearances: inBoth ? Math.max(2, spanDays) : Math.max(1, spanDays),
    };
  }

  return pruneSeenHistory(history, todayIct, COOLDOWN_DAYS);
}

/**
 * Remove history entries older than cooldownDays so repos can re-enter after resting.
 */
export function pruneSeenHistory(
  history: RepoHistoryMap,
  todayIct: string,
  cooldownDays = COOLDOWN_DAYS
): RepoHistoryMap {
  const pruned: RepoHistoryMap = {};
  for (const [key, entry] of Object.entries(history)) {
    const age = diffCalendarDays(entry.last_seen_date, todayIct);
    if (age <= cooldownDays) {
      pruned[key] = entry;
    }
  }
  return pruned;
}

export type CandidateEligibility = "fresh" | "streak" | "cooldown";

/**
 * Classify a repo candidate relative to seen_history and today's ICT date:
 * - "fresh": not in recent history (or cooldown expired)
 * - "streak": appeared recently and still under MAX_CONSECUTIVE_DAYS (allows 2-day streak UX)
 * - "cooldown": already reached MAX_CONSECUTIVE_DAYS within the cooldown window
 */
export function classifyCandidate(
  repoKey: string,
  history: RepoHistoryMap,
  todayIct: string,
  options?: {
    maxConsecutiveDays?: number;
    cooldownDays?: number;
  }
): CandidateEligibility {
  const maxConsecutiveDays = options?.maxConsecutiveDays ?? MAX_CONSECUTIVE_DAYS;
  const cooldownDays = options?.cooldownDays ?? COOLDOWN_DAYS;

  const entry = history[normalizeRepoKey(repoKey)];
  if (!entry) return "fresh";

  const daysSinceLastSeen = diffCalendarDays(entry.last_seen_date, todayIct);
  if (daysSinceLastSeen > cooldownDays) {
    return "fresh";
  }

  // Same-day re-run: if it appeared today for <= maxConsecutiveDays total, keep eligible
  if (daysSinceLastSeen <= 0) {
    if (entry.appearances > maxConsecutiveDays) {
      return "cooldown";
    }
    return entry.appearances === 1 ? "fresh" : "streak";
  }

  // Appeared yesterday and still has streak budget left (e.g. Day 1 -> Day 2)
  if (daysSinceLastSeen === 1 && entry.appearances < maxConsecutiveDays) {
    return "streak";
  }

  // Either hit maxConsecutiveDays or already dropped off and is resting in cooldown
  return "cooldown";
}

export interface SelectionResult<T> {
  selected: T[];
  counts: {
    fresh: number;
    streak: number;
    cooldownFallback: number;
  };
}

const TIER_PRIORITY: Record<TrendingSourceTier, number> = {
  daily: 0,
  language: 1,
  weekly: 2,
  search: 3,
};

/**
 * Deduplicate and order candidates across tiers:
 * - Tier 1 (daily) keeps GitHub's native ranking order
 * - Tier 2+ (language / weekly / search) are sorted by starsToday descending within each tier
 */
export function mergeCandidatePools(
  pools: RawTrendingCandidate[][]
): RawTrendingCandidate[] {
  const byKey = new Map<string, RawTrendingCandidate>();

  for (const pool of pools) {
    for (const candidate of pool) {
      const key = normalizeRepoKey(candidate.fullName);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, candidate);
      } else {
        const isDailyPrecision = (t: TrendingSourceTier) =>
          t === "daily" || t === "language";
        const candidateHasHigherPriority =
          TIER_PRIORITY[candidate.tier] < TIER_PRIORITY[existing.tier];
        const betterTier = candidateHasHigherPriority
          ? candidate.tier
          : existing.tier;

        let bestStars: number;
        if (isDailyPrecision(existing.tier) && isDailyPrecision(candidate.tier)) {
          bestStars = Math.max(existing.starsToday, candidate.starsToday);
        } else if (isDailyPrecision(existing.tier)) {
          bestStars = existing.starsToday > 0 ? existing.starsToday : candidate.starsToday;
        } else if (isDailyPrecision(candidate.tier)) {
          bestStars = candidate.starsToday > 0 ? candidate.starsToday : existing.starsToday;
        } else {
          bestStars = candidateHasHigherPriority
            ? candidate.starsToday || existing.starsToday
            : existing.starsToday || candidate.starsToday;
        }

        byKey.set(key, {
          fullName: existing.fullName,
          starsToday: bestStars,
          tier: betterTier,
        });
      }
    }
  }

  const all = Array.from(byKey.values());
  const daily = all.filter((c) => c.tier === "daily");
  const language = all
    .filter((c) => c.tier === "language")
    .sort((a, b) => b.starsToday - a.starsToday);
  const weekly = all
    .filter((c) => c.tier === "weekly")
    .sort((a, b) => b.starsToday - a.starsToday);
  const search = all
    .filter((c) => c.tier === "search")
    .sort((a, b) => b.starsToday - a.starsToday);

  return [...daily, ...language, ...weekly, ...search];
}

/**
 * Select up to `targetCount` candidates with rotation & cooldown guarantees:
 * 1. Fresh repos always get priority slots (at least targetCount - maxStreakSlots).
 * 2. Up to `maxStreakSlots` eligible 2-day streak repos are allowed (preserves Streak UI).
 * 3. Cooldown repos are skipped unless the entire pool has fewer than `targetCount` eligible repos.
 */
export function selectRotatedCandidates<T extends { fullName: string; starsToday?: number }>(
  candidates: T[],
  history: RepoHistoryMap,
  todayIct: string,
  options?: {
    targetCount?: number;
    maxStreakSlots?: number;
    maxConsecutiveDays?: number;
    cooldownDays?: number;
  }
): SelectionResult<T> {
  const targetCount = Math.max(0, options?.targetCount ?? TARGET_REPO_COUNT);
  const maxStreakSlots = Math.min(
    targetCount,
    Math.max(0, options?.maxStreakSlots ?? MAX_STREAK_SLOTS)
  );

  const freshBucket: T[] = [];
  const streakBucket: T[] = [];
  const cooldownBucket: T[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const key = normalizeRepoKey(candidate.fullName);
    if (seen.has(key)) continue;
    seen.add(key);

    const status = classifyCandidate(key, history, todayIct, options);
    if (status === "fresh") {
      freshBucket.push(candidate);
    } else if (status === "streak") {
      streakBucket.push(candidate);
    } else {
      cooldownBucket.push(candidate);
    }
  }

  // Reserve up to maxStreakSlots for streak repos, rest for fresh repos
  const chosenStreak = streakBucket.slice(0, maxStreakSlots);
  const freshQuota = Math.max(0, targetCount - chosenStreak.length);
  const chosenFresh = freshBucket.slice(0, freshQuota);

  const selected: T[] = [];
  let streakCount = 0;
  let freshCount = 0;
  let cooldownFallbackCount = 0;

  // Preserve original relative order among chosen fresh + streak candidates
  const chosenKeys = new Set([
    ...chosenStreak.map((c) => normalizeRepoKey(c.fullName)),
    ...chosenFresh.map((c) => normalizeRepoKey(c.fullName)),
  ]);
  const streakKeySet = new Set(chosenStreak.map((c) => normalizeRepoKey(c.fullName)));

  for (const candidate of candidates) {
    const key = normalizeRepoKey(candidate.fullName);
    if (!chosenKeys.has(key)) continue;
    chosenKeys.delete(key);
    selected.push(candidate);
    if (streakKeySet.has(key)) {
      streakCount++;
    } else {
      freshCount++;
    }
  }

  // If still short (e.g., fewer than maxStreakSlots streaks, or not enough fresh), fill from leftover fresh -> leftover streak -> cooldown
  const fillFrom = (pool: T[], kind: "fresh" | "streak" | "cooldown") => {
    const existingKeys = new Set(selected.map((c) => normalizeRepoKey(c.fullName)));
    for (const item of pool) {
      if (selected.length >= targetCount) break;
      const key = normalizeRepoKey(item.fullName);
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);
      selected.push(item);
      if (kind === "fresh") freshCount++;
      else if (kind === "streak") streakCount++;
      else cooldownFallbackCount++;
    }
  };

  if (selected.length < targetCount) {
    fillFrom(freshBucket.slice(freshQuota), "fresh");
  }
  if (selected.length < targetCount) {
    fillFrom(streakBucket.slice(maxStreakSlots), "streak");
  }
  if (selected.length < targetCount) {
    const sortedCooldown = [...cooldownBucket].sort(
      (a, b) => (b.starsToday ?? 0) - (a.starsToday ?? 0)
    );
    fillFrom(sortedCooldown, "cooldown");
  }

  return {
    selected,
    counts: {
      fresh: freshCount,
      streak: streakCount,
      cooldownFallback: cooldownFallbackCount,
    },
  };
}

/**
 * Update seen_history after writing today's selected repos (idempotent on same-day re-runs)
 * and prune entries older than COOLDOWN_DAYS.
 */
export function updateSeenHistory(
  prevHistory: RepoHistoryMap,
  selectedRepos: Array<{ owner: string; name: string }>,
  todayIct: string,
  cooldownDays = COOLDOWN_DAYS
): RepoHistoryMap {
  const next: RepoHistoryMap = {};
  for (const [key, entry] of Object.entries(prevHistory)) {
    next[key] = { ...entry };
  }

  for (const repo of selectedRepos) {
    const key = normalizeRepoKey(repo.owner, repo.name);
    const existing = next[key];

    if (!existing) {
      next[key] = {
        first_seen_date: todayIct,
        last_seen_date: todayIct,
        appearances: 1,
      };
    } else if (existing.last_seen_date === todayIct) {
      // Idempotent on same-day re-runs: do not double-count appearances
      next[key] = { ...existing };
    } else {
      const gap = diffCalendarDays(existing.last_seen_date, todayIct);
      if (gap > cooldownDays) {
        // Cooldown expired — start a fresh appearance window
        next[key] = {
          first_seen_date: todayIct,
          last_seen_date: todayIct,
          appearances: 1,
        };
      } else {
        next[key] = {
          first_seen_date: existing.first_seen_date,
          last_seen_date: todayIct,
          appearances: existing.appearances + 1,
        };
      }
    }
  }

  return pruneSeenHistory(next, todayIct, cooldownDays);
}
