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

export default function Home() {
  const [activeSection, setActiveSection] = useState<MainSection>("papers");
  const [isNightMode, setIsNightMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Scroll to top when opening reader
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
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        isNightMode ? "theme-night" : ""
      } bg-[var(--paper-bg)] text-[var(--paper-body)]`}
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
        /* Newspaper Front Page View */
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          {/* ==================== SECTION 1: AI RESEARCH PAPERS ==================== */}
          {activeSection === "papers" && (
            <>
              {/* Edition & Category Newspaper Bar */}
              <div className="bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--paper-rule)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1">
                      เลือกฉบับ:
                    </span>
                    <button
                      onClick={() => setPaperEdition("today")}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                        paperEdition === "today"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      🔥 ฉบับวันนี้ ({todayPaperBatch.length} เรื่อง)
                    </button>

                    <button
                      onClick={() => setPaperEdition("yesterday")}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                        paperEdition === "yesterday"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      📅 ฉบับเมื่อวาน ({yesterdayPaperBatch.length} เรื่อง)
                    </button>

                    <button
                      onClick={() => setPaperEdition("all7")}
                      className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                        paperEdition === "all7"
                          ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                          : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)] hover:bg-[var(--paper-subtle)]"
                      }`}
                    >
                      🗓️ รวมย้อนหลังทั้งหมด ({all7DaysPapers.length} เรื่อง)
                    </button>
                  </div>

                  <button
                    onClick={() => setOnlyWithCode((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer ${
                      onlyWithCode
                        ? "bg-[var(--paper-green)] text-white border-[var(--paper-green)]"
                        : "bg-[var(--paper-bg)] text-[var(--paper-body)] border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)]"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>เฉพาะเปเปอร์ที่มีโค้ด GitHub</span>
                  </button>
                </div>

                {/* Category Newspaper Sections */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1">
                    หมวดวิจัย:
                  </span>
                  <button
                    onClick={() => setSelectedPaperCategory("All")}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      selectedPaperCategory === "All"
                        ? "bg-[var(--paper-accent)] text-white"
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
                        onClick={() => setSelectedPaperCategory(cat)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                          selectedPaperCategory === cat
                            ? "bg-[var(--paper-accent)] text-white"
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
                  {/* LEAD FRONT-PAGE STORY (#1 Paper) */}
                  {(() => {
                    const lead = filteredPapers[0];
                    const isSaved = Boolean(savedPapersMap[lead.id]);
                    return (
                      <section
                        onClick={() => openPaperReader(lead)}
                        className="group cursor-pointer bg-[var(--paper-sheet)] border-2 border-[var(--paper-rule-strong)] rounded p-6 sm:p-8 transition hover:shadow-md"
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          <div className="lg:col-span-7 space-y-4">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent)] text-white">
                                พาดหัวเด่นประจำฉบับ
                              </span>
                              <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent-soft)] text-[var(--paper-accent)]">
                                {lead.category}
                              </span>
                              {lead.organization && (
                                <span className="font-semibold text-[var(--paper-ink)]">
                                  • 🏛️ {lead.organization}
                                </span>
                              )}
                              <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1">
                                • <ThumbsUp className="w-3.5 h-3.5 text-[var(--paper-accent)]" />{" "}
                                {lead.upvotes} Upvotes
                              </span>
                            </div>

                            <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--paper-ink)] leading-snug group-hover:text-[var(--paper-accent)] transition-colors">
                              {lead.hook_headline}
                            </h2>

                            <p className="text-sm font-serif italic text-[var(--paper-muted)]">
                              &ldquo;{lead.title}&rdquo;
                            </p>

                            <p className="text-base text-[var(--paper-body)] leading-relaxed">
                              {lead.short_teaser}
                            </p>

                            <div className="p-4 rounded bg-[var(--paper-subtle)]/60 border-l-3 border-[var(--paper-accent)] space-y-1.5 text-sm">
                              <div className="font-bold text-xs uppercase tracking-wider text-[var(--paper-ink)]">
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

                            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                              <div className="inline-flex items-center gap-2 text-sm font-bold text-[var(--paper-accent)] group-hover:translate-x-1 transition-transform">
                                <span>กดอ่านบทความสรุปเจาะลึก ({lead.reading_time_minutes} นาที)</span>
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
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                                    isSaved
                                      ? "bg-[var(--paper-accent)] text-white border-[var(--paper-accent)]"
                                      : "bg-[var(--paper-bg)] text-[var(--paper-ink)] border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)]"
                                  }`}
                                >
                                  {isSaved ? (
                                    <>
                                      <BookmarkCheck className="w-3.5 h-3.5" />
                                      <span>คั่นหน้าแล้ว</span>
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
                          <div className="lg:col-span-5">
                            <div className="border border-[var(--paper-rule)] rounded bg-white p-3 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={lead.thumbnail_url}
                                alt={lead.title}
                                className="w-full h-64 sm:h-72 object-contain rounded"
                              />
                              <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-sans">
                                <span>ภาพประกอบจาก arXiv:{lead.id}</span>
                                <span>คลิกเพื่ออ่านบทวิเคราะห์ภาษาไทย</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  {/* NEWSPAPER COLUMNS GRID (Remaining Papers) */}
                  {filteredPapers.length > 1 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between border-b-2 border-[var(--paper-rule-strong)] pb-2">
                        <h3 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
                          คอลัมน์งานวิจัยประจำฉบับ ({filteredPapers.length - 1} เรื่อง)
                        </h3>
                        <span className="text-xs text-[var(--paper-muted)]">
                          คลิกที่หัวข้อข่าวเพื่อเปิดอ่านบทความสรุปพร้อมสารบัญ
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPapers.slice(1).map((paper, idx) => {
                          const isSaved = Boolean(savedPapersMap[paper.id]);
                          return (
                            <article
                              key={paper.id}
                              onClick={() => openPaperReader(paper)}
                              className="group cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-5 flex flex-col justify-between transition hover:shadow-xs"
                            >
                              <div className="space-y-3">
                                {/* Top Meta Row */}
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-subtle)] text-[var(--paper-accent)]">
                                    {paper.category}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[var(--paper-ink)] flex items-center gap-1">
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
                                    #{idx + 2}
                                  </span>
                                  {paper.hook_headline}
                                </h4>

                                {/* Original Title */}
                                <p className="text-xs font-serif italic text-[var(--paper-muted)] line-clamp-1">
                                  {paper.title}
                                </p>

                                {/* Teaser */}
                                <p className="text-sm text-[var(--paper-body)] line-clamp-3 leading-relaxed">
                                  {paper.short_teaser}
                                </p>
                              </div>

                              {/* Card Footer */}
                              <div className="pt-4 mt-4 border-t border-[var(--paper-rule)] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-[var(--paper-muted)]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    อ่าน {paper.reading_time_minutes} นาที
                                  </span>
                                  {paper.github_url && (
                                    <span className="px-1.5 py-0.5 rounded bg-[var(--paper-green-soft)] text-[var(--paper-green)] font-semibold">
                                      มีโค้ด
                                    </span>
                                  )}
                                </div>

                                <span className="font-bold text-[var(--paper-accent)] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  อ่านสรุป <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </>
              ) : (
                <div className="p-16 text-center bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded text-[var(--paper-muted)]">
                  ไม่พบบทความวิจัยที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
                </div>
              )}
            </>
          )}

          {/* ==================== SECTION 2: GITHUB REPOSITORIES ==================== */}
          {activeSection === "repos" && (
            <>
              {/* Repo Edition & Filter Bar */}
              <div className="bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mr-1">
                    เลือกฉบับ:
                  </span>
                  <button
                    onClick={() => setRepoDay("today")}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                      repoDay === "today"
                        ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                        : "bg-[var(--paper-bg)] text-[var(--paper-body)] border border-[var(--paper-rule)]"
                    }`}
                  >
                    🔥 มาแรงวันนี้ ({todayRepos.length})
                  </button>
                  <button
                    onClick={() => setRepoDay("yesterday")}
                    className={`px-3.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                      repoDay === "yesterday"
                        ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
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
                          ? "bg-[var(--paper-amber)] text-white border-[var(--paper-amber)]"
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
                      onChange={(e) => setSelectedLang(e.target.value)}
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
                      onChange={(e) => setSelectedMaturity(e.target.value)}
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

              {/* Newspaper Columns for GitHub Repos */}
              {filteredRepos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className="group cursor-pointer bg-[var(--paper-sheet)] border border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)] rounded p-6 flex flex-col justify-between transition hover:shadow-xs"
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
                            ระดับความพร้อม: <strong>{repo.maturity_rating}</strong> •
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
            <div className="space-y-8">
              <div className="border-b-2 border-[var(--paper-rule-strong)] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)]">
                    คลังบทความและโปรเจกต์ที่คุณคั่นหน้าไว้ ({totalSavedCount})
                  </h2>
                  <p className="text-sm text-[var(--paper-muted)]">
                    รายการที่คั่นหน้าไว้จะถูกบันทึกอยู่ในเบราว์เซอร์ของคุณอย่างถาวร
                    สามารถกลับมาอ่านซ้ำได้ทุกเมื่อแม้ผ่านไปเกิน 7 วัน
                  </p>
                </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                ลบออกจากการคั่นหน้า
                              </button>
                            </div>
                            <h4 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                ลบออกจากการคั่นหน้า
                              </button>
                            </div>
                            <h4 className="font-editorial text-lg font-bold text-[var(--paper-ink)]">
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

      {/* Classic Newspaper Colophon Footer */}
      <footer className="mt-16 border-t-2 border-[var(--paper-rule-strong)] bg-[var(--paper-sheet)] py-8 text-xs text-[var(--paper-muted)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="font-masthead text-sm text-[var(--paper-ink)]">
              THE REPO RADAR
            </strong>{" "}
            — วารสารสรุปงานวิจัย AI จาก Hugging Face Daily Papers และ GitHub
            Trending ฉบับภาษาไทย
          </div>
          <div>
            ซิงก์ข้อมูลอัตโนมัติทุกเช้า 07:00 น. • ออกแบบเพื่อการอ่านที่สบายตา
          </div>
        </div>
      </footer>
    </div>
  );
}
