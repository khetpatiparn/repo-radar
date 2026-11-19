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
  CheckCheck,
} from "lucide-react";
import { NEWS_CATEGORIES, type NewsArticleData } from "../types";
import type { FreshnessInfo } from "../lib/freshness";
import { FreshnessBadge, BlogCoverMedia } from "./FreshnessBadge";

export interface NewsSectionProps {
  allNewsCount: number;
  selectedCategory: string;
  onChangeCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  onlyNewToday: boolean;
  onToggleOnlyNewToday: () => void;
  newNewsCount: number;
  unreadNewNewsCount: number;
  onMarkAllNewsRead?: () => void;
  getNewsFreshness?: (article: NewsArticleData) => FreshnessInfo;
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
  onlyNewToday,
  onToggleOnlyNewToday,
  newNewsCount,
  unreadNewNewsCount,
  onMarkAllNewsRead,
  getNewsFreshness,
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
  const showAsymmetricHero =
    viewMode === "cards" && currentPage === 1 && filteredNews.length > 0;
  const railNews = showAsymmetricHero ? filteredNews.slice(1, 4) : [];
  const hasBriefingRail = railNews.length > 0;
  const gridNews =
    currentPage === 1
      ? hasBriefingRail
        ? filteredNews.slice(4, itemsPerPage)
        : filteredNews.slice(1, itemsPerPage)
      : pagedNews;

  return (
    <div className="space-y-10">
      {/* Quiet Borderless News Filter Bar */}
      <div className="border-b border-rule pb-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm font-editorial-label">
            <span className="inline-flex items-center gap-2 text-ink-2 font-medium">
              <Newspaper className="w-4 h-4 text-accent-2 shrink-0" />
              <span>ข่าวประกาศทางการจาก Google Official Blog &amp; AI Labs</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {newNewsCount > 0 && (
              <button
                type="button"
                aria-pressed={onlyNewToday}
                onClick={onToggleOnlyNewToday}
                className={`inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  onlyNewToday
                    ? "bg-accent text-accent-ink font-semibold"
                    : "bg-accent-soft text-accent-2 hover:text-ink"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span>เฉพาะรายการมาใหม่ ({newNewsCount})</span>
              </button>
            )}

            <div className="flex items-center rounded-full bg-paper-2 p-0.5 text-xs font-editorial-label">
              <button
                type="button"
                aria-pressed={viewMode === "cards"}
                onClick={() => onChangeViewMode("cards")}
                className={`inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "cards"
                    ? "bg-ink text-paper font-semibold"
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
                className={`inline-flex items-center gap-1.5 min-h-[28px] px-2.5 py-1 rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap ${
                  viewMode === "compact"
                    ? "bg-ink text-paper font-semibold"
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

        {/* Borderless News Category Tabs */}
        <div className="flex items-center gap-1.5 rail-fade py-0.5">
          <button
            type="button"
            aria-pressed={selectedCategory === "All"}
            onClick={() => onChangeCategory("All")}
            className={`min-h-[30px] px-3 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCategory === "All"
                ? "bg-accent text-accent-ink font-semibold"
                : "bg-transparent text-muted hover:bg-white/[0.05] hover:text-ink"
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
                className={`min-h-[30px] px-3 py-1 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent text-accent-ink font-semibold"
                    : "bg-transparent text-muted hover:bg-white/[0.05] hover:text-ink"
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
          {/* BORDERLESS ASYMMETRIC MAGAZINE HERO + BRIEFING RAIL */}
          {showAsymmetricHero &&
            (() => {
              const lead = filteredNews[0];
              const isSaved = Boolean(savedNewsMap[lead.id]);
              const freshness = getNewsFreshness?.(lead);
              return (
                <section
                  aria-label="ข่าวเด่น AI Lab"
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-9 pb-10 border-b border-rule items-start"
                >
                  <article
                    onClick={() => onOpenNews(lead)}
                    className={`${
                      hasBriefingRail ? "lg:col-span-8" : "lg:col-span-12"
                    } ember-hero-stage group cursor-pointer space-y-5`}
                  >
                    <BlogCoverMedia
                      src={lead.thumbnail_url}
                      alt={lead.title}
                      category={lead.category}
                      sublabel={lead.source}
                      fit="cover"
                      aspect="16/9"
                      priority
                      isNew={Boolean(freshness?.isUnreadNew)}
                      topRightAction={
                        <button
                          type="button"
                          aria-pressed={isSaved}
                          onClick={(e) => onToggleSaveNews(lead, e)}
                          className={`relative z-10 inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors cursor-pointer ${
                            isSaved
                              ? "bg-accent text-white"
                              : "bg-black/75 text-white hover:bg-black/90"
                          }`}
                          title="คั่นหน้าข่าวนี้"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 shrink-0" />
                          ) : (
                            <Bookmark className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      }
                    />

                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                        <span className="text-accent-2 font-semibold uppercase tracking-wider">
                          {lead.category}
                        </span>
                        <span className="text-muted" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-muted">ข่าวเด่น AI Lab</span>
                        <FreshnessBadge info={freshness} />
                      </div>

                      <h2 className="font-editorial-display text-2xl sm:text-3xl lg:text-[2.35rem] text-ink leading-[1.16] max-w-none group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)]">
                        {lead.hook_headline}
                      </h2>

                      <p className="text-sm font-editorial-body text-muted line-clamp-1">
                        {lead.title}
                      </p>

                      <p className="text-base font-editorial-body text-ink-2 leading-relaxed line-clamp-3 max-w-[68ch]">
                        {lead.short_teaser}
                      </p>

                      {lead.tldr_takeaways[0] && (
                        <p className="pl-3.5 border-l-2 border-accent text-sm font-editorial-body text-ink-2 line-clamp-2 max-w-[66ch]">
                          {lead.tldr_takeaways[0]}
                        </p>
                      )}

                      <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-editorial-label text-muted">
                          <span className="inline-flex items-center gap-1.5 text-ink-2">
                            <Newspaper className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{lead.source}</span>
                          </span>
                          <span className="num">{lead.published_date}</span>
                          <span className="inline-flex items-center gap-1 num">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{lead.reading_time_minutes} นาที</span>
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm font-editorial-label font-semibold text-accent-2 group-hover:text-ink transition-colors whitespace-nowrap">
                          <span>กดอ่านข่าวเจาะลึก</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </span>
                      </div>
                    </div>
                  </article>

                  {/* Right 4-Col Borderless News Briefing Rail */}
                  {hasBriefingRail && (
                    <aside className="lg:col-span-4 editorial-rail lg:border-l lg:border-rule lg:pl-8 flex flex-col">
                      <div className="pb-3.5 border-b border-rule flex items-center justify-between">
                        <h3 className="font-editorial-label text-xs uppercase tracking-[0.14em] text-muted">
                          อัปเดตสำคัญจาก AI Labs
                        </h3>
                        <span className="text-[11px] font-mono text-muted num">
                          02—04
                        </span>
                      </div>

                      <div className="divide-y divide-rule">
                        {railNews.map((article, idx) => {
                          const railSaved = Boolean(savedNewsMap[article.id]);
                          const railFreshness = getNewsFreshness?.(article);
                          return (
                            <article
                              key={article.id}
                              onClick={() => onOpenNews(article)}
                              className="group cursor-pointer py-5 first:pt-4 last:pb-0 flex flex-col gap-2.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] font-editorial-label">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-mono text-accent-2 font-semibold num">
                                    {String(idx + 2).padStart(2, "0")}
                                  </span>
                                  <span className="text-muted truncate">
                                    {article.category}
                                  </span>
                                  {railFreshness?.isUnreadNew && (
                                    <span className="badge-new-ember px-1.5 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase leading-none">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  aria-pressed={railSaved}
                                  onClick={(e) => onToggleSaveNews(article, e)}
                                  className="relative z-10 p-1 rounded-full text-muted hover:text-ink cursor-pointer shrink-0"
                                  title="คั่นหน้าข่าวนี้"
                                >
                                  {railSaved ? (
                                    <BookmarkCheck className="w-3.5 h-3.5 text-accent-hi" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <h4 className="font-editorial-display text-base sm:text-[1.06rem] text-ink leading-snug line-clamp-2 group-hover:text-accent-2 transition-colors">
                                {article.hook_headline}
                              </h4>

                              <p className="text-xs font-editorial-body text-muted line-clamp-2 leading-relaxed">
                                {article.short_teaser}
                              </p>

                              <div className="flex items-center justify-between text-[11px] font-editorial-label text-muted pt-0.5">
                                <div className="flex items-center gap-2.5">
                                  <span className="num">{article.published_date}</span>
                                  <span className="num">
                                    {article.reading_time_minutes} นาที
                                  </span>
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

          {/* BORDERLESS 3-COLUMN NEWS-BLOG STORY GRID */}
          {viewMode === "cards" && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-rule">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
                    คอลัมน์ข่าวสาร AI Lab ({filteredNews.length} ข่าว หน้า {currentPage}/{totalPages})
                  </h3>
                  {unreadNewNewsCount > 0 && onMarkAllNewsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllNewsRead}
                      className="inline-flex items-center gap-1.5 text-xs font-editorial-label text-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-accent-2 shrink-0" />
                      <span>ทำเครื่องหมายว่าอ่านแล้ว ({unreadNewNewsCount})</span>
                    </button>
                  )}
                </div>
                <span className="text-xs font-editorial-label text-muted">
                  แหล่งข้อมูล Google Official Blog RSS
                </span>
              </div>

              {gridNews.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
                  {gridNews.map((article) => {
                    const isSaved = Boolean(savedNewsMap[article.id]);
                    const freshness = getNewsFreshness?.(article);

                    return (
                      <article
                        key={article.id}
                        onClick={() => onOpenNews(article)}
                        className={`blog-card blog-card-deferred group cursor-pointer flex flex-col justify-between gap-3.5 ${
                          freshness?.isUnreadNew ? "blog-card-new" : ""
                        }`}
                      >
                        <div className="space-y-3.5">
                          <BlogCoverMedia
                            src={article.thumbnail_url}
                            alt={article.title}
                            category={article.category}
                            sublabel={article.source}
                            fit="cover"
                            isNew={Boolean(freshness?.isUnreadNew)}
                            topRightAction={
                              <button
                                type="button"
                                aria-pressed={isSaved}
                                onClick={(e) => onToggleSaveNews(article, e)}
                                className={`relative z-10 inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer ${
                                  isSaved
                                    ? "bg-accent text-white"
                                    : "bg-black/75 text-white hover:bg-black/90"
                                }`}
                                title="คั่นหน้าข่าวนี้"
                              >
                                {isSaved ? (
                                  <BookmarkCheck className="w-4 h-4 shrink-0" />
                                ) : (
                                  <Bookmark className="w-4 h-4 shrink-0" />
                                )}
                              </button>
                            }
                          />

                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                              <span className="text-accent-2 font-medium truncate">
                                {article.category}
                              </span>
                              <FreshnessBadge info={freshness} compact />
                            </div>

                            <h4 className="font-editorial-display text-lg text-ink leading-snug line-clamp-2 group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)]">
                              {article.hook_headline}
                            </h4>

                            <p className="text-sm font-editorial-body text-muted line-clamp-2 leading-relaxed">
                              {article.short_teaser}
                            </p>

                            {freshness?.isDelayedArrival && freshness.provenanceLabel && (
                              <p className="text-[11px] font-editorial-label text-accent-2">
                                {freshness.provenanceLabel}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-2 text-xs font-editorial-label text-muted">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="inline-flex items-center gap-1 num shrink-0">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{article.reading_time_minutes} นาที</span>
                            </span>
                            <span className="num truncate">
                              {article.published_date}
                            </span>
                          </div>

                          <span className="text-ink-2 group-hover:text-accent-2 font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors">
                            <span>อ่านข่าว</span>
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

          {/* BORDERLESS NEWS COMPACT DIGEST MODE */}
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

              <div className="divide-y divide-rule">
                {pagedNews.map((article, idx) => {
                  const isSaved = Boolean(savedNewsMap[article.id]);
                  const freshness = getNewsFreshness?.(article);
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <article
                      key={article.id}
                      onClick={() => onOpenNews(article)}
                      className="group cursor-pointer py-4 px-2 sm:px-3 hover:bg-paper-2 rounded-[8px] transition-colors duration-[var(--dur-micro)] flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        {freshness?.isUnreadNew && (
                          <div className="flex flex-wrap items-center gap-2 pl-8">
                            <FreshnessBadge info={freshness} />
                          </div>
                        )}
                        <h4 className="font-editorial-display text-lg text-ink group-hover:text-accent-2 transition-colors duration-[var(--dur-micro)] leading-snug">
                          <span className="font-mono text-sm text-accent-2 mr-3 num">
                            {String(itemIndex).padStart(2, "0")}
                          </span>
                          {article.hook_headline}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted line-clamp-1 font-editorial-body pl-8">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2.5 flex-wrap text-xs font-editorial-label pl-8 text-muted">
                          <span className="text-accent-2">{article.category}</span>
                          <span className="inline-flex items-center gap-1">
                            <Newspaper className="w-3 h-3 shrink-0" />
                            <span>{article.source}</span>
                          </span>
                          <span className="num">{article.published_date}</span>
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
                          className="relative z-10 p-1.5 rounded-full text-muted hover:text-ink cursor-pointer"
                          title="คั่นหน้าข่าวนี้"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-4 h-4 text-accent-hi" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-ink-2 group-hover:text-accent-2 font-medium inline-flex items-center gap-1 whitespace-nowrap">
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

          {/* Clean Borderless Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-rule flex items-center justify-between gap-4 text-xs font-editorial-label">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[36px] px-4 py-1.5 cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>หน้าก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={currentPage === p}
                    onClick={() => onPageChange(p)}
                    className={`min-w-[34px] min-h-[34px] px-2.5 rounded-full text-xs font-editorial-label num transition-colors duration-[var(--dur-micro)] cursor-pointer ${
                      currentPage === p
                        ? "bg-ink text-paper font-semibold"
                        : "bg-transparent text-muted hover:bg-white/[0.06] hover:text-ink"
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
                className="dusk-pill-ghost inline-flex items-center gap-1 min-h-[36px] px-4 py-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>หน้าถัดไป</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center text-muted text-sm font-editorial-body">
          ไม่พบข่าวสาร AI Lab ที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
        </div>
      )}
    </div>
  );
}
