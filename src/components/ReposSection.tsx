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
  Code2,
  CheckCheck,
} from "lucide-react";
import { type RepositoryData } from "../types";
import type { FreshnessInfo } from "../lib/freshness";
import { FreshnessBadge } from "./FreshnessBadge";

export interface ReposSectionProps {
  repoDay: "today" | "yesterday";
  onChangeRepoDay: (day: "today" | "yesterday") => void;
  todayCount: number;
  yesterdayCount: number;
  repoStreakCount: number;
  onlyRepoStreak: boolean;
  onToggleOnlyRepoStreak: () => void;
  onlyNewToday: boolean;
  onToggleOnlyNewToday: () => void;
  newReposCount: number;
  unreadNewReposCount: number;
  onMarkAllReposRead?: () => void;
  getRepoFreshness?: (repo: RepositoryData) => FreshnessInfo;
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
  onlyNewToday,
  onToggleOnlyNewToday,
  newReposCount,
  unreadNewReposCount,
  onMarkAllReposRead,
  getRepoFreshness,
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
  const leadRepo = filteredRepos[0];
  const restRepos = filteredRepos.slice(1);

  return (
    <div className="space-y-8">
      {/* Borderless Editorial Repo Filter Ribbon */}
      <div className="border-b border-rule pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full bg-paper-2 border border-rule p-0.5">
            <button
              type="button"
              aria-pressed={repoDay === "today"}
              onClick={() => onChangeRepoDay("today")}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
                repoDay === "today"
                  ? "bg-ink text-paper font-semibold"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>มาแรงวันนี้ ({todayCount})</span>
            </button>

            <button
              type="button"
              aria-pressed={repoDay === "yesterday"}
              onClick={() => onChangeRepoDay("yesterday")}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
                repoDay === "yesterday"
                  ? "bg-ink text-paper font-semibold"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>มาแรงเมื่อวาน ({yesterdayCount})</span>
            </button>
          </div>

          {newReposCount > 0 && repoDay === "today" && (
            <button
              type="button"
              aria-pressed={onlyNewToday}
              onClick={onToggleOnlyNewToday}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
                onlyNewToday
                  ? "bg-accent text-accent-ink border-accent shadow-[var(--shadow-ember-glow)]"
                  : "bg-accent-soft text-accent-2 border-accent/45 hover:border-accent-hi"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>เฉพาะรายการมาใหม่ ({newReposCount})</span>
            </button>
          )}

          {repoStreakCount > 0 && repoDay === "today" && (
            <button
              type="button"
              aria-pressed={onlyRepoStreak}
              onClick={onToggleOnlyRepoStreak}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] whitespace-nowrap cursor-pointer ${
                onlyRepoStreak
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-paper-2 text-accent-2 border-rule hover:border-accent-2"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
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
              className="min-h-[34px] px-3 py-1 rounded-full border border-rule-2 bg-paper-2 text-ink focus:border-accent-hi"
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
              className="min-h-[34px] px-3 py-1 rounded-full border border-rule-2 bg-paper-2 text-ink focus:border-accent-hi"
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

      {filteredRepos.length > 0 ? (
        <>
          {/* #1 TRENDING REPO SPOTLIGHT BANNER */}
          {leadRepo &&
            (() => {
              const isSaved = Boolean(savedReposMap[leadRepo.id]);
              const freshness = getRepoFreshness?.(leadRepo);
              const key = `${leadRepo.owner}/${leadRepo.name}`.toLowerCase();
              const isStreak =
                repoDay === "today" &&
                Boolean(yesterdayRepoMap.get(leadRepo.id) || yesterdayRepoMap.get(key));

              return (
                <article
                  onClick={() => onOpenRepo(leadRepo)}
                  className="ember-hero-stage group cursor-pointer p-6 sm:p-8 lg:p-9"
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-[3px] grad-ember-ribbon"
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    <div className="lg:col-span-8 space-y-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                        <span className="text-accent-2 font-semibold uppercase tracking-wider">
                          #01 GitHub Spotlight
                        </span>
                        <span className="text-rule-2" aria-hidden="true">
                          /
                        </span>
                        <span className="font-mono text-ink">
                          {leadRepo.owner}/{leadRepo.name}
                        </span>
                        <FreshnessBadge info={freshness} />
                        {isStreak && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn-soft border border-warn/30 text-[11px] text-warn">
                            <Flame className="w-3 h-3 shrink-0" />
                            <span>ติดเทรนด์ 2 วันซ้อน</span>
                          </span>
                        )}
                      </div>

                      <h2 className="font-editorial-display text-2xl sm:text-3xl lg:text-[2.25rem] text-ink leading-[1.18] max-w-none group-hover:text-accent-2 transition-colors">
                        {leadRepo.one_liner}
                      </h2>

                      <p className="text-base font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[68ch]">
                        {leadRepo.problem_solved}
                      </p>

                      <div className="pl-3.5 border-l-2 border-accent text-sm font-editorial-body text-ink-2 line-clamp-2">
                        <span className="text-accent-2 font-editorial-label mr-1.5">
                          ไอเดียต่อยอด SaaS:
                        </span>
                        {leadRepo.ai_opportunity.monetization_idea}
                      </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col justify-between gap-5 lg:border-l lg:border-rule lg:pl-7">
                      <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <div className="text-xs font-editorial-label text-muted">
                              ดาวพุ่งวันนี้
                            </div>
                            <div className="font-editorial-display text-3xl sm:text-4xl text-accent-2 num leading-none mt-1">
                              +{leadRepo.stars_today.toLocaleString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSaveRepo(leadRepo, e)}
                            className={`relative z-10 inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer ${
                              isSaved
                                ? "bg-accent text-white border-accent"
                                : "bg-paper-3 text-ink-2 border-rule hover:text-ink hover:border-accent-hi"
                            }`}
                            title="คั่นหน้าโปรเจกต์นี้"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 shrink-0" />
                            ) : (
                              <Bookmark className="w-4 h-4 shrink-0" />
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-rule text-xs font-editorial-label">
                          <div>
                            <div className="text-muted">ดาวสะสม</div>
                            <div className="text-ink font-semibold num mt-0.5">
                              {leadRepo.stars.toLocaleString()} ★
                            </div>
                          </div>
                          <div>
                            <div className="text-muted">ความพร้อม</div>
                            <div className="text-ink font-semibold mt-0.5">
                              {leadRepo.maturity_rating}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="dusk-pill-primary inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap">
                        <span>อ่านบทวิเคราะห์เจาะลึก</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })()}

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                aria-hidden="true"
                className="w-1 h-6 rounded-full grad-brand shrink-0"
              />
              <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                คอลัมน์โอเพนซอร์สมาแรง ({filteredRepos.length} โปรเจกต์)
              </h3>
              {unreadNewReposCount > 0 && onMarkAllReposRead && (
                <button
                  type="button"
                  onClick={onMarkAllReposRead}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-2 border border-rule text-xs font-editorial-label text-ink-2 hover:text-ink hover:border-accent-hi transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                  <span>ทำเครื่องหมายว่าอ่านแล้ว ({unreadNewReposCount})</span>
                </button>
              )}
            </div>
            <span className="text-xs font-editorial-label text-muted">
              เรียงตามความเร็วการพุ่งของดาวในวันนี้ (+Stars Today)
            </span>
          </div>

          {/* Clean 3-Column Editorial Repo Grid */}
          {restRepos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restRepos.map((repo) => {
                const key = `${repo.owner}/${repo.name}`.toLowerCase();
                const yesterdayMatch =
                  yesterdayRepoMap.get(repo.id) || yesterdayRepoMap.get(key);
                const isStreak = repoDay === "today" && Boolean(yesterdayMatch);
                const starDelta =
                  isStreak && yesterdayMatch
                    ? Math.max(0, repo.stars - yesterdayMatch.stars)
                    : 0;
                const isSaved = Boolean(savedReposMap[repo.id]);
                const freshness = getRepoFreshness?.(repo);

                return (
                  <article
                    key={`${repoDay}-${repo.id}`}
                    onClick={() => onOpenRepo(repo)}
                    className={`blog-card blog-card-deferred group cursor-pointer p-5 flex flex-col justify-between gap-4 ${
                      freshness?.isUnreadNew ? "blog-card-new" : ""
                    }`}
                  >
                    {freshness?.isUnreadNew && (
                      <div
                        aria-hidden="true"
                        className="absolute top-0 inset-x-0 h-[2px] grad-ember-ribbon"
                      />
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Code2 className="w-4 h-4 text-accent-hi shrink-0" />
                          <span className="font-mono text-xs text-ink font-medium truncate">
                            {repo.owner}/{repo.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft border border-accent/35 text-[11px] font-editorial-label text-accent-2 font-semibold num">
                            <Star className="w-3 h-3 shrink-0 fill-current" />
                            <span>+{repo.stars_today.toLocaleString()}</span>
                          </span>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSaveRepo(repo, e)}
                            className="relative z-10 p-1 rounded-full text-muted hover:text-ink cursor-pointer"
                            title="คั่นหน้าโปรเจกต์นี้"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-accent-hi" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-editorial-label">
                        {repo.language && (
                          <span className="text-accent-2 font-semibold">
                            {repo.language}
                          </span>
                        )}
                        <FreshnessBadge info={freshness} compact />
                        {isStreak && (
                          <span className="inline-flex items-center gap-1 text-warn">
                            <Flame className="w-3 h-3 shrink-0" />
                            <span>
                              2 วันซ้อน
                              {starDelta > 0
                                ? ` (+${starDelta.toLocaleString()})`
                                : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-editorial-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-accent-2 transition-colors">
                        {repo.one_liner}
                      </h4>

                      <p className="text-sm font-editorial-body text-ink-2 line-clamp-2 leading-relaxed">
                        {repo.problem_solved}
                      </p>

                      <p className="pl-3 border-l-2 border-rule-2 group-hover:border-accent text-xs font-editorial-body text-muted line-clamp-2 transition-colors">
                        {repo.ai_opportunity.monetization_idea}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-rule/80 flex items-center justify-between gap-2 text-xs font-editorial-label">
                      <div className="flex items-center gap-2.5 text-muted min-w-0">
                        <span className="text-ink-2 font-medium truncate">
                          {repo.maturity_rating}
                        </span>
                        <span className="num shrink-0">
                          {(repo.stars / 1000).toFixed(1)}k ★
                        </span>
                      </div>
                      <span className="text-ink-2 group-hover:text-accent-2 font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors">
                        <span>อ่านบทวิเคราะห์</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="p-12 sm:p-16 text-center bg-paper-2 border border-rule rounded-[var(--radius-card)] text-muted text-sm font-editorial-body">
          ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขการค้นหา
        </div>
      )}
    </div>
  );
}
