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
      {/* Editorial Filter & View Controller Bar */}
      <div className="bg-paper-2 border-t-2 border-b border-ink p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rule">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-editorial-label">
            <span className="inline-flex items-center gap-2 text-ink font-bold">
              <Newspaper className="w-4 h-4 text-accent shrink-0" />
              <span>ข่าวประกาศทางการจาก Google Official Blog &amp; AI Labs</span>
            </span>
            <span className="hidden md:inline border-l border-rule-2 pl-3 text-muted">
              อัปเดตจาก RSS ทุกเช้า 07:00 น.
            </span>
          </div>

          <div className="flex items-center border border-ink bg-paper text-xs font-editorial-label self-end sm:self-auto">
            <button
              type="button"
              aria-pressed={viewMode === "cards"}
              onClick={() => onChangeViewMode("cards")}
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                viewMode === "cards"
                  ? "bg-ink text-paper"
                  : "text-ink-2 hover:bg-paper-2"
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
              className={`inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 border-l border-ink transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                viewMode === "compact"
                  ? "bg-ink text-paper"
                  : "text-ink-2 hover:bg-paper-2"
              }`}
              title="มุมมองสารบัญด่วน (กะทัดรัด ไม่ต้องเลื่อนเยอะ)"
            >
              <List className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">สารบัญด่วน</span>
            </button>
          </div>
        </div>

        {/* News Subcategory Filters */}
        <div className="flex items-center gap-1.5 rail-fade py-0.5">
          <span className="text-xs sm:text-sm font-editorial-label text-ink mr-1 shrink-0 whitespace-nowrap font-bold">
            หมวดข่าว:
          </span>
          <button
            type="button"
            aria-pressed={selectedCategory === "All"}
            onClick={() => onChangeCategory("All")}
            className={`min-h-[34px] px-3 py-1 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCategory === "All"
                ? "bg-accent text-accent-ink border-accent"
                : "bg-paper text-ink border-rule-2 hover:border-ink"
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
                className={`min-h-[34px] px-3 py-1 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-paper text-ink border-rule-2 hover:border-ink"
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
          {/* LEAD FRONT-PAGE AI LAB NEWS STORY */}
          {currentPage === 1 && viewMode === "cards" && (() => {
            const lead = filteredNews[0];
            const isSaved = Boolean(savedNewsMap[lead.id]);
            return (
              <section
                onClick={() => onOpenNews(lead)}
                className="editorial-opens group cursor-pointer bg-paper pb-8 border-b-2 border-ink"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  <div
                    className={`${
                      lead.thumbnail_url ? "lg:col-span-7" : "lg:col-span-12"
                    } min-w-0 space-y-4`}
                  >
                    <h2 className="font-editorial-display text-3xl sm:text-5xl text-ink leading-[1.06] max-w-none group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                      {lead.hook_headline}
                    </h2>

                    <p className="text-sm sm:text-base font-editorial-body italic text-muted line-clamp-2 max-w-3xl">
                      &ldquo;{lead.title}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm font-editorial-label py-2 border-t border-b border-rule">
                      <span className="px-2.5 py-0.5 bg-accent text-accent-ink whitespace-nowrap">
                        ข่าวเด่น AI Lab
                      </span>
                      <span className="px-2.5 py-0.5 bg-paper-2 border border-rule-2 text-ink whitespace-nowrap">
                        {lead.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 border-l border-rule-2 pl-3 text-ink font-medium">
                        <Newspaper className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{lead.source}</span>
                      </span>
                      <span className="border-l border-rule-2 pl-3 text-muted num">
                        {lead.published_date}
                      </span>
                    </div>

                    <p className="text-base sm:text-lg font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[65ch]">
                      {lead.short_teaser}
                    </p>

                    <div className="p-4 sm:p-5 editorial-well border-t-2 border-t-ink space-y-2 text-sm font-editorial-body">
                      <div className="font-editorial-label text-ink font-bold">
                        สรุปประเด็นสำคัญ:
                      </div>
                      {lead.tldr_takeaways.slice(0, 2).map((t, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-ink-2">
                          <span className="text-accent font-bold shrink-0" aria-hidden="true">
                            &rsaquo;
                          </span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-ink text-paper text-sm font-editorial-label group-hover:bg-accent group-hover:text-accent-ink transition-colors duration-[var(--dur-micro)] whitespace-nowrap">
                        <span>กดอ่านข่าวเจาะลึก ({lead.reading_time_minutes} นาที)</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </div>

                      <button
                        type="button"
                        aria-pressed={isSaved}
                        onClick={(e) => onToggleSaveNews(lead, e)}
                        className={`inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                          isSaved
                            ? "bg-accent text-accent-ink border-accent"
                            : "bg-paper text-ink border-ink hover:bg-paper-2"
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
                      <figure className="editorial-photo border-2 border-ink bg-paper-2">
                        <div className="bg-paper">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={lead.thumbnail_url}
                            alt={lead.title}
                            className="w-full h-64 sm:h-80 object-cover"
                          />
                        </div>
                        <figcaption className="px-4 py-2.5 bg-ink text-paper flex items-center justify-between text-xs font-editorial-label">
                          <span>{lead.source}</span>
                          <span className="text-paper-2">แตะเพื่ออ่านข่าว</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-ink pb-2.5">
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
                      className="group cursor-pointer bg-paper border-t-2 border-t-ink border-x border-b border-rule hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] p-5 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-editorial-display text-lg sm:text-xl text-ink leading-snug group-hover:text-accent transition-colors duration-[var(--dur-micro)]">
                            <span className="font-editorial-display text-xl text-accent mr-2 num">
                              {String(itemIndex).padStart(2, "0")}
                            </span>
                            {article.hook_headline}
                          </h4>
                          <button
                            type="button"
                            aria-pressed={isSaved}
                            onClick={(e) => onToggleSaveNews(article, e)}
                            className="p-1.5 border border-transparent hover:border-rule-2 text-muted hover:text-ink cursor-pointer shrink-0"
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
                          <span className="px-2 py-0.5 bg-paper-2 border border-rule-2 text-ink truncate max-w-[200px]">
                            {article.category}
                          </span>
                          <span className="text-ink num shrink-0">
                            {article.published_date}
                          </span>
                        </div>

                        {showFeaturedThumb && article.thumbnail_url && (
                          <div className="editorial-photo border border-rule bg-paper-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={article.thumbnail_url}
                              alt={article.title}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}

                        <p className="text-xs font-editorial-body italic text-muted line-clamp-1">
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
                          <span className="px-1.5 py-0.5 bg-paper-2 border border-rule text-ink">
                            {article.source}
                          </span>
                        </div>

                        <span className="text-ink group-hover:text-accent font-bold inline-flex items-center gap-1 whitespace-nowrap">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-4 border-ink pb-2.5">
                <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                  สารบัญด่วนข่าว AI Lab (สแกนเร็วในหน้าเดียว {filteredNews.length} ข่าว หน้า {currentPage}/{totalPages})
                </h3>
                <span className="text-xs font-editorial-label text-muted">
                  คลิกที่แถวเพื่อเปิดอ่านข่าว
                </span>
              </div>

              <div className="border-b-2 border-ink bg-paper divide-y divide-rule">
                {pagedNews.map((article, idx) => {
                  const isSaved = Boolean(savedNewsMap[article.id]);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <div
                      key={article.id}
                      onClick={() => onOpenNews(article)}
                      className="group cursor-pointer py-4 px-3 sm:px-4 hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="font-editorial-display text-lg sm:text-xl text-ink group-hover:text-accent transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="font-editorial-display text-xl text-accent mr-3 num">
                            {String(itemIndex).padStart(2, "0")}
                          </span>
                          {article.hook_headline}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted line-clamp-1 font-editorial-body italic pl-8">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-editorial-label pl-8">
                          <span className="px-2 py-0.5 bg-paper-2 border border-rule-2 text-ink">
                            {article.category}
                          </span>
                          <span className="inline-flex items-center gap-1 text-ink-2">
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
                          className="p-1.5 border border-rule hover:border-ink text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้าข่าวนี้"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-accent" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <span className="px-3 py-1.5 bg-ink text-paper group-hover:bg-accent group-hover:text-accent-ink transition-colors duration-[var(--dur-micro)] inline-flex items-center gap-1 whitespace-nowrap">
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
            <div className="pt-4 border-t-2 border-ink flex items-center justify-between gap-4 text-xs font-editorial-label">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 border border-ink bg-paper text-ink hover:bg-ink hover:text-paper transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
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
                    className={`min-w-[36px] min-h-[36px] px-2 border text-xs font-editorial-label num transition-colors duration-[var(--dur-micro)] cursor-pointer ${
                      currentPage === p
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper text-ink border-rule-2 hover:border-ink"
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
                className="inline-flex items-center gap-1 min-h-[38px] px-3.5 py-1.5 border border-ink bg-paper text-ink hover:bg-ink hover:text-paper transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap"
              >
                <span>หน้าถัดไป</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 sm:p-16 text-center editorial-well text-muted text-sm font-editorial-body">
          ไม่พบข่าวสาร AI Lab ที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </div>
      )}
    </div>
  );
}
