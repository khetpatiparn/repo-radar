"use client";

import { useState, useMemo } from "react";
import reposData from "../data/repos.json";
import { type RepositoryData } from "../types";
import { Header } from "../components/Header";
import { RepoCard } from "../components/RepoCard";
import { Sparkles, ExternalLink, X, Rocket } from "lucide-react";

// Cast imported JSON
const allRepos = reposData as RepositoryData[];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedMaturity, setSelectedMaturity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("velocity");
  const [activeMvpRepo, setActiveMvpRepo] = useState<RepositoryData | null>(null);

  // Get latest updated time, fallback to a fixed string if empty to avoid unstable Date during SSG
  const latestUpdate = allRepos.length > 0 ? allRepos[0].updated_at : "2023-11-15T12:00:00Z";
  
  // Calculate average hype
  const avgHype = allRepos.length > 0 
    ? allRepos.reduce((acc, repo) => acc + repo.human_vibe_check.hype_vs_reality, 0) / allRepos.length 
    : 0;

  // Repos with AI-built MVPs
  const mvpRepos = useMemo(() => allRepos.filter((r) => Boolean(r.mvp)), []);

  // Extract unique filters
  const languages = ["All", ...Array.from(new Set(allRepos.map(r => r.language).filter(Boolean)))];
  const maturities = ["All", "Production-Ready", "Experimental", "PoC"];
  const categories = ["All", ...Array.from(new Set(allRepos.flatMap(r => r.topics)))].filter(c => typeof c === 'string' && c.trim() !== '');

  // Filter and sort logic
  const filteredRepos = useMemo(() => {
    let result = [...allRepos];

    // Search filter (Fuzzy-ish on name, one_liner, problem_solved, language)
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(repo => 
        repo.name.toLowerCase().includes(q) || 
        repo.one_liner.toLowerCase().includes(q) ||
        repo.problem_solved.toLowerCase().includes(q) ||
        (repo.language && repo.language.toLowerCase().includes(q))
      );
    }

    // Language filter
    if (selectedLang !== "All") {
      result = result.filter(repo => repo.language === selectedLang);
    }

    // Maturity filter
    if (selectedMaturity !== "All") {
      result = result.filter(repo => repo.maturity_rating === selectedMaturity);
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(repo => repo.topics.includes(selectedCategory));
    }

    // Sort logic
    result.sort((a, b) => {
      if (sortBy === "velocity") {
        return b.stars_today - a.stars_today;
      } else if (sortBy === "hype") {
        return b.human_vibe_check.hype_vs_reality - a.human_vibe_check.hype_vs_reality;
      } else if (sortBy === "issues") {
        return b.open_issues - a.open_issues;
      }
      return 0;
    });

    return result;
  }, [searchQuery, selectedLang, selectedMaturity, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Header 
        updatedAt={latestUpdate}
        totalRepos={allRepos.length}
        avgHype={avgHype}
        onSearch={setSearchQuery}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Daily AI-Built MVP Showcase */}
        {mvpRepos.length > 0 && (
          <section className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-zinc-900/90 to-zinc-900 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Autonomous Daily MVP Lab
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                      Auto-Built & Deployed
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    โปรเจกต์ Micro-SaaS ต้นแบบที่ AI หยิบจาก Trending Repo มาเขียนโค้ดและ Deploy อัตโนมัติให้พร้อมลองเล่นทันที
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mvpRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 p-4 flex flex-col justify-between gap-3 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono text-emerald-400 truncate">
                        {repo.owner}/{repo.name}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        +{repo.stars_today}/d
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      {repo.mvp?.app_name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {repo.mvp?.tagline}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={() => setActiveMvpRepo(repo)}
                      className="flex-1 py-1.5 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors cursor-pointer"
                    >
                      ✨ เปิดเล่นในหน้านี้
                    </button>
                    <a
                      href={repo.mvp?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-2.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1"
                      title="เปิดเต็มจอในแท็บใหม่"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      เต็มจอ
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Language</label>
              <select 
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {languages.map(lang => <option key={lang || "unknown"} value={lang || "unknown"}>{lang}</option>)}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Maturity</label>
              <select 
                value={selectedMaturity}
                onChange={(e) => setSelectedMaturity(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {maturities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Category</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Sort By</label>
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
            Showing <span className="text-emerald-400 font-semibold">{filteredRepos.length}</span> repositories
          </div>
        </div>

        {/* Repository List */}
        <div className="space-y-6">
          {filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <RepoCard key={repo.id} repo={repo} onOpenMvp={setActiveMvpRepo} />
            ))
          ) : (
            <div className="text-center py-20 text-zinc-500">
              No repositories found matching your criteria.
            </div>
          )}
        </div>

      </main>

      {/* Live MVP Interactive Modal */}
      {activeMvpRepo && activeMvpRepo.mvp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0">
                  🚀 Live MVP
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {activeMvpRepo.mvp.app_name}{" "}
                    <span className="text-xs font-normal text-zinc-400">
                      (ต่อยอดจาก {activeMvpRepo.owner}/{activeMvpRepo.name})
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 truncate">{activeMvpRepo.mvp.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeMvpRepo.mvp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดแท็บใหม่
                </a>
                <button
                  onClick={() => setActiveMvpRepo(null)}
                  className="p-1.5 rounded-md bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-300 border border-zinc-700 cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-950 relative">
              <iframe
                src={activeMvpRepo.mvp.url}
                title={activeMvpRepo.mvp.app_name}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
