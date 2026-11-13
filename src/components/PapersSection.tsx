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
  return (
    <div className="space-y-6">
      {/* Editorial Filter & View Controller Bar */}
      <div className="editorial-well p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-rule">
          <div className="flex items-center gap-1.5 sm:gap-2 rail-fade py-0.5">
            <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 shrink-0 whitespace-nowrap">
              ฉบับ:
            </span>
            <button
              type="button"
              aria-pressed={paperEdition === "today"}
              onClick={() => onChangeEdition("today")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "today"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-rule-2 hover:bg-paper-3"
              }`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span>วันนี้ ({todayCount})</span>
            </button>

            <button
              type="button"
              aria-pressed={paperEdition === "yesterday"}
              onClick={() => onChangeEdition("yesterday")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "yesterday"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-rule-2 hover:bg-paper-3"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>เมื่อวาน ({yesterdayCount})</span>
            </button>

            <button
              type="button"
              aria-pressed={paperEdition === "all7"}
              onClick={() => onChangeEdition("all7")}
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                paperEdition === "all7"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-rule-2 hover:bg-paper-3"
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
              className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                onlyWithCode
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-rule-2 hover:border-ink"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 shrink-0" />
              <span>มีโค้ด GitHub</span>
            </button>

            <div className="flex items-center border border-rule-2 bg-paper text-xs font-editorial-label">
              <button
                type="button"
                aria-pressed={viewMode === "cards"}
                onClick={() => onChangeViewMode("cards")}
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "cards"
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink"
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
                className={`inline-flex items-center gap-1.5 min-h-[34px] px-2.5 py-1 border-l border-rule transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "compact"
                    ? "bg-ink text-paper"
                    : "text-muted hover:text-ink"
                }`}
                title="มุมมองสารบัญด่วน (กะทัดรัด ไม่ต้องเลื่อนเยอะ)"
              >
                <List className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">สารบัญด่วน</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Newspaper Sections */}
        <div className="flex items-center gap-1.5 rail-fade py-0.5">
          <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 shrink-0 whitespace-nowrap">
            หมวด:
          </span>
          <button
            type="button"
            aria-pressed={selectedCategory === "All"}
            onClick={() => onChangeCategory("All")}
            className={`min-h-[34px] px-3 py-1 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCategory === "All"
                ? "bg-accent text-accent-ink border-accent"
                : "bg-paper text-ink-2 border-rule hover:border-rule-2"
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
                className={`min-h-[34px] px-3 py-1 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-paper text-ink-2 border-rule hover:border-rule-2"
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
          {/* LEAD FRONT-PAGE STORY (Shown on Page 1 in Cards mode) */}
          {currentPage === 1 && viewMode === "cards" && (() => {
            const lead = filteredPapers[0];
            const isSaved = Boolean(savedPapersMap[lead.id]);
            return (
              <section
                onClick={() => onOpenPaper(lead)}
                className="editorial-opens group cursor-pointer bg-paper pb-8 border-b border-rule"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                  <div className="lg:col-span-8 min-w-0 space-y-3 sm:space-y-4">
                    <h2 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                      {lead.hook_headline}
                    </h2>

                    <p className="text-xs sm:text-sm font-editorial-body italic text-muted line-clamp-1 max-w-3xl">
                      &ldquo;{lead.title}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-editorial-label">
                      <span className="px-2.5 py-0.5 bg-accent text-accent-ink whitespace-nowrap">
                        พาดหัวเด่นประจำฉบับ
                      </span>
                      <span className="px-2.5 py-0.5 bg-paper-2 border border-rule text-ink whitespace-nowrap">
                        {lead.category}
                      </span>
                      {lead.organization && (
                        <span className="inline-flex items-center gap-1.5 border-l border-rule pl-3 text-ink">
                          <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>{lead.organization}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 border-l border-rule pl-3 text-ink num">
                        <ThumbsUp className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{lead.upvotes} Upvotes</span>
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-editorial-body text-ink-2 leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-[68ch]">
                      {lead.short_teaser}
                    </p>

                    <div className="p-4 editorial-well space-y-1.5 text-xs sm:text-sm font-editorial-body">
                      <div className="font-editorial-label text-ink">
                        ไฮไลต์สำคัญในบทความ:
                      </div>
                      {lead.tldr_takeaways.slice(0, 2).map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-ink-2">
                          <span className="text-accent font-bold shrink-0" aria-hidden="true">
                            &rsaquo;
                          </span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                      <div className="inline-flex items-center gap-2 text-sm font-editorial-label text-accent whitespace-nowrap">
                        <span>กดอ่านบทความเจาะลึก ({lead.reading_time_minutes} นาที)</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>

                      <div className="flex items-center gap-2">
                        {lead.github_url && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-editorial-label bg-success-soft text-success border border-rule whitespace-nowrap">
                            <Code2 className="w-3.5 h-3.5 shrink-0" />
                            <span>มีโค้ด GitHub</span>
                          </span>
                        )}
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSavePaper(lead, e)}
                          className={`inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                            isSaved
                              ? "bg-accent text-accent-ink border-accent"
                              : "bg-paper text-ink border-ink hover:bg-paper-2"
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>คั่นแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Bookmark className="w-3.5 h-3.5 shrink-0" />
                              <span>คั่นหน้า</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Visual Column */}
                  <div className="lg:col-span-4 min-w-0">
                    <figure className="editorial-photo border border-rule bg-paper-2 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lead.thumbnail_url}
                        alt={lead.title}
                        className="w-full h-56 sm:h-64 lg:h-72 object-contain"
                      />
                      <figcaption className="mt-2.5 pt-2 border-t border-rule flex items-center justify-between text-xs font-editorial-label text-muted">
                        <span className="num">arXiv:{lead.id}</span>
                        <span>แตะเพื่ออ่านบทความ</span>
                      </figcaption>
                    </figure>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* VIEW MODE 1: EDITORIAL CARDS */}
          {viewMode === "cards" && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink pb-2">
                <h3 className="font-editorial-display text-xl text-ink max-w-none">
                  คอลัมน์งานวิจัย ({filteredPapers.length} เรื่อง หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  แตะที่หัวข้อข่าวเพื่อเปิดอ่านฉบับเต็ม
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
                  return (
                    <article
                      key={paper.id}
                      onClick={() => onOpenPaper(paper)}
                      className="group cursor-pointer bg-paper border border-rule hover:border-ink transition-colors duration-[var(--dur-micro)] p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-editorial-display text-lg text-ink leading-snug group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                            <span className="text-xs font-editorial-label text-muted mr-1.5 num">
                              #{itemIndex}
                            </span>
                            {paper.hook_headline}
                          </h4>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSavePaper(paper, e)}
                            className="p-1.5 hover:bg-paper-2 text-muted hover:text-ink cursor-pointer shrink-0"
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
                          <span className="px-2 py-0.5 bg-paper-2 border border-rule text-ink truncate max-w-[200px]">
                            {paper.category}
                          </span>
                          <span className="text-ink inline-flex items-center gap-1 num shrink-0">
                            <ThumbsUp className="w-3 h-3 text-accent shrink-0" />
                            <span>{paper.upvotes}</span>
                          </span>
                        </div>

                        <p className="text-xs font-editorial-body italic text-muted line-clamp-1">
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
                            <span className="px-1.5 py-0.5 bg-success-soft text-success border border-rule">
                              มีโค้ด
                            </span>
                          )}
                        </div>

                        <span className="text-accent inline-flex items-center gap-1 whitespace-nowrap">
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

          {/* VIEW MODE 2: COMPACT DIGEST (Contents as rows) */}
          {viewMode === "compact" && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink pb-2">
                <h3 className="font-editorial-display text-lg sm:text-xl text-ink max-w-none">
                  สารบัญด่วน (สแกนเร็วในหน้าเดียว {filteredPapers.length} เรื่อง หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  คลิกที่แถวเพื่อเปิดอ่านบทความ
                </span>
              </div>

              <div className="border-t border-b border-rule-2 bg-paper divide-y divide-rule">
                {pagedPapers.map((paper, idx) => {
                  const isSaved = Boolean(savedPapersMap[paper.id]);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <div
                      key={paper.id}
                      onClick={() => onOpenPaper(paper)}
                      className="group cursor-pointer p-3.5 sm:p-4 hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="font-editorial-display text-base sm:text-lg text-ink group-hover:text-accent transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="text-xs font-editorial-label font-bold text-accent mr-2 num">
                            #{itemIndex}
                          </span>
                          {paper.hook_headline}
                        </h4>
                        <p className="text-xs text-muted line-clamp-1 font-editorial-body italic">
                          {paper.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-editorial-label">
                          <span className="px-2 py-0.5 bg-paper-2 border border-rule text-ink">
                            {paper.category}
                          </span>
                          {paper.organization && (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>{paper.organization}</span>
                            </span>
                          )}
                          {paper.github_url && (
                            <span className="px-1.5 py-0.5 bg-success-soft text-success border border-rule">
                              มีโค้ด
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end md:self-center text-xs font-editorial-label">
                        <span className="text-ink inline-flex items-center gap-1 num">
                          <ThumbsUp className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>{paper.upvotes}</span>
                        </span>
                        <span className="text-muted hidden sm:inline num">
                          {paper.reading_time_minutes} นาที
                        </span>
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSavePaper(paper, e)}
                          className="p-1.5 text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้า"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-accent" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-accent inline-flex items-center gap-1 whitespace-nowrap">
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

          {/* Bounded Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-rule flex items-center justify-between gap-4 text-xs font-editorial-label">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 border border-rule-2 bg-paper text-ink hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
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
                    className={`min-w-[34px] min-h-[34px] px-2 border text-xs font-editorial-label num transition-colors duration-[var(--dur-micro)] cursor-pointer ${
                      currentPage === p
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper text-ink-2 border-rule hover:bg-paper-2"
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
                className="inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 border border-rule-2 bg-paper text-ink hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
              >
                <span>หน้าถัดไป</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 sm:p-16 text-center editorial-well text-muted text-sm font-editorial-body">
          ไม่พบบทความวิจัยที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </div>
      )}
    </div>
  );
}
