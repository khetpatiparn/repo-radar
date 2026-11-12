"use client";

import { useState, useMemo } from "react";
import reposData from "../data/repos.json";
import { type RepositoryData, type ReposFeedData } from "../types";
import { Header } from "../components/Header";
import { RepoCard } from "../components/RepoCard";
import { Flame, Calendar, Sparkles } from "lucide-react";

// Support both { today, yesterday } object and legacy flat array
const rawFeed = reposData as unknown as ReposFeedData | RepositoryData[];
const todayRepos: RepositoryData[] = Array.isArray(rawFeed)
  ? rawFeed
  : rawFeed.today || [];
const yesterdayRepos: RepositoryData[] = Array.isArray(rawFeed)
  ? []
  : rawFeed.yesterday || [];

export default function Home() {
  const [activeDay, setActiveDay] = useState<"today" | "yesterday">("today");
  const [onlyStreak, setOnlyStreak] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedMaturity, setSelectedMaturity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("velocity");

  const yesterdayMap = useMemo(() => {
    const map = new Map<string, RepositoryData>();
    for (const r of yesterdayRepos) {
      map.set(r.id, r);
      map.set(`${r.owner}/${r.name}`.toLowerCase(), r);
    }
    return map;
  }, []);

  const todayMap = useMemo(() => {
    const map = new Map<string, RepositoryData>();
    for (const r of todayRepos) {
      map.set(r.id, r);
      map.set(`${r.owner}/${r.name}`.toLowerCase(), r);
    }
    return map;
  }, []);

  const streakCount = useMemo(() => {
    return todayRepos.filter(
      (r) =>
        yesterdayMap.has(r.id) ||
        yesterdayMap.has(`${r.owner}/${r.name}`.toLowerCase())
    ).length;
  }, [yesterdayMap]);

  const activeRepos = activeDay === "today" ? todayRepos : yesterdayRepos;

  // Get latest updated time, fallback to a fixed string if empty to avoid unstable Date during SSG
  const latestUpdate =
    activeRepos.length > 0
      ? activeRepos[0].updated_at
      : todayRepos.length > 0
      ? todayRepos[0].updated_at
      : "2023-11-15T12:00:00Z";

  // Calculate average hype
  const avgHype =
    activeRepos.length > 0
      ? activeRepos.reduce(
          (acc, repo) => acc + repo.human_vibe_check.hype_vs_reality,
          0
        ) / activeRepos.length
      : 0;

  // Extract unique filters for active day
  const languages = [
    "All",
    ...Array.from(new Set(activeRepos.map((r) => r.language).filter(Boolean))),
  ];
  const maturities = ["All", "Production-Ready", "Experimental", "PoC"];
  const categories = [
    "All",
    ...Array.from(new Set(activeRepos.flatMap((r) => r.topics))),
  ].filter((c) => typeof c === "string" && c.trim() !== "");

  // Filter and sort logic
  const filteredRepos = useMemo(() => {
    let result = [...activeRepos];

    // Optional 2-day streak filter
    if (onlyStreak) {
      result = result.filter((repo) => {
        const key = `${repo.owner}/${repo.name}`.toLowerCase();
        return activeDay === "today"
          ? yesterdayMap.has(repo.id) || yesterdayMap.has(key)
          : todayMap.has(repo.id) || todayMap.has(key);
      });
    }

    // Search filter (Fuzzy-ish on name, one_liner, problem_solved, language)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (repo) =>
          repo.name.toLowerCase().includes(q) ||
          repo.owner.toLowerCase().includes(q) ||
          repo.one_liner.toLowerCase().includes(q) ||
          repo.problem_solved.toLowerCase().includes(q) ||
          (repo.language && repo.language.toLowerCase().includes(q))
      );
    }

    // Language filter
    if (selectedLang !== "All") {
      result = result.filter((repo) => repo.language === selectedLang);
    }

    // Maturity filter
    if (selectedMaturity !== "All") {
      result = result.filter(
        (repo) => repo.maturity_rating === selectedMaturity
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((repo) => repo.topics.includes(selectedCategory));
    }

    // Sort logic
    result.sort((a, b) => {
      if (sortBy === "velocity") {
        return b.stars_today - a.stars_today;
      } else if (sortBy === "hype") {
        return (
          b.human_vibe_check.hype_vs_reality -
          a.human_vibe_check.hype_vs_reality
        );
      } else if (sortBy === "issues") {
        return b.open_issues - a.open_issues;
      }
      return 0;
    });

    return result;
  }, [
    activeRepos,
    activeDay,
    onlyStreak,
    yesterdayMap,
    todayMap,
    searchQuery,
    selectedLang,
    selectedMaturity,
    selectedCategory,
    sortBy,
  ]);

  const topRepoName =
    todayRepos.length > 0
      ? `${todayRepos[0].owner}/${todayRepos[0].name}`
      : undefined;

  const handleDaySwitch = (day: "today" | "yesterday") => {
    setActiveDay(day);
    setSelectedLang("All");
    setSelectedCategory("All");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Header
        updatedAt={latestUpdate}
        totalRepos={activeRepos.length}
        avgHype={avgHype}
        onSearch={setSearchQuery}
        topRepoName={topRepoName}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Day Switcher Tabs (Today vs Yesterday) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/70 p-3 rounded-xl border border-zinc-800">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleDaySwitch("today")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeDay === "today"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>🔥 มาแรงวันนี้</span>
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeDay === "today"
                    ? "bg-black/20 text-black font-bold"
                    : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {todayRepos.length}
              </span>
            </button>

            <button
              onClick={() => handleDaySwitch("yesterday")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeDay === "yesterday"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>📅 มาแรงเมื่อวาน</span>
              <span
                className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeDay === "yesterday"
                    ? "bg-black/20 text-black font-bold"
                    : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {yesterdayRepos.length}
              </span>
            </button>
          </div>

          {streakCount > 0 && (
            <button
              onClick={() => setOnlyStreak((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                onlyStreak
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-zinc-800/60 border-zinc-700/80 text-zinc-400 hover:text-amber-300 hover:border-amber-500/30"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                🔥 ติดเทรนด์ 2 วันซ้อน ({streakCount})
              </span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">
                Language
              </label>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {languages.map((lang) => (
                  <option key={lang || "unknown"} value={lang || "unknown"}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">
                Maturity
              </label>
              <select
                value={selectedMaturity}
                onChange={(e) => setSelectedMaturity(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {maturities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="velocity">Star Velocity</option>
                <option value="hype">Hype Score</option>
                <option value="issues">Issues</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-zinc-500">
            แสดง{" "}
            <span className="text-emerald-400 font-semibold">
              {filteredRepos.length}
            </span>{" "}
            โปรเจกต์ ({activeDay === "today" ? "วันนี้" : "เมื่อวาน"})
          </div>
        </div>

        {/* Repository List */}
        <div className="space-y-6">
          {filteredRepos.length > 0 ? (
            filteredRepos.map((repo) => {
              const key = `${repo.owner}/${repo.name}`.toLowerCase();
              const yesterdayMatch =
                yesterdayMap.get(repo.id) || yesterdayMap.get(key);
              const todayMatch = todayMap.get(repo.id) || todayMap.get(key);

              const isTwoDayStreak =
                activeDay === "today" && Boolean(yesterdayMatch);
              const starsAddedSinceYesterday =
                isTwoDayStreak && yesterdayMatch
                  ? Math.max(0, repo.stars - yesterdayMatch.stars)
                  : 0;
              const stillTrendingToday =
                activeDay === "yesterday" && Boolean(todayMatch);

              return (
                <RepoCard
                  key={`${activeDay}-${repo.id}`}
                  repo={repo}
                  isTwoDayStreak={isTwoDayStreak}
                  starsAddedSinceYesterday={starsAddedSinceYesterday}
                  isYesterdayView={activeDay === "yesterday"}
                  stillTrendingToday={stillTrendingToday}
                />
              );
            })
          ) : (
            <div className="text-center py-20 text-zinc-500">
              ไม่พบ Repository ที่ตรงกับเงื่อนไขการค้นหา
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

