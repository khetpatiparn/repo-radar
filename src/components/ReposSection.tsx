"use client";

import type React from "react";
import {
  Bookmark,
  BookmarkCheck,
  Star,
  ArrowRight,
  Sparkles,
  Flame,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { type RepositoryData } from "../types";

export interface ReposSectionProps {
  repoDay: "today" | "yesterday";
  onChangeRepoDay: (day: "today" | "yesterday") => void;
  todayCount: number;
  yesterdayCount: number;
  repoStreakCount: number;
  onlyRepoStreak: boolean;
  onToggleOnlyRepoStreak: () => void;
  repoLanguages: string[];
  selectedLang: string;
  onChangeLang: (lang: string) => void;
  selectedMaturity: string;
  onChangeMaturity: (maturity: string) => void;
  filteredRepos: RepositoryData[];
  yesterdayRepoMap: Map<string, RepositoryData>;
  savedReposMap: Record<string, RepositoryData>;
  onToggleSaveRepo: (repo: RepositoryData, e?: React.MouseEvent) => void;
  onOpenRepo: (repo: RepositoryData) => void;
}

export function ReposSection({
  repoDay,
  onChangeRepoDay,
  todayCount,
  yesterdayCount,
  repoStreakCount,
  onlyRepoStreak,
  onToggleOnlyRepoStreak,
  repoLanguages,
  selectedLang,
  onChangeLang,
  selectedMaturity,
  onChangeMaturity,
  filteredRepos,
  yesterdayRepoMap,
  savedReposMap,
  onToggleSaveRepo,
  onOpenRepo,
}: ReposSectionProps) {
  return (
    <div className="space-y-8">
      {/* Dusk Repo Filter Bar */}
      <div className="bg-paper-2 border border-rule rounded-[var(--radius-card)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 whitespace-nowrap">
            ฉบับ:
          </span>
          <button
            type="button"
            aria-pressed={repoDay === "today"}
            onClick={() => onChangeRepoDay("today")}
            className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
              repoDay === "today"
                ? "bg-ink text-paper border-ink"
                : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span>มาแรงวันนี้ ({todayCount})</span>
          </button>

          <button
            type="button"
            aria-pressed={repoDay === "yesterday"}
            onClick={() => onChangeRepoDay("yesterday")}
            className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
              repoDay === "yesterday"
                ? "bg-ink text-paper border-ink"
                : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>มาแรงเมื่อวาน ({yesterdayCount})</span>
          </button>

          {repoStreakCount > 0 && repoDay === "today" && (
            <button
              type="button"
              aria-pressed={onlyRepoStreak}
              onClick={onToggleOnlyRepoStreak}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
                onlyRepoStreak
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-paper-3 text-accent-2 border-rule hover:border-accent-2"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>ติดเทรนด์ 2 วันซ้อน ({repoStreakCount})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-editorial-label">
          <label className="flex items-center gap-2">
            <span className="text-muted whitespace-nowrap">ภาษา:</span>
            <select
              value={selectedLang}
              onChange={(e) => onChangeLang(e.target.value)}
              className="min-h-[36px] px-3 py-1 rounded-full border border-rule-2 bg-paper-3 text-ink focus:border-accent"
            >
              {repoLanguages.map((l) => (
                <option key={l || "unknown"} value={l || "unknown"}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-muted whitespace-nowrap">ความพร้อม:</span>
            <select
              value={selectedMaturity}
              onChange={(e) => onChangeMaturity(e.target.value)}
              className="min-h-[36px] px-3 py-1 rounded-full border border-rule-2 bg-paper-3 text-ink focus:border-accent"
            >
              {["All", "Production-Ready", "Experimental", "PoC"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Dusk Repo Cards */}
      {filteredRepos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredRepos.map((repo, idx) => {
            const key = `${repo.owner}/${repo.name}`.toLowerCase();
            const yesterdayMatch =
              yesterdayRepoMap.get(repo.id) || yesterdayRepoMap.get(key);
            const isStreak = repoDay === "today" && Boolean(yesterdayMatch);
            const starDelta =
              isStreak && yesterdayMatch
                ? Math.max(0, repo.stars - yesterdayMatch.stars)
                : 0;
            const isSaved = Boolean(savedReposMap[repo.id]);

            return (
              <article
                key={`${repoDay}-${repo.id}`}
                onClick={() => onOpenRepo(repo)}
                className="group cursor-pointer bg-paper-2 border border-rule hover:border-accent hover:bg-paper-3 rounded-[var(--radius-card)] transition-colors duration-[var(--dur-micro)] p-5 sm:p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-editorial-display text-lg sm:text-xl text-ink leading-snug group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                      <span className="font-editorial-display text-base text-accent mr-2 num">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {repo.one_liner}
                    </h3>
                    <button
                      type="button"
                      aria-pressed={isSaved}
                      onClick={(e) => onToggleSaveRepo(repo, e)}
                      className="p-1.5 rounded-full border border-transparent hover:border-rule-2 text-muted hover:text-ink cursor-pointer shrink-0"
                      title="คั่นหน้าโปรเจกต์นี้"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-accent" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-editorial-label">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="font-medium text-ink truncate">
                        {repo.owner}/{repo.name}
                      </span>
                      {repo.language && (
                        <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2 whitespace-nowrap">
                          {repo.language}
                        </span>
                      )}
                      {isStreak && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-accent-2 whitespace-nowrap">
                          <Flame className="w-3 h-3 shrink-0" />
                          <span>
                            ติดเทรนด์ 2 วันซ้อน
                            {starDelta > 0
                              ? ` (+${starDelta.toLocaleString()} ดาว)`
                              : ""}
                          </span>
                        </span>
                      )}
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-accent-2 inline-flex items-center gap-1 num shrink-0">
                      <Star className="w-3 h-3 shrink-0" />
                      <span>
                        {(repo.stars / 1000).toFixed(1)}k (+
                        {repo.stars_today.toLocaleString()})
                      </span>
                    </span>
                  </div>

                  <p className="text-sm font-editorial-body text-ink-2 line-clamp-2 leading-relaxed">
                    {repo.problem_solved}
                  </p>

                  <div className="p-3.5 rounded-[var(--radius-inner)] bg-paper border border-rule text-xs font-editorial-body">
                    <div className="inline-flex items-center gap-1.5 font-editorial-label text-accent mb-1">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                      <span>ไอเดียต่อยอด SaaS:</span>
                    </div>
                    <p className="text-ink-2 line-clamp-1">
                      {repo.ai_opportunity.monetization_idea}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-rule flex items-center justify-between gap-2 text-xs font-editorial-label">
                  <div className="flex items-center gap-3 text-muted min-w-0">
                    <span className="truncate">
                      ความพร้อม:{" "}
                      <strong className="text-ink font-medium">
                        {repo.maturity_rating}
                      </strong>
                    </span>
                    <span className="border-l border-rule pl-3 whitespace-nowrap num">
                      Hype {repo.human_vibe_check.hype_vs_reality}/10
                    </span>
                  </div>
                  <span className="text-accent group-hover:text-accent-hi font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                    <span>อ่านบทวิเคราะห์</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-12 sm:p-16 text-center bg-paper-2 border border-rule rounded-[var(--radius-card)] text-muted text-sm font-editorial-body">
          ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขการค้นหา
        </div>
      )}
    </div>
  );
}
