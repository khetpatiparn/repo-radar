"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import reposData from "../data/repos.json";
import papersData from "../data/papers.json";
import newsData from "../data/news.json";
import syncStatusRaw from "../data/sync-status.json";
import {
  PAPER_CATEGORIES,
  NEWS_CATEGORIES,
  type RepositoryData,
  type ReposFeedData,
  type PaperData,
  type PapersFeedData,
  type NewsArticleData,
  type NewsFeedData,
  type SyncStatusData,
} from "../types";
import {
  READ_IDS_STORAGE_KEY,
  getFreshnessInfo,
} from "../lib/freshness";
import { Header, type MainSection } from "../components/Header";
import { ArticleReader } from "../components/ArticleReader";
import { PapersSection } from "../components/PapersSection";
import { ReposSection } from "../components/ReposSection";
import { NewsSection } from "../components/NewsSection";
import { SavedSection } from "../components/SavedSection";
import { ChevronUp } from "lucide-react";

// Parse Repos Feed
const rawReposFeed = reposData as unknown as ReposFeedData | RepositoryData[];
const todayRepos: RepositoryData[] = Array.isArray(rawReposFeed)
  ? rawReposFeed
  : rawReposFeed.today || [];
const yesterdayRepos: RepositoryData[] = Array.isArray(rawReposFeed)
  ? []
  : rawReposFeed.yesterday || [];

// Parse Papers Feed
const rawPapersFeed = papersData as unknown as PapersFeedData;
const paperDays = Array.isArray(rawPapersFeed?.days) ? rawPapersFeed.days : [];

// Parse AI Lab News Feed
const rawNewsFeed = newsData as unknown as NewsFeedData;
const allNewsArticles: NewsArticleData[] = Array.isArray(rawNewsFeed?.articles)
  ? rawNewsFeed.articles
  : [];

// Parse Live Sync Status
const syncStatus = syncStatusRaw as unknown as SyncStatusData;

const SAVED_PAPERS_KEY = "reporadar_saved_papers_v1";
const SAVED_REPOS_KEY = "reporadar_saved_repos_v1";
const SAVED_NEWS_KEY = "reporadar_saved_news_v1";
const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [activeSection, setActiveSection] = useState<MainSection>("papers");
  const [searchQuery, setSearchQuery] = useState("");

  // Anti-Scroll Fatigue Features
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Paper Filters
  const [paperEdition, setPaperEdition] = useState<"today" | "yesterday" | "all7">("today");
  const [selectedPaperCategory, setSelectedPaperCategory] = useState<string>("All");
  const [onlyWithCode, setOnlyWithCode] = useState<boolean>(false);
  const [onlyNewPapers, setOnlyNewPapers] = useState<boolean>(false);

  // Repo Filters
  const [repoDay, setRepoDay] = useState<"today" | "yesterday">("today");
  const [onlyRepoStreak, setOnlyRepoStreak] = useState<boolean>(false);
  const [onlyNewRepos, setOnlyNewRepos] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedMaturity, setSelectedMaturity] = useState<string>("All");

  // AI Lab News Filters
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("All");
  const [onlyNewNews, setOnlyNewNews] = useState<boolean>(false);

  // Reader View State (Full-page book/article reader)
  const [readingPaper, setReadingPaper] = useState<PaperData | null>(null);
  const [readingRepo, setReadingRepo] = useState<RepositoryData | null>(null);
  const [readingNews, setReadingNews] = useState<NewsArticleData | null>(null);

  // Saved Bookmarks & Read State (Persisted in localStorage)
  const [savedPapersMap, setSavedPapersMap] = useState<Record<string, PaperData>>({});
  const [savedReposMap, setSavedReposMap] = useState<Record<string, RepositoryData>>({});
  const [savedNewsMap, setSavedNewsMap] = useState<Record<string, NewsArticleData>>({});
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const feedScrollYRef = useRef<number>(0);
  const pushedHistoryRef = useRef<boolean>(false);

  const isReaderMode = Boolean(readingPaper || readingRepo || readingNews);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hydrateFromStorage = () => {
      try {
        const sp = localStorage.getItem(SAVED_PAPERS_KEY);
        if (sp) setSavedPapersMap(JSON.parse(sp));
        const sr = localStorage.getItem(SAVED_REPOS_KEY);
        if (sr) setSavedReposMap(JSON.parse(sr));
        const sn = localStorage.getItem(SAVED_NEWS_KEY);
        if (sn) setSavedNewsMap(JSON.parse(sn));
        const storedRead = localStorage.getItem(READ_IDS_STORAGE_KEY);
        if (storedRead) {
          const arr = JSON.parse(storedRead);
          if (Array.isArray(arr)) setReadIds(new Set(arr));
        }
      } catch (e) {
        console.warn("Could not load saved state from localStorage:", e);
      }
    };

    const timerId = window.setTimeout(hydrateFromStorage, 0);
    window.addEventListener("storage", hydrateFromStorage);

    let lastShown = false;
    const handleScroll = () => {
      const next = window.scrollY > 350;
      if (next !== lastShown) {
        lastShown = next;
        setShowBackToTop(next);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("storage", hydrateFromStorage);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const persistReadIds = useCallback((next: Set<string>) => {
    if (typeof window === "undefined") return;
    try {
      // Keep the most recent 500 read entries to avoid unbounded storage
      const trimmed = Array.from(next).slice(-500);
      localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore storage quota issues
    }
  }, []);

  const markItemRead = useCallback(
    (kind: "papers" | "repos" | "news", id: string) => {
      const key = `${kind}:${id}`;
      setReadIds((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        persistReadIds(next);
        return next;
      });
    },
    [persistReadIds]
  );

  const markManyRead = useCallback(
    (kind: "papers" | "repos" | "news", ids: string[]) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          next.add(`${kind}:${id}`);
        }
        persistReadIds(next);
        return next;
      });
    },
    [persistReadIds]
  );

  const closeReaderAndRestoreScroll = useCallback(() => {
    setReadingPaper(null);
    setReadingRepo(null);
    setReadingNews(null);
    pushedHistoryRef.current = false;
    if (typeof window !== "undefined") {
      const savedY = feedScrollYRef.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "auto" });
      });
    }
  }, []);

  // Support browser / mobile hardware Back button seamlessly
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      if (readingPaper || readingRepo || readingNews) {
        closeReaderAndRestoreScroll();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [readingPaper, readingRepo, readingNews, closeReaderAndRestoreScroll]);

  const toggleSavePaper = (paper: PaperData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedPapersMap((prev) => {
      const next = { ...prev };
      if (next[paper.id]) {
        delete next[paper.id];
      } else {
        next[paper.id] = paper;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_PAPERS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleSaveRepo = (repo: RepositoryData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedReposMap((prev) => {
      const next = { ...prev };
      if (next[repo.id]) {
        delete next[repo.id];
      } else {
        next[repo.id] = repo;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_REPOS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const toggleSaveNews = (article: NewsArticleData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedNewsMap((prev) => {
      const next = { ...prev };
      if (next[article.id]) {
        delete next[article.id];
      } else {
        next[article.id] = article;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const prepareOpenReader = () => {
    if (typeof window !== "undefined") {
      feedScrollYRef.current = window.scrollY;
      try {
        if (!pushedHistoryRef.current) {
          window.history.pushState({ reader: true }, "");
          pushedHistoryRef.current = true;
        }
      } catch {
        // ignore history API errors in sandboxed iframes/jsdom
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openPaperReader = (paper: PaperData) => {
    prepareOpenReader();
    markItemRead("papers", paper.id);
    setReadingRepo(null);
    setReadingNews(null);
    setReadingPaper(paper);
  };

  const openRepoReader = (repo: RepositoryData) => {
    prepareOpenReader();
    markItemRead("repos", repo.id);
    setReadingPaper(null);
    setReadingNews(null);
    setReadingRepo(repo);
  };

  const openNewsReader = (article: NewsArticleData) => {
    prepareOpenReader();
    markItemRead("news", article.id);
    setReadingPaper(null);
    setReadingRepo(null);
    setReadingNews(article);
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPaperFreshness = useCallback(
    (paper: PaperData) =>
      getFreshnessInfo(paper, "papers", syncStatus, readIds),
    [readIds]
  );

  const getRepoFreshness = useCallback(
    (repo: RepositoryData) =>
      getFreshnessInfo(repo, "repos", syncStatus, readIds),
    [readIds]
  );

  const getNewsFreshness = useCallback(
    (article: NewsArticleData) =>
      getFreshnessInfo(article, "news", syncStatus, readIds),
    [readIds]
  );

  // Repo streak lookup maps
  const yesterdayRepoMap = useMemo(() => {
    const map = new Map<string, RepositoryData>();
    for (const r of yesterdayRepos) {
      map.set(r.id, r);
      map.set(`${r.owner}/${r.name}`.toLowerCase(), r);
    }
    return map;
  }, []);

  const repoStreakCount = useMemo(() => {
    return todayRepos.filter(
      (r) =>
        yesterdayRepoMap.has(r.id) ||
        yesterdayRepoMap.has(`${r.owner}/${r.name}`.toLowerCase())
    ).length;
  }, [yesterdayRepoMap]);

  // Paper datasets by edition
  const todayPaperBatch = paperDays[0]?.papers || [];
  const yesterdayPaperBatch = paperDays[1]?.papers || [];
  const all7DaysPapers = useMemo(() => {
    const seen = new Set<string>();
    const list: PaperData[] = [];
    for (const d of paperDays) {
      for (const p of d.papers) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          list.push(p);
        }
      }
    }
    return list.sort((a, b) => b.upvotes - a.upvotes);
  }, []);

  const activePapersPool =
    paperEdition === "today"
      ? todayPaperBatch
      : paperEdition === "yesterday"
      ? yesterdayPaperBatch
      : all7DaysPapers;

  // Unread NEW counters for Capsule Navbar + Section controls
  const unreadNewCounts = useMemo(() => {
    const unreadPapers = all7DaysPapers.filter(
      (p) => getFreshnessInfo(p, "papers", syncStatus, readIds).isUnreadNew
    ).length;
    const unreadRepos = todayRepos.filter(
      (r) => getFreshnessInfo(r, "repos", syncStatus, readIds).isUnreadNew
    ).length;
    const unreadNews = allNewsArticles.filter(
      (a) => getFreshnessInfo(a, "news", syncStatus, readIds).isUnreadNew
    ).length;
    return {
      papers: unreadPapers,
      repos: unreadRepos,
      news: unreadNews,
      total: unreadPapers + unreadRepos + unreadNews,
    };
  }, [all7DaysPapers, readIds]);

  const newPapersInPoolCount = useMemo(
    () =>
      activePapersPool.filter(
        (p) => getFreshnessInfo(p, "papers", syncStatus, readIds).isNew
      ).length,
    [activePapersPool, readIds]
  );

  const newReposInTodayCount = useMemo(
    () =>
      todayRepos.filter(
        (r) => getFreshnessInfo(r, "repos", syncStatus, readIds).isNew
      ).length,
    [readIds]
  );

  const newNewsInFeedCount = useMemo(
    () =>
      allNewsArticles.filter(
        (a) => getFreshnessInfo(a, "news", syncStatus, readIds).isNew
      ).length,
    [readIds]
  );

  const paperCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of PAPER_CATEGORIES) {
      counts[cat] = activePapersPool.filter((p) => p.category === cat).length;
    }
    return counts;
  }, [activePapersPool]);

  // Filtered Papers
  const filteredPapers = useMemo(() => {
    let result = [...activePapersPool];

    if (onlyNewPapers) {
      result = result.filter(
        (p) => getFreshnessInfo(p, "papers", syncStatus, readIds).isNew
      );
    }

    if (selectedPaperCategory !== "All") {
      result = result.filter((p) => p.category === selectedPaperCategory);
    }

    if (onlyWithCode) {
      result = result.filter((p) => Boolean(p.github_url));
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.hook_headline.toLowerCase().includes(q) ||
          p.short_teaser.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.organization && p.organization.toLowerCase().includes(q))
      );
    }

    return result;
  }, [
    activePapersPool,
    onlyNewPapers,
    selectedPaperCategory,
    onlyWithCode,
    searchQuery,
    readIds,
  ]);

  // Filtered Repos
  const activeReposPool = repoDay === "today" ? todayRepos : yesterdayRepos;
  const repoLanguages = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(activeReposPool.map((r) => r.language).filter(Boolean) as string[])
      ),
    ],
    [activeReposPool]
  );

  const filteredRepos = useMemo(() => {
    let result = [...activeReposPool];

    if (onlyNewRepos && repoDay === "today") {
      result = result.filter(
        (r) => getFreshnessInfo(r, "repos", syncStatus, readIds).isNew
      );
    }

    if (onlyRepoStreak && repoDay === "today") {
      result = result.filter(
        (r) =>
          yesterdayRepoMap.has(r.id) ||
          yesterdayRepoMap.has(`${r.owner}/${r.name}`.toLowerCase())
      );
    }

    if (selectedLang !== "All") {
      result = result.filter((r) => r.language === selectedLang);
    }

    if (selectedMaturity !== "All") {
      result = result.filter((r) => r.maturity_rating === selectedMaturity);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.one_liner.toLowerCase().includes(q) ||
          r.problem_solved.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => b.stars_today - a.stars_today);
  }, [
    activeReposPool,
    onlyNewRepos,
    onlyRepoStreak,
    repoDay,
    yesterdayRepoMap,
    selectedLang,
    selectedMaturity,
    searchQuery,
    readIds,
  ]);

  const newsCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of NEWS_CATEGORIES) {
      counts[cat] = allNewsArticles.filter((a) => a.category === cat).length;
    }
    return counts;
  }, []);

  // Filtered AI Lab News
  const filteredNews = useMemo(() => {
    let result = [...allNewsArticles];

    if (onlyNewNews) {
      result = result.filter(
        (a) => getFreshnessInfo(a, "news", syncStatus, readIds).isNew
      );
    }

    if (selectedNewsCategory !== "All") {
      result = result.filter((a) => a.category === selectedNewsCategory);
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.hook_headline.toLowerCase().includes(q) ||
          a.short_teaser.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.rss_categories.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [onlyNewNews, selectedNewsCategory, searchQuery, readIds]);

  // Pagination calculation for papers
  const totalPaperPages = Math.max(1, Math.ceil(filteredPapers.length / ITEMS_PER_PAGE));
  const safeCurrentPaperPage = Math.min(currentPage, totalPaperPages);
  const pagedPapers = useMemo(() => {
    const start = (safeCurrentPaperPage - 1) * ITEMS_PER_PAGE;
    return filteredPapers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPapers, safeCurrentPaperPage]);

  // Pagination calculation for AI Lab News
  const totalNewsPages = Math.max(1, Math.ceil(filteredNews.length / ITEMS_PER_PAGE));
  const safeCurrentNewsPage = Math.min(currentPage, totalNewsPages);
  const pagedNews = useMemo(() => {
    const start = (safeCurrentNewsPage - 1) * ITEMS_PER_PAGE;
    return filteredNews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNews, safeCurrentNewsPage]);

  const savedPapersList = Object.values(savedPapersMap);
  const savedReposList = Object.values(savedReposMap);
  const savedNewsList = Object.values(savedNewsMap);
  const totalSavedCount =
    savedPapersList.length + savedReposList.length + savedNewsList.length;

  const latestUpdate =
    syncStatus?.last_sync_at ||
    rawPapersFeed?.updated_at ||
    rawNewsFeed?.updated_at ||
    todayRepos[0]?.updated_at ||
    "2026-11-12T00:00:00Z";

  const handleSectionSelect = (sec: MainSection) => {
    setActiveSection(sec);
    setReadingPaper(null);
    setReadingRepo(null);
    setReadingNews(null);
    setCurrentPage(1);
  };

  const handleJumpToNewSection = (sec: "papers" | "repos" | "news") => {
    handleSectionSelect(sec);
    if (sec === "papers") {
      setPaperEdition("today");
      setOnlyNewPapers(true);
    } else if (sec === "repos") {
      setRepoDay("today");
      setOnlyNewRepos(true);
    } else if (sec === "news") {
      setOnlyNewNews(true);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-paper text-ink-2 w-full">
      <Header
        updatedAt={latestUpdate}
        totalItems={
          activeSection === "papers"
            ? filteredPapers.length
            : activeSection === "news"
            ? filteredNews.length
            : filteredRepos.length
        }
        papersCount={todayPaperBatch.length}
        reposCount={todayRepos.length}
        newsCount={allNewsArticles.length}
        unreadNewCounts={unreadNewCounts}
        syncStatus={syncStatus}
        activeSection={activeSection}
        onSelectSection={handleSectionSelect}
        onJumpToNewSection={handleJumpToNewSection}
        savedCount={totalSavedCount}
        searchQuery={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
          if (readingPaper || readingRepo || readingNews) {
            setReadingPaper(null);
            setReadingRepo(null);
            setReadingNews(null);
          }
        }}
        topHeadline={todayPaperBatch[0]?.hook_headline}
        isReaderMode={isReaderMode}
      />

      {/* Full-Page Article Reader Mode */}
      {readingPaper ? (
        <ArticleReader
          paper={readingPaper}
          freshness={getPaperFreshness(readingPaper)}
          isSaved={Boolean(savedPapersMap[readingPaper.id])}
          onToggleSave={() => toggleSavePaper(readingPaper)}
          onBack={closeReaderAndRestoreScroll}
        />
      ) : readingRepo ? (
        <ArticleReader
          repo={readingRepo}
          freshness={getRepoFreshness(readingRepo)}
          isSaved={Boolean(savedReposMap[readingRepo.id])}
          onToggleSave={() => toggleSaveRepo(readingRepo)}
          onBack={closeReaderAndRestoreScroll}
          isTwoDayStreak={
            yesterdayRepoMap.has(readingRepo.id) ||
            yesterdayRepoMap.has(
              `${readingRepo.owner}/${readingRepo.name}`.toLowerCase()
            )
          }
          starsAddedSinceYesterday={Math.max(
            0,
            readingRepo.stars -
              (yesterdayRepoMap.get(readingRepo.id)?.stars ||
                yesterdayRepoMap.get(
                  `${readingRepo.owner}/${readingRepo.name}`.toLowerCase()
                )?.stars ||
                readingRepo.stars)
          )}
        />
      ) : readingNews ? (
        <ArticleReader
          news={readingNews}
          freshness={getNewsFreshness(readingNews)}
          isSaved={Boolean(savedNewsMap[readingNews.id])}
          onToggleSave={() => toggleSaveNews(readingNews)}
          onBack={closeReaderAndRestoreScroll}
        />
      ) : (
        <main className="container py-6 sm:py-8 space-y-6">
          {activeSection === "papers" && (
            <PapersSection
              paperEdition={paperEdition}
              onChangeEdition={(edition) => {
                setPaperEdition(edition);
                setOnlyNewPapers(false);
                setCurrentPage(1);
              }}
              todayCount={todayPaperBatch.length}
              yesterdayCount={yesterdayPaperBatch.length}
              all7Count={all7DaysPapers.length}
              activePoolCount={activePapersPool.length}
              onlyWithCode={onlyWithCode}
              onToggleOnlyWithCode={() => {
                setOnlyWithCode((prev) => !prev);
                setCurrentPage(1);
              }}
              onlyNewToday={onlyNewPapers}
              onToggleOnlyNewToday={() => {
                setOnlyNewPapers((prev) => !prev);
                setCurrentPage(1);
              }}
              newPapersInPoolCount={newPapersInPoolCount}
              unreadNewPapersCount={unreadNewCounts.papers}
              onMarkAllPapersRead={() =>
                markManyRead(
                  "papers",
                  all7DaysPapers
                    .filter((p) => getPaperFreshness(p).isUnreadNew)
                    .map((p) => p.id)
                )
              }
              getPaperFreshness={getPaperFreshness}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              selectedCategory={selectedPaperCategory}
              onChangeCategory={(cat) => {
                setSelectedPaperCategory(cat);
                setCurrentPage(1);
              }}
              categoryCounts={paperCategoryCounts}
              filteredPapers={filteredPapers}
              pagedPapers={pagedPapers}
              currentPage={safeCurrentPaperPage}
              totalPages={totalPaperPages}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              savedPapersMap={savedPapersMap}
              onToggleSavePaper={toggleSavePaper}
              onOpenPaper={openPaperReader}
            />
          )}

          {activeSection === "repos" && (
            <ReposSection
              repoDay={repoDay}
              onChangeRepoDay={(day) => {
                setRepoDay(day);
                setOnlyNewRepos(false);
                setCurrentPage(1);
              }}
              todayCount={todayRepos.length}
              yesterdayCount={yesterdayRepos.length}
              repoStreakCount={repoStreakCount}
              onlyRepoStreak={onlyRepoStreak}
              onToggleOnlyRepoStreak={() => setOnlyRepoStreak((prev) => !prev)}
              onlyNewToday={onlyNewRepos}
              onToggleOnlyNewToday={() => setOnlyNewRepos((prev) => !prev)}
              newReposCount={newReposInTodayCount}
              unreadNewReposCount={unreadNewCounts.repos}
              onMarkAllReposRead={() =>
                markManyRead(
                  "repos",
                  todayRepos
                    .filter((r) => getRepoFreshness(r).isUnreadNew)
                    .map((r) => r.id)
                )
              }
              getRepoFreshness={getRepoFreshness}
              repoLanguages={repoLanguages}
              selectedLang={selectedLang}
              onChangeLang={(lang) => {
                setSelectedLang(lang);
                setCurrentPage(1);
              }}
              selectedMaturity={selectedMaturity}
              onChangeMaturity={(maturity) => {
                setSelectedMaturity(maturity);
                setCurrentPage(1);
              }}
              filteredRepos={filteredRepos}
              yesterdayRepoMap={yesterdayRepoMap}
              savedReposMap={savedReposMap}
              onToggleSaveRepo={toggleSaveRepo}
              onOpenRepo={openRepoReader}
            />
          )}

          {activeSection === "news" && (
            <NewsSection
              allNewsCount={allNewsArticles.length}
              selectedCategory={selectedNewsCategory}
              onChangeCategory={(cat) => {
                setSelectedNewsCategory(cat);
                setCurrentPage(1);
              }}
              categoryCounts={newsCategoryCounts}
              onlyNewToday={onlyNewNews}
              onToggleOnlyNewToday={() => {
                setOnlyNewNews((prev) => !prev);
                setCurrentPage(1);
              }}
              newNewsCount={newNewsInFeedCount}
              unreadNewNewsCount={unreadNewCounts.news}
              onMarkAllNewsRead={() =>
                markManyRead(
                  "news",
                  allNewsArticles
                    .filter((a) => getNewsFreshness(a).isUnreadNew)
                    .map((a) => a.id)
                )
              }
              getNewsFreshness={getNewsFreshness}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              filteredNews={filteredNews}
              pagedNews={pagedNews}
              currentPage={safeCurrentNewsPage}
              totalPages={totalNewsPages}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              savedNewsMap={savedNewsMap}
              onToggleSaveNews={toggleSaveNews}
              onOpenNews={openNewsReader}
            />
          )}

          {activeSection === "saved" && (
            <SavedSection
              savedPapers={savedPapersList}
              savedRepos={savedReposList}
              savedNews={savedNewsList}
              onRemovePaper={toggleSavePaper}
              onRemoveRepo={toggleSaveRepo}
              onRemoveNews={toggleSaveNews}
              onOpenPaper={openPaperReader}
              onOpenRepo={openRepoReader}
              onOpenNews={openNewsReader}
            />
          )}
        </main>
      )}

      {/* Ember Noir Floating Back-to-Top Pill (hidden in Reader mode where Dock sits) */}
      {showBackToTop && !isReaderMode && (
        <button
          type="button"
          onClick={scrollToTop}
          className="capsule-nav fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 text-ink text-xs sm:text-sm font-editorial-label hover:border-accent-hi hover:text-accent-2 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
          title="เลื่อนกลับขึ้นด้านบนสุด"
        >
          <ChevronUp className="w-4 h-4 shrink-0" />
          <span>ขึ้นบนสุด</span>
        </button>
      )}

      {/* Ember Noir Editorial Footer */}
      <footer className="mt-16 border-t border-rule bg-paper-2 py-8 text-xs sm:text-sm font-editorial-label text-muted w-full">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div>
              <strong className="font-editorial-display text-base text-ink block sm:inline sm:mr-3">
                THE REPO RADAR
              </strong>
              <span className="font-editorial-body text-ink-2">
                วารสารสรุปงานวิจัย AI จาก Hugging Face Daily Papers, GitHub
                Trending และ Google Official Blog ฉบับภาษาไทย
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>ซิงก์อัตโนมัติทุกเช้า 07:00 น. + แจ้งเตือน Telegram</span>
            <span className="border-l border-rule pl-4 text-accent-2">
              Ember Noir Edition
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
