"use client";

import { useState, useMemo, useEffect } from "react";
import reposData from "../data/repos.json";
import papersData from "../data/papers.json";
import newsData from "../data/news.json";
import {
  PAPER_CATEGORIES,
  NEWS_CATEGORIES,
  type RepositoryData,
  type ReposFeedData,
  type PaperData,
  type PapersFeedData,
  type NewsArticleData,
  type NewsFeedData,
} from "../types";
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

  // Repo Filters
  const [repoDay, setRepoDay] = useState<"today" | "yesterday">("today");
  const [onlyRepoStreak, setOnlyRepoStreak] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedMaturity, setSelectedMaturity] = useState<string>("All");

  // AI Lab News Filters
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("All");

  // Reader View State (Full-page book/article reader)
  const [readingPaper, setReadingPaper] = useState<PaperData | null>(null);
  const [readingRepo, setReadingRepo] = useState<RepositoryData | null>(null);
  const [readingNews, setReadingNews] = useState<NewsArticleData | null>(null);

  // Saved Bookmarks (Persisted permanently in localStorage)
  const [savedPapersMap, setSavedPapersMap] = useState<Record<string, PaperData>>({});
  const [savedReposMap, setSavedReposMap] = useState<Record<string, RepositoryData>>({});
  const [savedNewsMap, setSavedNewsMap] = useState<Record<string, NewsArticleData>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = localStorage.getItem(SAVED_PAPERS_KEY);
      if (sp) setSavedPapersMap(JSON.parse(sp));
      const sr = localStorage.getItem(SAVED_REPOS_KEY);
      if (sr) setSavedReposMap(JSON.parse(sr));
      const sn = localStorage.getItem(SAVED_NEWS_KEY);
      if (sn) setSavedNewsMap(JSON.parse(sn));
    } catch (e) {
      console.warn("Could not load saved state from localStorage:", e);
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const openPaperReader = (paper: PaperData) => {
    setReadingRepo(null);
    setReadingNews(null);
    setReadingPaper(paper);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openRepoReader = (repo: RepositoryData) => {
    setReadingPaper(null);
    setReadingNews(null);
    setReadingRepo(repo);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openNewsReader = (article: NewsArticleData) => {
    setReadingPaper(null);
    setReadingRepo(null);
    setReadingNews(article);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
  }, [activePapersPool, selectedPaperCategory, onlyWithCode, searchQuery]);

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
    onlyRepoStreak,
    repoDay,
    yesterdayRepoMap,
    selectedLang,
    selectedMaturity,
    searchQuery,
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
  }, [selectedNewsCategory, searchQuery]);

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
        activeSection={activeSection}
        onSelectSection={handleSectionSelect}
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
      />

      {/* Full-Page Article Reader Mode */}
      {readingPaper ? (
        <ArticleReader
          paper={readingPaper}
          isSaved={Boolean(savedPapersMap[readingPaper.id])}
          onToggleSave={() => toggleSavePaper(readingPaper)}
          onBack={() => setReadingPaper(null)}
        />
      ) : readingRepo ? (
        <ArticleReader
          repo={readingRepo}
          isSaved={Boolean(savedReposMap[readingRepo.id])}
          onToggleSave={() => toggleSaveRepo(readingRepo)}
          onBack={() => setReadingRepo(null)}
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
          isSaved={Boolean(savedNewsMap[readingNews.id])}
          onToggleSave={() => toggleSaveNews(readingNews)}
          onBack={() => setReadingNews(null)}
        />
      ) : (
        <main className="container py-6 sm:py-8 space-y-6">
          {activeSection === "papers" && (
            <PapersSection
              paperEdition={paperEdition}
              onChangeEdition={(edition) => {
                setPaperEdition(edition);
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
                setCurrentPage(1);
              }}
              todayCount={todayRepos.length}
              yesterdayCount={yesterdayRepos.length}
              repoStreakCount={repoStreakCount}
              onlyRepoStreak={onlyRepoStreak}
              onToggleOnlyRepoStreak={() => setOnlyRepoStreak((prev) => !prev)}
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

      {/* Square Editorial Back-to-Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 border border-ink bg-paper text-ink text-xs sm:text-sm font-editorial-label hover:bg-ink hover:text-paper transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
          title="เลื่อนกลับขึ้นด้านบนสุด"
        >
          <ChevronUp className="w-4 h-4 shrink-0" />
          <span>ขึ้นบนสุด</span>
        </button>
      )}

      {/* Editorial Colophon Footer */}
      <footer className="mt-16 border-t-4 border-ink bg-paper-2 py-8 text-xs sm:text-sm font-editorial-label text-muted w-full">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <strong className="font-editorial-display text-base text-ink block sm:inline sm:mr-3">
              THE REPO RADAR
            </strong>
            <span className="font-editorial-body text-ink-2">
              วารสารสรุปงานวิจัย AI จาก Hugging Face Daily Papers, GitHub
              Trending และ Google Official Blog ฉบับภาษาไทย
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>ซิงก์ข้อมูลอัตโนมัติทุกเช้า 07:00 น.</span>
            <span className="border-l border-rule-2 pl-4">
              ออกแบบเพื่อการอ่านในสไตล์สิ่งพิมพ์
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
