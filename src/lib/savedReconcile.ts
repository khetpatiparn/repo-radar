import type {
  PaperData,
  RepositoryData,
  NewsArticleData,
} from "../types";

export interface ReconcileResult<T> {
  map: Record<string, T>;
  changed: boolean;
  upgradedCount: number;
}

function parseTimestampMs(iso: string | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

function shouldUpgradeItem<
  T extends { reading_guide?: unknown; updated_at?: string }
>(saved: T, fresh: T): boolean {
  const savedHasGuide = Boolean(saved.reading_guide);
  const freshHasGuide = Boolean(fresh.reading_guide);

  // Always upgrade a pre-3-Pass snapshot when the live feed now has a real 3-Pass guide
  if (!savedHasGuide && freshHasGuide) {
    return true;
  }

  // Never downgrade a saved 3-Pass item back to a non-3-Pass item
  if (savedHasGuide && !freshHasGuide) {
    return false;
  }

  // When both have (or both lack) reading_guide, take the strictly newer updated_at
  return parseTimestampMs(fresh.updated_at) > parseTimestampMs(saved.updated_at);
}

/**
 * Reconcile saved Paper snapshots from localStorage against the latest feed data.
 * Automatically upgrades stale pre-3-Pass bookmarks when newer 3-Pass data exists.
 */
export function reconcileSavedPapers(
  savedMap: Record<string, PaperData>,
  latestPapers: PaperData[]
): ReconcileResult<PaperData> {
  const byId = new Map<string, PaperData>();
  const byArxivUrl = new Map<string, PaperData>();

  for (const p of latestPapers) {
    byId.set(p.id, p);
    if (p.arxiv_url) byArxivUrl.set(p.arxiv_url, p);
  }

  const next: Record<string, PaperData> = {};
  let changed = false;
  let upgradedCount = 0;

  for (const [key, saved] of Object.entries(savedMap)) {
    if (!saved || typeof saved !== "object") continue;
    const fresh = byId.get(saved.id) || (saved.arxiv_url ? byArxivUrl.get(saved.arxiv_url) : undefined);

    if (fresh && shouldUpgradeItem(saved, fresh)) {
      next[fresh.id] = fresh;
      changed = true;
      upgradedCount++;
    } else {
      next[key] = saved;
    }
  }

  return { map: next, changed, upgradedCount };
}

/**
 * Reconcile saved GitHub Repository snapshots from localStorage against the latest feed data.
 */
export function reconcileSavedRepos(
  savedMap: Record<string, RepositoryData>,
  latestRepos: RepositoryData[]
): ReconcileResult<RepositoryData> {
  const byId = new Map<string, RepositoryData>();
  const byFullName = new Map<string, RepositoryData>();
  const byUrl = new Map<string, RepositoryData>();

  for (const r of latestRepos) {
    byId.set(r.id, r);
    byFullName.set(`${r.owner}/${r.name}`.toLowerCase(), r);
    if (r.url) byUrl.set(r.url.toLowerCase(), r);
  }

  const next: Record<string, RepositoryData> = {};
  let changed = false;
  let upgradedCount = 0;

  for (const [key, saved] of Object.entries(savedMap)) {
    if (!saved || typeof saved !== "object") continue;
    const fresh =
      byId.get(saved.id) ||
      byFullName.get(`${saved.owner}/${saved.name}`.toLowerCase()) ||
      (saved.url ? byUrl.get(saved.url.toLowerCase()) : undefined);

    if (fresh && shouldUpgradeItem(saved, fresh)) {
      next[fresh.id] = fresh;
      changed = true;
      upgradedCount++;
    } else {
      next[key] = saved;
    }
  }

  return { map: next, changed, upgradedCount };
}

/**
 * Reconcile saved Google AI Lab News snapshots from localStorage against the latest feed data.
 */
export function reconcileSavedNews(
  savedMap: Record<string, NewsArticleData>,
  latestNews: NewsArticleData[]
): ReconcileResult<NewsArticleData> {
  const byId = new Map<string, NewsArticleData>();
  const byUrl = new Map<string, NewsArticleData>();

  for (const a of latestNews) {
    byId.set(a.id, a);
    if (a.url) byUrl.set(a.url.toLowerCase(), a);
  }

  const next: Record<string, NewsArticleData> = {};
  let changed = false;
  let upgradedCount = 0;

  for (const [key, saved] of Object.entries(savedMap)) {
    if (!saved || typeof saved !== "object") continue;
    const fresh =
      byId.get(saved.id) ||
      (saved.url ? byUrl.get(saved.url.toLowerCase()) : undefined);

    if (fresh && shouldUpgradeItem(saved, fresh)) {
      next[fresh.id] = fresh;
      changed = true;
      upgradedCount++;
    } else {
      next[key] = saved;
    }
  }

  return { map: next, changed, upgradedCount };
}
