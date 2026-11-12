"use client";

import { useState, useMemo } from "react";
import reposData from "../data/repos.json";
import { type RepositoryData } from "../types";
import { Header } from "../components/Header";
import { RepoCard } from "../components/RepoCard";

// Cast imported JSON
const allRepos = reposData as RepositoryData[];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("All");
  const [selectedMaturity, setSelectedMaturity] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("velocity");

  // Get latest updated time, fallback to a fixed string if empty to avoid unstable Date during SSG
  const latestUpdate = allRepos.length > 0 ? allRepos[0].updated_at : "2023-11-15T12:00:00Z";
  
  // Calculate average hype
  const avgHype = allRepos.length > 0 
    ? allRepos.reduce((acc, repo) => acc + repo.human_vibe_check.hype_vs_reality, 0) / allRepos.length 
    : 0;

  // Extract unique filters
  const languages = ["All", ...Array.from(new Set(allRepos.map(r => r.language).filter(Boolean)))];
  const maturities = ["All", "Production-Ready", "Experimental", "PoC"];
  const categories = ["All", ...Array.from(new Set(allRepos.flatMap(r => r.topics)))].filter(c => typeof c === 'string' && c.trim() !== '');

  // Filter and sort logic
  const filteredRepos = useMemo(() => {
    let result = allRepos;

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

  // Repos with AI-built MVPs
  const topRepoName = allRepos.length > 0 ? `${allRepos[0].owner}/${allRepos[0].name}` : undefined;

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-emerald-500/30">
      <Header 
        updatedAt={latestUpdate}
        totalRepos={allRepos.length}
        avgHype={avgHype}
        onSearch={setSearchQuery}
        topRepoName={topRepoName}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        
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
              <RepoCard key={repo.id} repo={repo} />
            ))
          ) : (
            <div className="text-center py-20 text-zinc-500">
              No repositories found matching your criteria.
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
