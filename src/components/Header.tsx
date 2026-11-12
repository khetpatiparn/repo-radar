import { Search, Radar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  updatedAt: string;
  totalRepos: number;
  avgHype: number;
  onSearch: (query: string) => void;
}

import { useState, useEffect } from "react";

export function Header({ updatedAt, totalRepos, avgHype, onSearch }: HeaderProps) {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    if (updatedAt) {
      setRelativeTime(formatDistanceToNow(new Date(updatedAt), { addSuffix: true }));
    }
  }, [updatedAt]);

  return (
    <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 text-zinc-100 py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RepoRadar Logo" className="w-9 h-9 rounded-lg shadow-md shrink-0" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">RepoRadar <span className="text-zinc-500 font-normal">// GitHub Trending Intelligence</span></h1>
          <p className="text-xs text-zinc-400">อัปเดตล่าสุดเมื่อ {relativeTime}</p>
        </div>
      </div>

      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-800 text-zinc-300 placeholder-zinc-400 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          placeholder="ค้นหา repo, ภาษา, หรือปัญหา..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-zinc-400 text-xs">Repos</span>
          <span className="font-semibold text-emerald-400">{totalRepos}</span>
        </div>
        <div className="h-8 border-l border-zinc-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-zinc-400 text-xs">Avg Hype</span>
          <span className="font-semibold text-emerald-400">{avgHype.toFixed(1)}/10</span>
        </div>
      </div>
    </header>
  );
}
