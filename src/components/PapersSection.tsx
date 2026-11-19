"use client";

import type React from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  ThumbsUp,
  ArrowRight,
  Code2,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Building2,
  Flame,
  Calendar,
  CalendarRange,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { PAPER_CATEGORIES, type PaperData } from "../types";
import type { FreshnessInfo } from "../lib/freshness";
import { FreshnessBadge, BlogCoverMedia } from "./FreshnessBadge";

export interface PapersSectionProps {
  paperEdition: "today" | "yesterday" | "all7";
  onChangeEdition: (edition: "today" | "yesterday" | "all7") => void;
  todayCount: number;
  yesterdayCount: number;
  all7Count: number;
  activePoolCount: number;
  onlyWithCode: boolean;
  onToggleOnlyWithCode: () => void;
  onlyNewToday: boolean;
  onToggleOnlyNewToday: () => void;
  newPapersInPoolCount: number;
  unreadNewPapersCount: number;
  onMarkAllPapersRead?: () => void;
  getPaperFreshness?: (paper: PaperData) => FreshnessInfo;
  viewMode: "cards" | "compact";
  onChangeViewMode: (mode: "cards" | "compact") => void;
  selectedCategory: string;
  onChangeCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  filteredPapers: PaperData[];
  pagedPapers: PaperData[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  savedPapersMap: Record<string, PaperData>;
  onToggleSavePaper: (paper: PaperData, e?: React.MouseEvent) => void;
  onOpenPaper: (paper: PaperData) => void;
}

export function PapersSection({
  paperEdition,
  onChangeEdition,
  todayCount,
  yesterdayCount,
  all7Count,
  activePoolCount,
  onlyWithCode,
  onToggleOnlyWithCode,
  onlyNewToday,
  onToggleOnlyNewToday,
  newPapersInPoolCount,
  unreadNewPapersCount,
  onMarkAllPapersRead,
  getPaperFreshness,
  viewMode,
  onChangeViewMode,
  selectedCategory,
  onChangeCategory,
  categoryCounts,
  filteredPapers,
  pagedPapers,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  savedPapersMap,
  onToggleSavePaper,
  onOpenPaper,
}: PapersSectionProps) {
  const showAsymmetricHero = currentPage === 1 && viewMode === "cards" && filteredPapers.length > 0;
  const hasBriefingRail = showAsymmetricHero && filteredPapers.length >= 4;
  const railPapers = hasBriefingRail ? filteredPapers.slice(1, 4) : [];
  const gridPapers =
    currentPage === 1
      ? hasBriefingRail
        ? filteredPapers.slice(4, itemsPerPage)
        : filteredPapers.slice(1, itemsPerPage)
      : pagedPapers;

  return (
    <div className="space-y-8">
      {/* Borderless Editorial Filter Ribbon */}
      <div className="border-b border-rule pb-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Edition Controls */}
          <div className="flex items-center gap-1.5 rail-fade py-0.5">
            <div className="inline-flex items-center rounded-full bg-paper-2 border border-rule p-0.5">
              <button
                type="button"
                aria-pressed={paperEdition === "today"}
                onClick={() => onChangeEdition("today")}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  paperEdition === "today"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>วันนี้ ({todayCount})</span>
              </button>

              <button
                type="button"
                aria-pressed={paperEdition === "yesterday"}
                onClick={() => onChangeEdition("yesterday")}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  paperEdition === "yesterday"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>เมื่อวาน ({yesterdayCount})</span>
              </button>

              <button
                type="button"
                aria-pressed={paperEdition === "all7"}
                onClick={() => onChangeEdition("all7")}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  paperEdition === "all7"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 shrink-0" />
                <span>รวมย้อนหลัง ({all7Count})</span>
              </button>
            </div>
          </div>

          {/* Right Quick Filters + View Switcher */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {newPapersInPoolCount > 0 && (
              <button
                type="button"
                aria-pressed={onlyNewToday}
                onClick={onToggleOnlyNewToday}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  onlyNewToday
                    ? "bg-accent text-accent-ink border-accent shadow-[var(--shadow-ember-glow)]"
                    : "bg-accent-soft text-accent-2 border-accent/45 hover:border-accent-hi"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>เฉพาะรายการมาใหม่ ({newPapersInPoolCount})</span>
              </button>
            )}

            <button
              type="button"
              aria-pressed={onlyWithCode}
              onClick={onToggleOnlyWithCode}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                onlyWithCode
                  ? "bg-ink text-paper border-ink font-semibold"
                  : "bg-paper-2 text-ink-2 border-rule hover:border-accent-hi hover:text-ink"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span>มีโค้ด GitHub</span>
            </button>

            <div className="flex items-center rounded-full border border-rule bg-paper-2 p-0.5 text-xs font-editorial-label">
              <button
                type="button"
                aria-pressed={viewMode === "cards"}
                onClick={() => onChangeViewMode("cards")}
                className={`inline-flex items-center gap-1.5 min-h-[30px] px-3 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "cards"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink-2 hover:text-ink"
                }`}
                title="มุมมองการ์ดข่าว (รูปภาพและไฮไลต์)"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">การ์ด</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "compact"}
                onClick={() => onChangeViewMode("compact")}
                className={`inline-flex items-center gap-1.5 min-h-[30px] px-3 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "compact"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink-2 hover:text-ink"
                }`}
                title="มุมมองสารบัญด่วน (กะทัดรัด ไม่ต้องเลื่อนเยอะ)"
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">สารบัญด่วน</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Scrollable Category Tabs */}
        <div className="flex items-center gap-1.5 rail-fade py-0.5">
          <button
            type="button"
            aria-pressed={selectedCategory === "All"}
            onClick={() => onChangeCategory("All")}
            className={`min-h-[32px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCategory === "All"
                ? "bg-accent text-accent-ink border-accent font-semibold"
                : "bg-transparent text-muted border-rule hover:border-rule-2 hover:text-ink"
            }`}
          >
            ทั้งหมด ({activePoolCount})
          </button>
          {PAPER_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={selectedCategory === cat}
                onClick={() => onChangeCategory(cat)}
                className={`min-h-[32px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-ink border-accent font-semibold"
                    : "bg-transparent text-muted border-rule hover:border-rule-2 hover:text-ink"
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
          {/* ============================================================
           * EDITORIAL MAGAZINE ASYMMETRIC FRONT PAGE (8-col Hero + 4-col Rail)
           * ============================================================ */}
          {showAsymmetricHero &&
            (() => {
              const lead = filteredPapers[0];
              const isSaved = Boolean(savedPapersMap[lead.id]);
              const freshness = getPaperFreshness?.(lead);

              return (
                <section
                  aria-label="เรื่องเด่นประจำฉบับ"
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
                >
                  {/* Left 8-Col Flagship Cover Feature */}
                  <article
                    onClick={() => onOpenPaper(lead)}
                    className={`${
                      hasBriefingRail ? "lg:col-span-8" : "lg:col-span-12"
                    } ember-hero-stage group cursor-pointer flex flex-col justify-between`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute top-0 inset-x-0 h-[3px] grad-ember-ribbon z-20"
                    />

                    {/* Edge-to-Edge 16:9 Cover Media */}
                    <BlogCoverMedia
                      src={lead.thumbnail_url}
                      alt={lead.title}
                      category={lead.category}
                      sublabel={`arXiv:${lead.id}`}
                      fit="contain"
                      aspect="16/9"
                      edgeToEdge
                      priority
                      isNew={Boolean(freshness?.isUnreadNew)}
                      topRightAction={
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSavePaper(lead, e)}
                          className={`relative z-10 inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors cursor-pointer ${
                            isSaved
                              ? "bg-accent text-white border-accent"
                              : "bg-black/75 text-white border-white/20 hover:border-accent-hi"
                          }`}
                          title="คั่นหน้าบทความนี้"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 shrink-0" />
                          ) : (
                            <Bookmark className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      }
                    />

                    {/* Editorial Copy Area */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between gap-5">
                      <div className="space-y-3.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                          <span className="text-accent-2 font-semibold uppercase tracking-wider">
                            {lead.category}
                          </span>
                          <span className="text-rule-2" aria-hidden="true">
                            /
                          </span>
                          <span className="text-muted">เรื่องเด่นประจำฉบับ</span>
                          <FreshnessBadge info={freshness} />
                        </div>

                        <h2 className="font-editorial-display text-2xl sm:text-3xl lg:text-[2.2rem] text-ink leading-[1.18] max-w-none group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)]">
                          {lead.hook_headline}
                        </h2>

                        <p className="text-sm font-editorial-body text-muted line-clamp-1">
                          &ldquo;{lead.title}&rdquo;
                        </p>

                        <p className="text-base font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[68ch]">
                          {lead.short_teaser}
                        </p>

                        {lead.tldr_takeaways[0] && (
                          <div className="pl-3.5 border-l-2 border-accent text-sm font-editorial-body text-ink-2 line-clamp-2">
                            {lead.tldr_takeaways[0]}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-rule flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs font-editorial-label text-muted">
                          {lead.organization && (
                            <span className="inline-flex items-center gap-1 text-ink-2">
                              <Building2 className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                              <span>{lead.organization}</span>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-accent-2 font-semibold num">
                            <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                            <span>{lead.upvotes}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 num">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{lead.reading_time_minutes} นาที</span>
                          </span>
                          {lead.github_url && (
                            <span className="inline-flex items-center gap-1 text-ink-2">
                              <Code2 className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                              <span>GitHub</span>
                            </span>
                          )}
                        </div>

                        <div className="dusk-pill-primary inline-flex items-center gap-2 min-h-[40px] px-5 py-2 text-xs sm:text-sm font-editorial-label whitespace-nowrap">
                          <span>กดอ่านบทความเจาะลึก</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* Right 4-Col Editors' Briefing Rail (Stories 02-04) */}
                  {hasBriefingRail && (
                    <aside className="lg:col-span-4 editorial-rail flex flex-col overflow-hidden">
                      <div className="px-5 py-4 border-b border-rule flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full bg-accent-hi"
                            aria-hidden="true"
                          />
                          <h3 className="font-editorial-display text-sm uppercase tracking-wider text-ink">
                            จับตาต่อจากเรื่องเด่น
                          </h3>
                        </div>
                        <span className="text-[11px] font-editorial-label text-muted num">
                          02 — 04
                        </span>
                      </div>

                      <div className="divide-y divide-rule flex-1 flex flex-col justify-between">
                        {railPapers.map((paper, idx) => {
                          const railSaved = Boolean(savedPapersMap[paper.id]);
                          const railFreshness = getPaperFreshness?.(paper);
                          return (
                            <article
                              key={paper.id}
                              onClick={() => onOpenPaper(paper)}
                              className="group cursor-pointer p-5 hover:bg-paper-3/65 transition-colors flex flex-col justify-between gap-3 flex-1"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2 text-[11px] font-editorial-label">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-accent-hi font-semibold num">
                                      {String(idx + 2).padStart(2, "0")}
                                    </span>
                                    <span className="text-accent-2 truncate">
                                      {paper.category}
                                    </span>
                                    {railFreshness?.isUnreadNew && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent-hi shrink-0" />
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    aria-pressed={railSaved}
                                    onClick={(e) => onToggleSavePaper(paper, e)}
                                    className="relative z-10 p-1 rounded-full text-muted hover:text-ink cursor-pointer shrink-0"
                                    title="คั่นหน้าบทความนี้"
                                  >
                                    {railSaved ? (
                                      <BookmarkCheck className="w-3.5 h-3.5 text-accent-hi" />
                                    ) : (
                                      <Bookmark className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>

                                <h4 className="font-editorial-display text-base text-ink leading-snug line-clamp-2 group-hover:text-accent-2 transition-colors">
                                  {paper.hook_headline}
                                </h4>

                                <p className="text-xs font-editorial-body text-muted line-clamp-2 leading-relaxed">
                                  {paper.short_teaser}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-editorial-label text-muted">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-accent-2 inline-flex items-center gap-1 num">
                                    <ThumbsUp className="w-3 h-3 shrink-0" />
                                    <span>{paper.upvotes}</span>
                                  </span>
                                  <span className="num">
                                    {paper.reading_time_minutes} นาที
                                  </span>
                                  {railFreshness?.isDelayedArrival && (
                                    <span className="text-accent-2">
                                      เพิ่งดึงเข้าวันนี้
                                    </span>
                                  )}
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent-2 group-hover:translate-x-0.5 transition-transform shrink-0" />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </aside>
                  )}
                </section>
              );
            })()}

          {/* ============================================================
           * VIEW MODE 1: CLEAN 3-COLUMN EDITORIAL NEWS-BLOG GRID
           * ============================================================ */}
          {viewMode === "cards" && (
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    aria-hidden="true"
                    className="w-1 h-6 rounded-full grad-brand shrink-0"
                  />
                  <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                    คอลัมน์งานวิจัย ({filteredPapers.length} เรื่อง หน้า {currentPage}/{totalPages})
                  </h3>
                  {unreadNewPapersCount > 0 && onMarkAllPapersRead && (
                    <button
                      type="button"
                      onClick={onMarkAllPapersRead}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-2 border border-rule text-xs font-editorial-label text-ink-2 hover:text-ink hover:border-accent-hi transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                      <span>ทำเครื่องหมายว่าอ่านแล้ว ({unreadNewPapersCount})</span>
                    </button>
                  )}
                </div>
                <span className="text-xs font-editorial-label text-muted">
                  คลิกที่บทความเพื่ออ่านฉบับเต็ม &amp; คัดลอกโพสต์ FB
                </span>
              </div>

              {gridPapers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gridPapers.map((paper) => {
                    const isSaved = Boolean(savedPapersMap[paper.id]);
                    const freshness = getPaperFreshness?.(paper);

                    return (
                      <article
                        key={paper.id}
                        onClick={() => onOpenPaper(paper)}
                        className={`blog-card blog-card-deferred group cursor-pointer flex flex-col justify-between ${
                          freshness?.isUnreadNew ? "blog-card-new" : ""
                        }`}
                      >
                        <div>
                          {/* Edge-to-Edge 16:10 Cover with Floating Bookmark */}
                          <BlogCoverMedia
                            src={paper.thumbnail_url}
                            alt={paper.title}
                            category={paper.category}
                            sublabel={`arXiv:${paper.id}`}
                            fit="contain"
                            edgeToEdge
                            isNew={Boolean(freshness?.isUnreadNew)}
                            topRightAction={
                              <button
                                type="button"
                                aria-pressed={isSaved}
                                onClick={(e) => onToggleSavePaper(paper, e)}
                                className={`relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full border transition-colors cursor-pointer ${
                                  isSaved
                                    ? "bg-accent text-white border-accent"
                                    : "bg-black/75 text-white border-white/20 hover:border-accent-hi"
                                }`}
                                title="คั่นหน้าบทความนี้"
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-4 h-4 shrink-0" />
                                ) : (
                                  <Bookmark className="w-4 h-4 shrink-0" />
                                )}
                              </button>
                            }
                          />

                          {/* Editorial Content */}
                          <div className="p-5 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                              <span className="text-accent-2 font-semibold truncate">
                                {paper.category}
                              </span>
                              <FreshnessBadge info={freshness} compact />
                            </div>

                            <h4 className="font-editorial-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)]">
                              {paper.hook_headline}
                            </h4>

                            <p className="text-sm font-editorial-body text-ink-2 line-clamp-2 leading-relaxed">
                              {paper.short_teaser}
                            </p>

                            {freshness?.isDelayedArrival && freshness.provenanceLabel && (
                              <p className="text-[11px] font-editorial-label text-accent-2 pt-0.5">
                                {freshness.provenanceLabel}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quiet Editorial Byline Footer */}
                        <div className="px-5 py-3.5 border-t border-rule/80 flex items-center justify-between gap-2 text-xs font-editorial-label">
                          <div className="flex items-center gap-2.5 text-muted min-w-0">
                            <span className="inline-flex items-center gap-1 text-accent-2 num shrink-0">
                              <ThumbsUp className="w-3 h-3 shrink-0" />
                              <span>{paper.upvotes}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 num shrink-0">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{paper.reading_time_minutes} นาที</span>
                            </span>
                            {paper.github_url && (
                              <span className="inline-flex items-center gap-1 text-ink-2 truncate">
                                <Code2 className="w-3 h-3 text-accent-hi shrink-0" />
                                <span>โค้ด</span>
                              </span>
                            )}
                          </div>

                          <span className="text-ink-2 group-hover:text-accent-2 font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors">
                            <span>อ่านสรุป</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* VIEW MODE 2: COMPACT DIGEST */}
          {viewMode === "compact" && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                  สารบัญด่วน (สแกนเร็วในหน้าเดียว {filteredPapers.length} เรื่อง หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  คลิกที่แถวเพื่อเปิดอ่านบทความ
                </span>
              </div>

              <div className="bg-paper-2 border border-rule rounded-[var(--radius-card)] divide-y divide-rule overflow-hidden">
                {pagedPapers.map((paper, idx) => {
                  const isSaved = Boolean(savedPapersMap[paper.id]);
                  const freshness = getPaperFreshness?.(paper);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <article
                      key={paper.id}
                      onClick={() => onOpenPaper(paper)}
                      className="group cursor-pointer py-4 px-4 sm:px-5 hover:bg-paper-3 transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 pl-8">
                          <FreshnessBadge info={freshness} />
                        </div>
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="font-editorial-label text-sm text-accent-hi mr-3 num">
                            {String(itemIndex).padStart(2, "0")}
                          </span>
                          {paper.hook_headline}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted line-clamp-1 font-editorial-body pl-8">
                          {paper.title}
                        </p>
                        <div className="flex items-center gap-2.5 flex-wrap text-xs font-editorial-label pl-8">
                          <span className="text-accent-2">{paper.category}</span>
                          {paper.organization && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>{paper.organization}</span>
                            </span>
                          )}
                          <span className="text-muted num">
                            เผยแพร่ {paper.published_date}
                          </span>
                          {paper.github_url && (
                            <span className="inline-flex items-center gap-1 text-ink-2">
                              <Code2 className="w-3 h-3 text-accent-hi shrink-0" />
                              <span>มีโค้ด</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center text-xs font-editorial-label">
                        <span className="px-2.5 py-1 rounded-full bg-paper-3 border border-rule text-accent-2 inline-flex items-center gap-1 num">
                          <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                          <span>{paper.upvotes}</span>
                        </span>
                        <span className="text-muted hidden sm:inline num">
                          {paper.reading_time_minutes} นาที
                        </span>
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSavePaper(paper, e)}
                          className="relative z-10 p-1.5 rounded-full border border-rule hover:border-accent-hi text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้าบทความนี้"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-accent-hi" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <span className="dusk-pill-primary px-3.5 py-1.5 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>อ่าน</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bounded Pagination Pills */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-rule flex items-center justify-between gap-4 text-xs font-editorial-label">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[38px] px-4 py-1.5 cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>หน้าก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={currentPage === p}
                    onClick={() => onPageChange(p)}
                    className={`min-w-[36px] min-h-[36px] px-2.5 rounded-full border text-xs font-editorial-label num transition-colors duration-[var(--dur-micro)] cursor-pointer ${
                      currentPage === p
                        ? "bg-ink text-paper border-ink font-semibold"
                        : "bg-paper-2 text-ink-2 border-rule hover:border-accent-hi hover:text-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[38px] px-4 py-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>หน้าถัดไป</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 sm:p-16 text-center bg-paper-2 border border-rule rounded-[var(--radius-card)] text-muted text-sm font-editorial-body">
          ไม่พบบทความวิจัยที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </div>
      )}
    </div>
  );
}
