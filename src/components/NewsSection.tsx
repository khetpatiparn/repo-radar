"use client";

import type React from "react";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import { NEWS_CATEGORIES, type NewsArticleData } from "../types";

export interface NewsSectionProps {
  allNewsCount: number;
  selectedCategory: string;
  onChangeCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  viewMode: "cards" | "compact";
  onChangeViewMode: (mode: "cards" | "compact") => void;
  filteredNews: NewsArticleData[];
  pagedNews: NewsArticleData[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  savedNewsMap: Record<string, NewsArticleData>;
  onToggleSaveNews: (article: NewsArticleData, e?: React.MouseEvent) => void;
  onOpenNews: (article: NewsArticleData) => void;
}

export function NewsSection({
  allNewsCount,
  selectedCategory,
  onChangeCategory,
  categoryCounts,
  viewMode,
  onChangeViewMode,
  filteredNews,
  pagedNews,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  savedNewsMap,
  onToggleSaveNews,
  onOpenNews,
}: NewsSectionProps) {
  return (
    <div className="space-y-8">
      {/* Dusk News Filter & View Controller Bar */}
      <div className="bg-paper-2 border border-rule rounded-[var(--radius-card)] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-rule">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-editorial-label">
            <span className="inline-flex items-center gap-2 text-ink font-medium">
              <Newspaper className="w-4 h-4 text-accent shrink-0" />
              <span>ข่าวประกาศทางการจาก Google Official Blog &amp; AI Labs</span>
            </span>
            <span className="hidden md:inline border-l border-rule pl-3 text-muted">
              อัปเดตจาก RSS ทุกเช้า 07:00 น.
            </span>
          </div>

          <div className="flex items-center rounded-full border border-rule bg-paper-3 p-0.5 text-xs font-editorial-label self-end sm:self-auto">
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

        {/* News Subcategory Pills */}
        <div className="flex items-center gap-2 rail-fade py-0.5">
          <span className="text-xs sm:text-sm font-editorial-label text-muted mr-1 shrink-0 whitespace-nowrap">
            หมวดข่าว:
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
            ทั้งหมด ({allNewsCount})
          </button>
          {NEWS_CATEGORIES.map((cat) => {
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

      {filteredNews.length > 0 ? (
        <>
          {/* LEAD FRONT-PAGE AI LAB NEWS STORY (Smoked Glass + Bone Well showcase) */}
          {currentPage === 1 && viewMode === "cards" && (() => {
            const lead = filteredNews[0];
            const isSaved = Boolean(savedNewsMap[lead.id]);
            return (
              <section
                onClick={() => onOpenNews(lead)}
                className="dusk-glass group cursor-pointer p-6 sm:p-8 lg:p-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                  <div
                    className={`${
                      lead.thumbnail_url ? "lg:col-span-7" : "lg:col-span-12"
                    } min-w-0 space-y-4`}
                  >
                    <h2 className="font-editorial-display text-3xl sm:text-4xl lg:text-5xl text-ink leading-[1.06] max-w-none group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                      {lead.hook_headline}
                    </h2>

                    <p className="text-sm sm:text-base font-editorial-body text-muted line-clamp-2 max-w-3xl">
                      &ldquo;{lead.title}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm font-editorial-label py-2.5 border-y border-rule">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-accent text-accent-ink whitespace-nowrap">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-accent-ink"
                          aria-hidden="true"
                        />
                        <span>ข่าวเด่น AI Lab</span>
                      </span>
                      <span className="px-3 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2 whitespace-nowrap">
                        {lead.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-ink">
                        <Newspaper className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{lead.source}</span>
                      </span>
                      <span className="border-l border-rule pl-3 text-muted num">
                        {lead.published_date}
                      </span>
                    </div>

                    <p className="text-base sm:text-lg font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[62ch]">
                      {lead.short_teaser}
                    </p>

                    <div className="p-4 rounded-[var(--radius-inner)] bg-paper-2 border border-rule space-y-2 text-sm font-editorial-body">
                      <div className="font-editorial-label text-ink">
                        สรุปประเด็นสำคัญ:
                      </div>
                      {lead.tldr_takeaways.slice(0, 2).map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-ink-2">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <div className="dusk-pill-primary inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-editorial-label transition-colors duration-[var(--dur-micro)] whitespace-nowrap">
                        <span>
                          กดอ่านข่าวเจาะลึก ({lead.reading_time_minutes} นาที)
                        </span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>

                      <button
                        type="button"
                        aria-pressed={isSaved}
                        onClick={(e) => onToggleSaveNews(lead, e)}
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
                    </div>
                  </div>

                  {lead.thumbnail_url && (
                    <div className="lg:col-span-5 min-w-0">
                      <figure className="dusk-well p-3 space-y-2">
                        <div className="dusk-well-card overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={lead.thumbnail_url}
                            alt={lead.title}
                            className="w-full h-56 sm:h-72 object-cover"
                          />
                        </div>
                        <figcaption className="px-1 flex items-center justify-between text-xs text-[var(--color-well-muted)] font-editorial-label">
                          <span>{lead.source}</span>
                          <span>แตะเพื่ออ่านข่าว</span>
                        </figcaption>
                      </figure>
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* NEWS CARDS GRID */}
          {viewMode === "cards" && (
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                <h3 className="font-editorial-display text-2xl text-ink max-w-none">
                  คอลัมน์ข่าวสาร AI Lab ({filteredNews.length} ข่าว หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  แหล่งข้อมูล Google Official Blog RSS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
                {(currentPage === 1
                  ? filteredNews.slice(1, itemsPerPage)
                  : pagedNews
                ).map((article, idx) => {
                  const isSaved = Boolean(savedNewsMap[article.id]);
                  const itemIndex =
                    currentPage === 1
                      ? idx + 2
                      : (currentPage - 1) * itemsPerPage + idx + 1;
                  const showFeaturedThumb =
                    currentPage === 1 && idx < 3 && Boolean(article.thumbnail_url);

                  return (
                    <article
                      key={article.id}
                      onClick={() => onOpenNews(article)}
                      className="group cursor-pointer bg-paper-2 border border-rule hover:border-accent hover:bg-paper-3 rounded-[var(--radius-card)] transition-colors duration-[var(--dur-micro)] p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-editorial-display text-lg text-ink leading-snug group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                            <span className="font-editorial-display text-base text-accent mr-2 num">
                              {String(itemIndex).padStart(2, "0")}
                            </span>
                            {article.hook_headline}
                          </h4>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSaveNews(article, e)}
                            className="p-1.5 rounded-full border border-transparent hover:border-rule-2 text-muted hover:text-ink cursor-pointer shrink-0"
                            title="คั่นหน้าข่าวนี้"
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
                            {article.category}
                          </span>
                          <span className="text-muted num shrink-0">
                            {article.published_date}
                          </span>
                        </div>

                        {showFeaturedThumb && article.thumbnail_url && (
                          <div className="dusk-well p-2">
                            <div className="dusk-well-card overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={article.thumbnail_url}
                                alt={article.title}
                                className="w-full h-28 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        <p className="text-xs font-editorial-body text-muted line-clamp-1">
                          {article.title}
                        </p>

                        <p className="text-xs sm:text-sm font-editorial-body text-ink-2 line-clamp-3 leading-relaxed">
                          {article.short_teaser}
                        </p>
                      </div>

                      <div className="pt-3 mt-4 border-t border-rule flex items-center justify-between text-xs font-editorial-label">
                        <div className="flex items-center gap-2 text-muted">
                          <span className="inline-flex items-center gap-1 num">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{article.reading_time_minutes} นาที</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2">
                            {article.source}
                          </span>
                        </div>

                        <span className="text-accent group-hover:text-accent-hi font-medium inline-flex items-center gap-1 whitespace-nowrap">
                          <span>อ่านข่าว</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* NEWS COMPACT DIGEST MODE */}
          {viewMode === "compact" && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
                <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                  สารบัญด่วนข่าว AI Lab (สแกนเร็วในหน้าเดียว {filteredNews.length} ข่าว หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  คลิกที่แถวเพื่อเปิดอ่านข่าว
                </span>
              </div>

              <div className="bg-paper-2 border border-rule rounded-[var(--radius-card)] divide-y divide-rule overflow-hidden">
                {pagedNews.map((article, idx) => {
                  const isSaved = Boolean(savedNewsMap[article.id]);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <div
                      key={article.id}
                      onClick={() => onOpenNews(article)}
                      className="group cursor-pointer py-4 px-4 sm:px-5 hover:bg-paper-3 transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="font-editorial-display text-base text-accent mr-3 num">
                            {String(itemIndex).padStart(2, "0")}
                          </span>
                          {article.hook_headline}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted line-clamp-1 font-editorial-body pl-8">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2.5 flex-wrap text-xs font-editorial-label pl-8">
                          <span className="px-2.5 py-0.5 rounded-full bg-paper-3 border border-rule text-ink-2">
                            {article.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-muted">
                            <Newspaper className="w-3 h-3 shrink-0" />
                            <span>{article.source}</span>
                          </span>
                          <span className="text-muted num">
                            {article.published_date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center text-xs font-editorial-label">
                        <span className="text-muted hidden sm:inline num">
                          {article.reading_time_minutes} นาที
                        </span>
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSaveNews(article, e)}
                          className="p-1.5 rounded-full border border-rule hover:border-accent text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้าข่าวนี้"
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

          {/* News Pagination */}
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
          ไม่พบข่าวสาร AI Lab ที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </div>
      )}
    </div>
  );
}
