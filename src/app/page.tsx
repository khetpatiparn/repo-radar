"use client";

import { useState, useMemo, useEffect } from "react";
import reposData from "../data/repos.json";
import papersData from "../data/papers.json";
import {
  PAPER_CATEGORIES,
  type RepositoryData,
  type ReposFeedData,
  type PaperData,
  type PapersFeedData,
} from "../types";
import { Header, type MainSection } from "../components/Header";
import { ArticleReader } from "../components/ArticleReader";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  ThumbsUp,
  Star,
  ArrowRight,
  Code2,
  Sparkles,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

const SAVED_PAPERS_KEY = "reporadar_saved_papers_v1";
const SAVED_REPOS_KEY = "reporadar_saved_repos_v1";
const NIGHT_MODE_KEY = "reporadar_night_mode_v1";
const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [activeSection, setActiveSection] = useState<MainSection>("papers");
  const [isNightMode, setIsNightMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Anti-Scroll Fatigue Features (UX Research based)
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

  // Reader View State (Full-page book/article reader)
  const [readingPaper, setReadingPaper] = useState<PaperData | null>(null);
  const [readingRepo, setReadingRepo] = useState<RepositoryData | null>(null);

  // Saved Bookmarks (Persisted permanently in localStorage)
  const [savedPapersMap, setSavedPapersMap] = useState<Record<string, PaperData>>({});
  const [savedReposMap, setSavedReposMap] = useState<Record<string, RepositoryData>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const sp = localStorage.getItem(SAVED_PAPERS_KEY);
      if (sp) setSavedPapersMap(JSON.parse(sp));
      const sr = localStorage.getItem(SAVED_REPOS_KEY);
      if (sr) setSavedReposMap(JSON.parse(sr));
      const nm = localStorage.getItem(NIGHT_MODE_KEY);
      if (nm === "true") setIsNightMode(true);
    } catch (e) {
      console.warn("Could not load saved state from localStorage:", e);
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNightMode = () => {
    setIsNightMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(NIGHT_MODE_KEY, String(next));
      }
      return next;
    });
  };

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

  const openPaperReader = (paper: PaperData) => {
    setReadingRepo(null);
    setReadingPaper(paper);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openRepoReader = (repo: RepositoryData) => {
    setReadingPaper(null);
    setReadingRepo(repo);
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
        new Set(activeReposPool.map((r) => r.language).filter(Boolean))
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

  // Pagination calculation for papers to prevent scroll fatigue
  const totalPaperPages = Math.max(1, Math.ceil(filteredPapers.length / ITEMS_PER_PAGE));
  const safeCurrentPaperPage = Math.min(currentPage, totalPaperPages);
  const pagedPapers = useMemo(() => {
    const start = (safeCurrentPaperPage - 1) * ITEMS_PER_PAGE;
    return filteredPapers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPapers, safeCurrentPaperPage]);

  const savedPapersList = Object.values(savedPapersMap);
  const savedReposList = Object.values(savedReposMap);
  const totalSavedCount = savedPapersList.length + savedReposList.length;

  const latestUpdate =
    rawPapersFeed?.updated_at ||
    todayRepos[0]?.updated_at ||
    "2026-11-12T00:00:00Z";

  const handleSectionSelect = (sec: MainSection) => {
    setActiveSection(sec);
    setReadingPaper(null);
    setReadingRepo(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop();
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        isNightMode ? "theme-night" : ""
      } bg-[var(--paper-bg)] text-[var(--paper-body)] w-full`}
    >
      <Header
        updatedAt={latestUpdate}
        totalItems={
          activeSection === "papers"
            ? filteredPapers.length
            : filteredRepos.length
        }
        activeSection={activeSection}
        onSelectSection={handleSectionSelect}
        savedCount={totalSavedCount}
        searchQuery={searchQuery}
        onSearch={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
          if (readingPaper || readingRepo) {
            setReadingPaper(null);
            setReadingRepo(null);
          }
        }}
        isNightMode={isNightMode}
        onToggleNightMode={toggleNightMode}
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
      ) : (
        /* Newspaper Front Page View (Full-Width Edge-to-Edge) */
        <main className="w-full px-4 sm:px-8 lg:px-10 py-5 sm:py-8 space-y-6">
          {/* ==================== SECTION 1: AI RESEARCH PAPERS ==================== */}
          {activeSection === "papers" && (
            <>
              {/* Sticky Filter & View Controller Bar (Anti-Scroll Fatigue) */}
              <div className="sticky top-0 z-20 backdrop-blur-md bg-[var(--paper-sheet)]/95 border border-[var(--paper-rule)] rounded p-3.5 space-y-3 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-[var(--paper-rule)]">
                  {/* Swipeable edition tabs */}
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1 shrink-0">
                      ฉบับ:
                    </span>
                    <button
                      onClick={() => {
                        setPaperEdition("today");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                        paperEdition === "today"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      🔥 วันนี้ ({todayPaperBatch.length})
                    </button>

                    <button
                      onClick={() => {
                        setPaperEdition("yesterday");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                        paperEdition === "yesterday"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      📅 เมื่อวาน ({yesterdayPaperBatch.length})
                    </button>

                    <button
                      onClick={() => {
                        setPaperEdition("all7");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                        paperEdition === "all7"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      🗓️ รวมย้อนหลัง ({all7DaysPapers.length})
                    </button>
                  </div>

                  {/* Right Utility: View Switcher (Cards vs Compact Digest) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5">
                    <button
                      onClick={() => {
                        setOnlyWithCode((prev) => !prev);
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition shrink-0 cursor-pointer active:scale-95 ${
                        onlyWithCode
                          ? "bg-[var(--paper-green)] text-white border-[var(--paper-green)] shadow-xs"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)]"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5 shrink-0" />
                      <span>มีโค้ด GitHub</span>
                    </button>

                    {/* Anti-Scroll Fatigue View Mode Switcher */}
                    <div className="flex items-center border border-[var(--paper-rule)] rounded bg-[var(--paper-bg)] p-0.5 text-xs">
                      <button
                        onClick={() => setViewMode("cards")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                          viewMode === "cards"
                            ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                            : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                        }`}
                        title="มุมมองการ์ดข่าว (รูปภาพและไฮไลต์)"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">การ์ด</span>
                      </button>
                      <button
                        onClick={() => setViewMode("compact")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded transition cursor-pointer font-medium ${
                          viewMode === "compact"
                            ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                            : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                        }`}
                        title="มุมมองสารบัญด่วน (กะทัดรัด ไม่ต้องเลื่อนเยอะ)"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">สารบัญด่วน</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category Newspaper Sections */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1 shrink-0">
                    หมวด:
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPaperCategory("All");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                      selectedPaperCategory === "All"
                        ? "bg-[var(--paper-accent)] text-white shadow-xs"
                        : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
                    }`}
                  >
                    ทั้งหมด ({activePapersPool.length})
                  </button>
                  {PAPER_CATEGORIES.map((cat) => {
                    const count = activePapersPool.filter(
                      (p) => p.category === cat
                    ).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedPaperCategory(cat);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded text-xs font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                          selectedPaperCategory === cat
                            ? "bg-[var(--paper-accent)] text-white shadow-xs"
                            : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredPapers.length > 0 ? (
                <>
                  {/* LEAD FRONT-PAGE STORY (Shown on Page 1 in Cards mode) */}
                  {safeCurrentPaperPage === 1 && viewMode === "cards" && (
                    (() => {
                      const lead = filteredPapers[0];
                      const isSaved = Boolean(savedPapersMap[lead.id]);
                      return (
                        <section
                          onClick={() => openPaperReader(lead)}
                          className="group cursor-pointer bg-[var(--paper-sheet)] border-2 border-[var(--paper-rule-strong)] rounded p-5 sm:p-7 md:p-8 transition hover:shadow-md"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent)] text-white text-[11px] sm:text-xs">
                                  พาดหัวเด่นประจำฉบับ
                                </span>
                                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent-soft)] text-[var(--paper-accent)] text-[11px] sm:text-xs">
                                  {lead.category}
                                </span>
                                {lead.organization && (
                                  <span className="font-semibold text-[var(--paper-ink)] text-[11px] sm:text-xs">
                                    • 🏛️ {lead.organization}
                                  </span>
                                )}
                                <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1 text-[11px] sm:text-xs">
                                  • <ThumbsUp className="w-3.5 h-3.5 text-[var(--paper-accent)]" />{" "}
                                  {lead.upvotes} Upvotes
                                </span>
                              </div>

                              <h2 className="font-editorial text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--paper-ink)] leading-snug group-hover:text-[var(--paper-accent)] transition-colors">
                                {lead.hook_headline}
                              </h2>

                              <p className="text-xs sm:text-sm font-serif italic text-[var(--paper-muted)] line-clamp-1">
                                &ldquo;{lead.title}&rdquo;
                              </p>

                              <p className="text-sm sm:text-base text-[var(--paper-body)] leading-relaxed line-clamp-3 sm:line-clamp-4">
                                {lead.short_teaser}
                              </p>

                              <div className="p-4 rounded bg-[var(--paper-subtle)]/60 border-l-3 border-[var(--paper-accent)] space-y-1.5 text-xs sm:text-sm">
                                <div className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[var(--paper-ink)]">
                                  ไฮไลต์สำคัญในบทความ:
                                </div>
                                {lead.tldr_takeaways.slice(0, 2).map((t, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-[var(--paper-accent)] font-bold">
                                      •
                                    </span>
                                    <span>{t}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                                <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--paper-accent)] group-hover:translate-x-1 transition-transform">
                                  <span>กดอ่านบทความเจาะลึก ({lead.reading_time_minutes} นาที)</span>
                                  <ArrowRight className="w-4 h-4" />
                                </div>

                                <div className="flex items-center gap-2">
                                  {lead.github_url && (
                                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[var(--paper-green-soft)] text-[var(--paper-green)]">
                                      💻 มีโค้ด GitHub
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => toggleSavePaper(lead, e)}
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                                      isSaved
                                        ? "bg-[var(--paper-accent)] text-white border-[var(--paper-accent)]"
                                        : "bg-[var(--paper-bg)] text-[var(--paper-ink)] border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)]"
                                    }`}
                                  >
                                    {isSaved ? (
                                      <>
                                        <BookmarkCheck className="w-3.5 h-3.5" />
                                        <span>คั่นแล้ว</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark className="w-3.5 h-3.5" />
                                        <span>คั่นหน้า</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Right Visual Column */}
                            <div className="lg:col-span-4">
                              <div className="border border-[var(--paper-rule)] rounded bg-white p-3 shadow-2xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={lead.thumbnail_url}
                                  alt={lead.title}
                                  className="w-full h-56 sm:h-64 lg:h-72 object-contain rounded"
                                />
                                <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-sans">
                                  <span>arXiv:{lead.id}</span>
                                  <span>แตะเพื่ออ่านบทความ</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      );
                    })()
                  )}

                  {/* ==================== VIEW MODE 1: EDITORIAL CARDS ==================== */}
                  {viewMode === "cards" && (
                    <section className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b-2 border-[var(--paper-rule-strong)] pb-2">
                        <h3 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
                          คอลัมน์งานวิจัย ({filteredPapers.length} เรื่อง • หน้า {safeCurrentPaperPage}/{totalPaperPages})
                        </h3>
                        <span className="text-xs text-[var(--paper-muted)]">
                          แสดงผลเต็มหน้าจอ • แตะที่หัวข้อข่าวเพื่ออ่านบทความ
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                        {(safeCurrentPaperPage === 1 ? filteredPapers.slice(1, ITEMS_PER_PAGE) : pagedPapers).map((paper, idx) => {
                          const isSaved = Boolean(savedPapersMap[paper.id]);
                          const itemIndex = safeCurrentPaperPage === 1 ? idx + 2 : (safeCurrentPaperPage - 1) * ITEMS_PER_PAGE + idx + 1;
                          return (
                            <article
                              key={paper.id}
                              onClick={() => openPaperReader(paper)}
                              className="group cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-5 flex flex-col justify-between transition hover:shadow-xs active:scale-[0.99]"
                            >
                              <div className="space-y-3">
                                {/* Top Meta Row */}
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-subtle)] text-[var(--paper-accent)] text-[11px] truncate max-w-[200px]">
                                    {paper.category}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1 text-[11px]">
                                      <ThumbsUp className="w-3 h-3 text-[var(--paper-accent)]" />
                                      {paper.upvotes}
                                    </span>
                                    <button
                                      onClick={(e) => toggleSavePaper(paper, e)}
                                      className="p-1 rounded hover:bg-[var(--paper-subtle)] text-[var(--paper-muted)] hover:text-[var(--paper-ink)] cursor-pointer"
                                      title="คั่นหน้าบทความนี้"
                                    >
                                      {isSaved ? (
                                        <BookmarkCheck className="w-4 h-4 text-[var(--paper-accent)]" />
                                      ) : (
                                        <Bookmark className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Headline */}
                                <h4 className="font-editorial text-lg font-bold text-[var(--paper-ink)] leading-snug group-hover:text-[var(--paper-accent)] transition-colors">
                                  <span className="font-mono text-xs text-[var(--paper-muted)] mr-1.5">
                                    #{itemIndex}
                                  </span>
                                  {paper.hook_headline}
                                </h4>

                                {/* Original Title */}
                                <p className="text-xs font-serif italic text-[var(--paper-muted)] line-clamp-1">
                                  {paper.title}
                                </p>

                                {/* Teaser */}
                                <p className="text-xs sm:text-sm text-[var(--paper-body)] line-clamp-3 leading-relaxed">
                                  {paper.short_teaser}
                                </p>
                              </div>

                              {/* Card Footer */}
                              <div className="pt-3 mt-3 border-t border-[var(--paper-rule)] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-[var(--paper-muted)] text-[11px]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {paper.reading_time_minutes} นาที
                                  </span>
                                  {paper.github_url && (
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--paper-green-soft)] text-[var(--paper-green)] font-semibold text-[10px]">
                                      มีโค้ด
                                    </span>
                                  )}
                                </div>

                                <span className="font-bold text-[var(--paper-accent)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                                  อ่านสรุป <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* ==================== VIEW MODE 2: COMPACT DIGEST (ANTI-SCROLL FATIGUE) ==================== */}
                  {viewMode === "compact" && (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-[var(--paper-rule-strong)] pb-2">
                        <h3 className="font-editorial text-base sm:text-lg font-bold text-[var(--paper-ink)]">
                          สารบัญด่วน (สแกนเร็วในหน้าเดียว • {filteredPapers.length} เรื่อง • หน้า {safeCurrentPaperPage}/{totalPaperPages})
                        </h3>
                        <span className="text-xs text-[var(--paper-muted)]">
                          คลิกที่แถวเพื่อเปิดอ่านบทความ
                        </span>
                      </div>

                      <div className="border border-[var(--paper-rule)] rounded bg-[var(--paper-sheet)] divide-y divide-[var(--paper-rule)] overflow-hidden">
                        {pagedPapers.map((paper, idx) => {
                          const isSaved = Boolean(savedPapersMap[paper.id]);
                          const itemIndex = (safeCurrentPaperPage - 1) * ITEMS_PER_PAGE + idx + 1;
                          return (
                            <div
                              key={paper.id}
                              onClick={() => openPaperReader(paper)}
                              className="group cursor-pointer p-3 sm:p-4 hover:bg-[var(--paper-subtle)]/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="font-mono text-xs font-bold text-[var(--paper-accent)] mt-0.5 shrink-0">
                                  #{itemIndex}
                                </span>
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--paper-subtle)] text-[var(--paper-accent)]">
                                      {paper.category}
                                    </span>
                                    {paper.organization && (
                                      <span className="text-xs text-[var(--paper-muted)]">
                                        🏛️ {paper.organization}
                                      </span>
                                    )}
                                    {paper.github_url && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-[var(--paper-green-soft)] text-[var(--paper-green)] rounded">
                                        มีโค้ด
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-editorial font-bold text-sm sm:text-base text-[var(--paper-ink)] group-hover:text-[var(--paper-accent)] transition-colors leading-snug">
                                    {paper.hook_headline}
                                  </h4>
                                  <p className="text-xs text-[var(--paper-muted)] line-clamp-1 font-serif">
                                    {paper.title}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 self-end md:self-center text-xs">
                                <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1">
                                  <ThumbsUp className="w-3.5 h-3.5 text-[var(--paper-accent)]" />
                                  {paper.upvotes}
                                </span>
                                <span className="text-[var(--paper-muted)] hidden sm:inline">
                                  {paper.reading_time_minutes} นาที
                                </span>
                                <button
                                  onClick={(e) => toggleSavePaper(paper, e)}
                                  className="p-1 rounded text-[var(--paper-muted)] hover:text-[var(--paper-ink)] cursor-pointer"
                                  title="คั่นหน้า"
                                >
                                  {isSaved ? (
                                    <BookmarkCheck className="w-4 h-4 text-[var(--paper-accent)]" />
                                  ) : (
                                    <Bookmark className="w-4 h-4" />
                                  )}
                                </button>
                                <span className="font-bold text-[var(--paper-accent)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  อ่าน <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Bounded Pagination Controls (Anti-Scroll Fatigue) */}
                  {totalPaperPages > 1 && (
                    <div className="pt-4 border-t border-[var(--paper-rule)] flex items-center justify-between gap-4 text-xs">
                      <button
                        disabled={safeCurrentPaperPage <= 1}
                        onClick={() => handlePageChange(safeCurrentPaperPage - 1)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--paper-rule)] transition font-medium cursor-pointer ${
                          safeCurrentPaperPage <= 1
                            ? "opacity-40 cursor-not-allowed bg-[var(--paper-subtle)]"
                            : "bg-[var(--paper-sheet)] hover:bg-[var(--paper-subtle)] text-[var(--paper-ink)] active:scale-95"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>หน้าก่อนหน้า</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPaperPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p)}
                            className={`w-7 h-7 rounded text-xs font-semibold transition cursor-pointer ${
                              safeCurrentPaperPage === p
                                ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                                : "hover:bg-[var(--paper-subtle)] text-[var(--paper-body)]"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={safeCurrentPaperPage >= totalPaperPages}
                        onClick={() => handlePageChange(safeCurrentPaperPage + 1)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[var(--paper-rule)] transition font-medium cursor-pointer ${
                          safeCurrentPaperPage >= totalPaperPages
                            ? "opacity-40 cursor-not-allowed bg-[var(--paper-subtle)]"
                            : "bg-[var(--paper-sheet)] hover:bg-[var(--paper-subtle)] text-[var(--paper-ink)] active:scale-95"
                        }`}
                      >
                        <span>หน้าถัดไป</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-16 text-center bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded text-[var(--paper-muted)] text-sm">
                  ไม่พบบทความวิจัยที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
                </div>
              )}
            </>
          )}

          {/* ==================== SECTION 2: GITHUB REPOSITORIES ==================== */}
          {activeSection === "repos" && (
            <>
              {/* Sticky Repo Filter Bar */}
              <div className="sticky top-0 z-20 backdrop-blur-md bg-[var(--paper-sheet)]/95 border border-[var(--paper-rule)] rounded p-3.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1">
                    ฉบับ:
                  </span>
                  <button
                    onClick={() => {
                      setRepoDay("today");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer active:scale-95 ${
                      repoDay === "today"
                        ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                        : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)]"
                    }`}
                  >
                    🔥 มาแรงวันนี้ ({todayRepos.length})
                  </button>
                  <button
                    onClick={() => {
                      setRepoDay("yesterday");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer active:scale-95 ${
                      repoDay === "yesterday"
                        ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                        : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)]"
                    }`}
                  >
                    📅 มาแรงเมื่อวาน ({yesterdayRepos.length})
                  </button>

                  {repoStreakCount > 0 && repoDay === "today" && (
                    <button
                      onClick={() => setOnlyRepoStreak((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer ${
                        onlyRepoStreak
                          ? "bg-[var(--paper-amber)] text-white border-[var(--paper-amber)] shadow-xs"
                          : "bg-[var(--paper-amber-soft)] text-[var(--paper-amber)] border-[var(--paper-amber)]/30"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🔥 ติดเทรนด์ 2 วันซ้อน ({repoStreakCount})</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--paper-muted)] font-semibold">
                      ภาษา:
                    </span>
                    <select
                      value={selectedLang}
                      onChange={(e) => {
                        setSelectedLang(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)]"
                    >
                      {repoLanguages.map((l) => (
                        <option key={l || "unknown"} value={l || "unknown"}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--paper-muted)] font-semibold">
                      ความพร้อม:
                    </span>
                    <select
                      value={selectedMaturity}
                      onChange={(e) => {
                        setSelectedMaturity(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)]"
                    >
                      {["All", "Production-Ready", "Experimental", "PoC"].map(
                        (m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Newspaper Columns for GitHub Repos (Full Width Grid) */}
              {filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {filteredRepos.map((repo, idx) => {
                    const key = `${repo.owner}/${repo.name}`.toLowerCase();
                    const yesterdayMatch =
                      yesterdayRepoMap.get(repo.id) || yesterdayRepoMap.get(key);
                    const isStreak =
                      repoDay === "today" && Boolean(yesterdayMatch);
                    const starDelta =
                      isStreak && yesterdayMatch
                        ? Math.max(0, repo.stars - yesterdayMatch.stars)
                        : 0;
                    const isSaved = Boolean(savedReposMap[repo.id]);

                    return (
                      <article
                        key={`${repoDay}-${repo.id}`}
                        onClick={() => openRepoReader(repo)}
                        className="group cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-5 sm:p-6 flex flex-col justify-between transition hover:shadow-xs active:scale-[0.99]"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-[var(--paper-accent)]">
                                #{idx + 1}
                              </span>
                              <span className="font-mono font-bold text-sm text-[var(--paper-ink)]">
                                {repo.owner}/{repo.name}
                              </span>
                              {repo.language && (
                                <span className="px-2 py-0.5 rounded bg-[var(--paper-subtle)] text-[var(--paper-ink)] font-semibold">
                                  {repo.language}
                                </span>
                              )}
                              {isStreak && (
                                <span className="px-2 py-0.5 rounded bg-[var(--paper-amber-soft)] text-[var(--paper-amber)] font-bold">
                                  🔥 ติดเทรนด์ 2 วันซ้อน
                                  {starDelta > 0
                                    ? ` (+${starDelta.toLocaleString()} ดาว)`
                                    : ""}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-[var(--paper-amber)] fill-[var(--paper-amber)]" />
                                {(repo.stars / 1000).toFixed(1)}k (+
                                {repo.stars_today.toLocaleString()})
                              </span>
                              <button
                                onClick={(e) => toggleSaveRepo(repo, e)}
                                className="p-1 rounded hover:bg-[var(--paper-subtle)] text-[var(--paper-muted)] cursor-pointer"
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-4 h-4 text-[var(--paper-accent)]" />
                                ) : (
                                  <Bookmark className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <h3 className="font-editorial text-xl font-bold text-[var(--paper-ink)] leading-snug group-hover:text-[var(--paper-accent)] transition-colors">
                            {repo.one_liner}
                          </h3>

                          <p className="text-sm text-[var(--paper-body)] line-clamp-2 leading-relaxed">
                            {repo.problem_solved}
                          </p>

                          <div className="p-3 rounded bg-[var(--paper-subtle)]/60 text-xs">
                            <strong className="text-[var(--paper-green)]">
                              💡 ไอเดียต่อยอด SaaS:{" "}
                            </strong>
                            <span className="text-[var(--paper-body)] line-clamp-1">
                              {repo.ai_opportunity.monetization_idea}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-[var(--paper-rule)] flex items-center justify-between text-xs">
                          <span className="text-[var(--paper-muted)]">
                            ความพร้อม: <strong>{repo.maturity_rating}</strong> •
                            Hype {repo.human_vibe_check.hype_vs_reality}/10
                          </span>
                          <span className="font-bold text-[var(--paper-accent)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            อ่านบทวิเคราะห์ <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="p-16 text-center bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded text-[var(--paper-muted)]">
                  ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขการค้นหา
                </div>
              )}
            </>
          )}

          {/* ==================== SECTION 3: SAVED BOOKMARKS ==================== */}
          {activeSection === "saved" && (
            <div className="space-y-6">
              <div className="border-b-2 border-[var(--paper-rule-strong)] pb-3">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)]">
                  คลังบทความและโปรเจกต์ที่คุณคั่นหน้าไว้ ({totalSavedCount})
                </h2>
                <p className="text-sm text-[var(--paper-muted)]">
                  รายการที่คั่นหน้าไว้จะถูกบันทึกอยู่ในเบราว์เซอร์ของคุณอย่างถาวร
                  สามารถกลับมาอ่านซ้ำได้ทุกเมื่อ
                </p>
              </div>

              {totalSavedCount === 0 ? (
                <div className="p-16 text-center bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded space-y-2">
                  <Bookmark className="w-8 h-8 text-[var(--paper-muted)] mx-auto" />
                  <div className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
                    ยังไม่มีบทความที่คั่นหน้าไว้
                  </div>
                  <p className="text-sm text-[var(--paper-muted)]">
                    กดปุ่ม &ldquo;คั่นหน้า&rdquo; บนเปเปอร์วิจัยหรือโปรเจกต์โอเพนซอร์สที่คุณสนใจเพื่อเก็บไว้อ่านภายหลัง
                  </p>
                </div>
              ) : (
                <>
                  {savedPapersList.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
                        📄 เปเปอร์วิจัยที่คั่นไว้ ({savedPapersList.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {savedPapersList.map((paper) => (
                          <article
                            key={paper.id}
                            onClick={() => openPaperReader(paper)}
                            className="cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="px-2 py-0.5 rounded font-bold bg-[var(--paper-subtle)] text-[var(--paper-accent)]">
                                {paper.category}
                              </span>
                              <button
                                onClick={(e) => toggleSavePaper(paper, e)}
                                className="text-xs text-[var(--paper-accent)] font-semibold cursor-pointer"
                              >
                                ลบออก
                              </button>
                            </div>
                            <h4 className="font-editorial text-lg font-bold text-[var(--paper-ink)] leading-snug">
                              {paper.hook_headline}
                            </h4>
                            <p className="text-sm text-[var(--paper-body)] line-clamp-2">
                              {paper.short_teaser}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  {savedReposList.length > 0 && (
                    <section className="space-y-4">
                      <h3 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
                        💻 โปรเจกต์ GitHub ที่คั่นไว้ ({savedReposList.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {savedReposList.map((repo) => (
                          <article
                            key={repo.id}
                            onClick={() => openRepoReader(repo)}
                            className="cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-5 space-y-3"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-bold text-[var(--paper-ink)]">
                                {repo.owner}/{repo.name}
                              </span>
                              <button
                                onClick={(e) => toggleSaveRepo(repo, e)}
                                className="text-xs text-[var(--paper-accent)] font-semibold cursor-pointer"
                              >
                                ลบออก
                              </button>
                            </div>
                            <h4 className="font-editorial text-lg font-bold text-[var(--paper-ink)] leading-snug">
                              {repo.one_liner}
                            </h4>
                            <p className="text-sm text-[var(--paper-body)] line-clamp-2">
                              {repo.problem_solved}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      )}

      {/* Floating Anti-Scroll Fatigue Button (Back to Top) */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full shadow-lg border border-[var(--paper-rule-strong)] bg-[var(--paper-sheet)] text-[var(--paper-ink)] font-semibold text-xs hover:bg-[var(--paper-ink)] hover:text-[var(--paper-sheet)] transition cursor-pointer active:scale-95 animate-in fade-in slide-in-from-bottom-2"
          title="เลื่อนกลับขึ้นด้านบนสุด"
        >
          <ChevronUp className="w-4 h-4" />
          <span>ขึ้นบนสุด</span>
        </button>
      )}

      {/* Classic Newspaper Colophon Footer (Full Width Edge-to-Edge) */}
      <footer className="mt-16 border-t-2 border-[var(--paper-rule-strong)] bg-[var(--paper-sheet)] py-8 text-xs text-[var(--paper-muted)] w-full">
        <div className="w-full px-4 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="font-masthead text-sm text-[var(--paper-ink)]">
              THE REPO RADAR
            </strong>{" "}
            — วารสารสรุปงานวิจัย AI จาก Hugging Face Daily Papers และ GitHub
            Trending ฉบับภาษาไทย
          </div>
          <div>
            ซิงก์ข้อมูลอัตโนมัติทุกเช้า 07:00 น. • ออกแบบเพื่อการอ่านที่สบายตาและลดการเลื่อนหน้าจอ
          </div>
        </div>
      </footer>
    </div>
  );
}
