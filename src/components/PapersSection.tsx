"use client";

import type React from "react";
import { useEffect, useRef } from "react";
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
} from "lucide-react";
import { PAPER_CATEGORIES, type PaperData } from "../types";

export interface PapersSectionProps {
  paperEdition: "today" | "yesterday" | "all7";
  onChangeEdition: (edition: "today" | "yesterday" | "all7") => void;
  todayCount: number;
  yesterdayCount: number;
  all7Count: number;
  activePoolCount: number;
  onlyWithCode: boolean;
  onToggleOnlyWithCode: () => void;
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

const DUSK_HERO_PHOTO =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Sunset_at_Acheloos_river_delta_01.jpg/1280px-Sunset_at_Acheloos_river_delta_01.jpg";

export function PapersSection({
  paperEdition,
  onChangeEdition,
  todayCount,
  yesterdayCount,
  all7Count,
  activePoolCount,
  onlyWithCode,
  onToggleOnlyWithCode,
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
  const withCodeCount = filteredPapers.filter((p) => Boolean(p.github_url)).length;
  const topUpvotes = filteredPapers[0]?.upvotes ?? 0;
  const heroBackdropRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = heroBackdropRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      img.style.display = "none";
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Dusk Filter & View Controller Bar */}
      <div className="bg-paper-2 border border-rule rounded-[var(--radius-card)] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-rule">
          <div className="flex items-center gap-2 rail-fade py-0.5">
            <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 shrink-0 whitespace-nowrap">
              ฉบับ:
            </span>
            <button
              type="button"
              aria-pressed={paperEdition === "today"}
              onClick={() => onChangeEdition("today")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "today"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>วันนี้ ({todayCount})</span>
            </button>

            <button
              type="button"
              aria-pressed={paperEdition === "yesterday"}
              onClick={() => onChangeEdition("yesterday")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "yesterday"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>เมื่อวาน ({yesterdayCount})</span>
            </button>

            <button
              type="button"
              aria-pressed={paperEdition === "all7"}
              onClick={() => onChangeEdition("all7")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "all7"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 shrink-0" />
              <span>รวมย้อนหลัง ({all7Count})</span>
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <button
              type="button"
              aria-pressed={onlyWithCode}
              onClick={onToggleOnlyWithCode}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                onlyWithCode
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span>มีโค้ด GitHub</span>
            </button>

            <div className="flex items-center rounded-full border border-rule bg-paper-3 p-0.5 text-xs font-editorial-label">
              <button
                type="button"
                aria-pressed={viewMode === "cards"}
                onClick={() => onChangeViewMode("cards")}
                className={`inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "cards"
                    ? "bg-ink text-paper"
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
                className={`inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "compact"
                    ? "bg-ink text-paper"
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

        {/* Category Pill Filter Strip */}
        <div className="flex items-center gap-2 rail-fade py-0.5">
          <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 shrink-0 whitespace-nowrap">
            หมวด:
          </span>
          <button
            type="button"
            aria-pressed={selectedCategory === "All"}
            onClick={() => onChangeCategory("All")}
            className={`min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCategory === "All"
                ? "bg-accent text-accent-ink border-accent"
                : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
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
                className={`min-h-[34px] px-3.5 py-1 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-paper-3 text-ink-2 border-rule hover:border-accent hover:text-ink"
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
          {/* DUSK HORIZON LEAD STAGE (Pale scrim + Dark day-ink left, Smoked Glass panel right) */}
          {currentPage === 1 && viewMode === "cards" && (() => {
            const lead = filteredPapers[0];
            const isSaved = Boolean(savedPapersMap[lead.id]);
            return (
              <section
                onClick={() => onOpenPaper(lead)}
                className="dusk-hero-stage group cursor-pointer p-6 sm:p-9 lg:p-10"
              >
                {/* Atmospheric Dusk Photo Backdrop */}
                <div
                  data-slot
                  aria-hidden="true"
                  className="dusk-photo absolute inset-0 z-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={heroBackdropRef}
                    src={DUSK_HERO_PHOTO}
                    alt=""
                    sizes="100vw"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    style={{ objectPosition: "75% 70%" }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="dusk-hero-scrim" aria-hidden="true" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                  {/* Left Story Column on Calm Dark-Slate Scrim */}
                  <div className="lg:col-span-7 min-w-0 space-y-4">
                    <h2 className="font-editorial-display text-3xl sm:text-5xl text-ink leading-[1.08] max-w-none group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                      {lead.hook_headline}
                    </h2>

                    <p className="text-sm sm:text-base font-editorial-body text-muted line-clamp-2 max-w-2xl">
                      &ldquo;{lead.title}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm font-editorial-label py-2.5 border-y border-rule">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-paper-3 border border-rule text-ink whitespace-nowrap">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-accent-2"
                          aria-hidden="true"
                        />
                        <span>เรื่องเด่นประจำฉบับ</span>
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2 whitespace-nowrap">
                        {lead.category}
                      </span>
                      {lead.organization && (
                        <span className="inline-flex items-center gap-1.5 text-ink-2 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>{lead.organization}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 text-accent-2 font-medium num">
                        <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                        <span>{lead.upvotes} Upvotes</span>
                      </span>
                    </div>

                    <p className="text-base sm:text-lg font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[62ch]">
                      {lead.short_teaser}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <div className="dusk-pill-primary inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-editorial-label transition-colors duration-[var(--dur-micro)] whitespace-nowrap">
                        <span>
                          กดอ่านบทความเจาะลึก ({lead.reading_time_minutes} นาที)
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>

                      <button
                        type="button"
                        aria-pressed={isSaved}
                        onClick={(e) => onToggleSavePaper(lead, e)}
                        className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                          isSaved
                            ? "bg-accent text-accent-ink border-accent"
                            : "dusk-pill-ghost"
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-4 h-4 shrink-0" />
                            <span>คั่นแล้ว</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4 shrink-0" />
                            <span>คั่นหน้า</span>
                          </>
                        )}
                      </button>

                      {lead.github_url && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-editorial-label rounded-full bg-paper-3 border border-rule text-accent whitespace-nowrap">
                          <Code2 className="w-3.5 h-3.5 shrink-0" />
                          <span>มีโค้ด GitHub</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Smoked Glass Panel with Bone Well Visual Plate */}
                  <div className="lg:col-span-5 min-w-0">
                    <div className="dusk-glass p-5 sm:p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2 text-xs font-editorial-label border-b border-[color-mix(in_oklab,var(--color-light)_10%,transparent)] pb-3">
                        <span className="text-ink font-medium num">
                          Issue arXiv:{lead.id}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[color-mix(in_oklab,var(--color-light)_8%,transparent)] text-accent">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                            aria-hidden="true"
                          />
                          <span>ฉบับภาษาไทย</span>
                        </span>
                      </div>

                      {/* Bone Well holding white figure plate */}
                      <figure className="dusk-well p-2.5 sm:p-3 space-y-2">
                        <div className="dusk-well-card p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={lead.thumbnail_url}
                            alt={lead.title}
                            className="w-full h-44 sm:h-52 object-contain"
                          />
                        </div>
                        <figcaption className="flex items-center justify-between text-xs px-1 text-[var(--color-well-muted)]">
                          <span>ภาพประกอบโครงสร้างงานวิจัย</span>
                          <span className="num">{lead.reading_time_minutes} นาที</span>
                        </figcaption>
                      </figure>

                      {/* Ruled Takeaways inside Smoked Glass */}
                      <div className="space-y-2 divide-y divide-[color-mix(in_oklab,var(--color-light)_10%,transparent)] text-xs sm:text-sm font-editorial-body">
                        {lead.tldr_takeaways.slice(0, 2).map((t, idx) => (
                          <div
                            key={idx}
                            className="pt-2 first:pt-0 flex items-start gap-2.5 text-ink-2"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="line-clamp-2">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* Dusk Ruled Edition Tally Band (calm slate surface, no stat boxes) */}
          {currentPage === 1 && viewMode === "cards" && (
            <section className="bg-paper-2 border border-rule rounded-[var(--radius-card)] p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6 space-y-1">
                  <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                    สารบัญฉบับที่คัดกรองแล้ว
                  </h3>
                  <p className="text-sm font-editorial-body text-muted">
                    สรุปงานวิจัยคัดสรรประจำวันพร้อมภาพประกอบสถาปัตยกรรมและโค้ดเปิดเผย
                  </p>
                </div>

                <div className="md:col-span-6 grid grid-cols-3 divide-x divide-rule border-t md:border-t-0 border-rule pt-3 md:pt-0">
                  <div className="pr-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-editorial-display text-2xl sm:text-3xl text-ink num leading-none">
                        {filteredPapers.length}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full bg-accent shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-xs font-editorial-label text-muted mt-1.5">
                      เรื่องในชุดนี้
                    </div>
                  </div>
                  <div className="px-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-editorial-display text-2xl sm:text-3xl text-accent num leading-none">
                        {withCodeCount}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full bg-accent shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-xs font-editorial-label text-muted mt-1.5">
                      มีโค้ด GitHub
                    </div>
                  </div>
                  <div className="pl-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-editorial-display text-2xl sm:text-3xl text-accent-2 num leading-none">
                        {topUpvotes}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full bg-accent-2 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-xs font-editorial-label text-muted mt-1.5">
                      โหวตสูงสุด
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* VIEW MODE 1: DUSK SLATE CARDS + BONE WELL PLATES */}
          {viewMode === "cards" && (
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                <h3 className="font-editorial-display text-2xl text-ink max-w-none">
                  คอลัมน์งานวิจัย ({filteredPapers.length} เรื่อง หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  แตะที่การ์ดเพื่อเปิดอ่านฉบับเต็ม
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                {(currentPage === 1
                  ? filteredPapers.slice(1, itemsPerPage)
                  : pagedPapers
                ).map((paper, idx) => {
                  const isSaved = Boolean(savedPapersMap[paper.id]);
                  const itemIndex =
                    currentPage === 1
                      ? idx + 2
                      : (currentPage - 1) * itemsPerPage + idx + 1;
                  const showFeaturedThumb =
                    currentPage === 1 && idx < 3 && Boolean(paper.thumbnail_url);

                  return (
                    <article
                      key={paper.id}
                      onClick={() => onOpenPaper(paper)}
                      className="group cursor-pointer bg-paper-2 border border-rule hover:border-accent hover:bg-paper-3 rounded-[var(--radius-card)] transition-colors duration-[var(--dur-micro)] p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-editorial-display text-lg text-ink leading-snug group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                            <span className="font-editorial-display text-base text-accent mr-2 num">
                              {String(itemIndex).padStart(2, "0")}
                            </span>
                            {paper.hook_headline}
                          </h4>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSavePaper(paper, e)}
                            className="p-1.5 rounded-full border border-transparent hover:border-rule-2 text-muted hover:text-ink cursor-pointer shrink-0"
                            title="คั่นหน้าบทความนี้"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-4 h-4 text-accent" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs font-editorial-label">
                          <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2 truncate max-w-[190px]">
                            {paper.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-accent-2 inline-flex items-center gap-1 num shrink-0">
                            <ThumbsUp className="w-3 h-3 shrink-0" />
                            <span>{paper.upvotes}</span>
                          </span>
                        </div>

                        {showFeaturedThumb && (
                          <div className="dusk-well p-2">
                            <div className="dusk-well-card p-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={paper.thumbnail_url}
                                alt={paper.title}
                                className="w-full h-28 object-contain"
                              />
                            </div>
                          </div>
                        )}

                        <p className="text-xs font-editorial-body text-muted line-clamp-1">
                          {paper.title}
                        </p>

                        <p className="text-xs sm:text-sm font-editorial-body text-ink-2 line-clamp-3 leading-relaxed">
                          {paper.short_teaser}
                        </p>
                      </div>

                      <div className="pt-3 mt-4 border-t border-rule flex items-center justify-between text-xs font-editorial-label">
                        <div className="flex items-center gap-2 text-muted">
                          <span className="inline-flex items-center gap-1 num">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{paper.reading_time_minutes} นาที</span>
                          </span>
                          {paper.github_url && (
                            <span className="inline-flex items-center gap-1 text-accent">
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-accent"
                                aria-hidden="true"
                              />
                              <span>มีโค้ด</span>
                            </span>
                          )}
                        </div>

                        <span className="text-accent group-hover:text-accent-hi font-medium inline-flex items-center gap-1 whitespace-nowrap">
                          <span>อ่านสรุป</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* VIEW MODE 2: COMPACT DIGEST (Calm Dusk ruled rows) */}
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
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <div
                      key={paper.id}
                      onClick={() => onOpenPaper(paper)}
                      className="group cursor-pointer py-4 px-4 sm:px-5 hover:bg-paper-3 transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="font-editorial-display text-base text-accent mr-3 num">
                            {String(itemIndex).padStart(2, "0")}
                          </span>
                          {paper.hook_headline}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted line-clamp-1 font-editorial-body pl-8">
                          {paper.title}
                        </p>
                        <div className="flex items-center gap-2.5 flex-wrap text-xs font-editorial-label pl-8">
                          <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2">
                            {paper.category}
                          </span>
                          {paper.organization && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>{paper.organization}</span>
                            </span>
                          )}
                          {paper.github_url && (
                            <span className="inline-flex items-center gap-1 text-accent">
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-accent"
                                aria-hidden="true"
                              />
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
                          className="p-1.5 rounded-full border border-rule hover:border-accent text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้า"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-accent" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <span className="dusk-pill-primary px-3.5 py-1.5 inline-flex items-center gap-1 whitespace-nowrap">
                          <span>อ่าน</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </div>
                    </div>
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
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[38px] px-4 py-1.5 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
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
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper-2 text-ink-2 border-rule hover:border-accent hover:text-ink"
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
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[38px] px-4 py-1.5 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
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
