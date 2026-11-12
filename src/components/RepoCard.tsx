"use client";

import { useState } from "react";
import { type RepositoryData } from "../types";
import { ExternalLink, MessageSquare, AlertTriangle, Lightbulb, Zap, Star, Copy, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface RepoCardProps {
  repo: RepositoryData;
  isTwoDayStreak?: boolean;
  starsAddedSinceYesterday?: number;
  isYesterdayView?: boolean;
  stillTrendingToday?: boolean;
}

export function RepoCard({
  repo,
  isTwoDayStreak = false,
  starsAddedSinceYesterday = 0,
  isYesterdayView = false,
  stillTrendingToday = false,
}: RepoCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(repo.quick_start);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMaturityColor = (rating: string) => {
    switch (rating) {
      case "Production-Ready": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Experimental": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PoC": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className={cn(
      "bg-zinc-900 border rounded-xl overflow-hidden shadow-lg transition-all",
      isTwoDayStreak
        ? "border-amber-500/40 hover:border-amber-400/60"
        : "border-zinc-800 hover:border-zinc-700"
    )}>
      {/* Header Section */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-start gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-zinc-100 truncate hover:text-emerald-400 transition-colors">
              <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                {repo.owner}/{repo.name}
              </a>
            </h2>
            {isTwoDayStreak && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                🔥 ติดเทรนด์ 2 วันซ้อน
              </span>
            )}
            {isYesterdayView && stillTrendingToday && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                📈 วันนี้ก็ยังติดเทรนด์
              </span>
            )}
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", getMaturityColor(repo.maturity_rating))}>
              {repo.maturity_rating}
            </span>
            {repo.language && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {repo.language}
              </span>
            )}
          </div>
          <p className="text-lg font-semibold text-zinc-300 leading-snug">
            {repo.one_liner}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 text-zinc-300 font-semibold bg-zinc-800 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {(repo.stars / 1000).toFixed(1)}k
          </div>
          <span className="text-xs text-emerald-400 mt-1 font-medium">
            +{repo.stars_today.toLocaleString()} {isYesterdayView ? "เมื่อวาน" : "วันนี้"}
          </span>
          {isTwoDayStreak && (
            <span className="text-[11px] text-amber-300 mt-1 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {starsAddedSinceYesterday > 0
                ? `▲ +${starsAddedSinceYesterday.toLocaleString()} ดาวจากเมื่อวาน`
                : `▲ ฮิตต่อเนื่องจากเมื่อวาน`}
            </span>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800">
        
        {/* Column 1: AI Strategic Vision */}
        <div className="bg-zinc-900 p-6 space-y-5">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-3">
            <span className="text-xl">🤖</span> AI Strategic Vision
          </div>
          
          <div>
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Problem Solved</h4>
            <p className="text-sm text-zinc-300">{repo.problem_solved}</p>
          </div>
          
          <div>
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Alternative Comparison</h4>
            <p className="text-sm text-zinc-300 italic">"{repo.alternative_comparison}"</p>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-4 mt-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-2">
              <Lightbulb className="w-4 h-4" /> 
              Monetization / Micro-SaaS Idea
            </h4>
            <p className="text-sm text-zinc-300">{repo.ai_opportunity.monetization_idea}</p>
            <div className="mt-2 pt-2 border-t border-emerald-900/30">
               <span className="text-xs text-emerald-500/80 font-semibold uppercase">Stack Synergy: </span>
               <span className="text-sm text-zinc-400">{repo.ai_opportunity.stack_synergy}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Real Human Vibe Check */}
        <div className="bg-zinc-900 p-6 space-y-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold">
              <span className="text-xl">👥</span> Real Human Vibe Check
            </div>
            <div className="flex items-center gap-2 text-xs font-medium bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
              <span className="text-zinc-400">Hype/Reality:</span>
              <span className={cn(
                "font-bold",
                repo.human_vibe_check.hype_vs_reality >= 8 ? "text-emerald-400" : 
                repo.human_vibe_check.hype_vs_reality >= 5 ? "text-yellow-400" : "text-red-400"
              )}>
                {repo.human_vibe_check.hype_vs_reality}/10
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                👍 What People Love
              </h4>
              <ul className="space-y-1">
                {repo.human_vibe_check.pros.map((pro, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                ⚠️ Gotchas & Traps
              </h4>
              <ul className="space-y-1">
                {repo.human_vibe_check.gotchas_and_traps.map((gotcha, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                    <span>{gotcha}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Section */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3 flex items-center bg-black border border-zinc-800 rounded-md overflow-hidden">
          <div className="p-2 bg-zinc-900 border-r border-zinc-800 text-zinc-500">
            <Zap className="w-4 h-4" />
          </div>
          <code className="text-xs text-zinc-300 px-3 py-2 flex-1 font-mono whitespace-pre-wrap overflow-x-auto">
            {repo.quick_start}
          </code>
          <button 
            onClick={copyToClipboard}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border-l border-zinc-800"
            title="Copy snippet"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <a href={`${repo.url}/issues`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-md transition-colors border border-zinc-700">
            <MessageSquare className="w-4 h-4" /> Issues
          </a>
          <a href={`https://hn.algolia.com/?q=${encodeURIComponent(repo.name)}`} target="_blank" rel="noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#ff6600]/10 hover:bg-[#ff6600]/20 text-[#ff6600] text-sm font-medium rounded-md transition-colors border border-[#ff6600]/30">
            <ExternalLink className="w-4 h-4" /> HN Search
          </a>
        </div>
      </div>
    </div>
  );
}
