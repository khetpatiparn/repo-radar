"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import {
  Search,
  Bell,
  BellRing,
  CheckCircle2,
  BookOpen,
  Code2,
  Bookmark,
  Newspaper,
  Sparkles,
  Send,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SyncStatusData } from "../types";
import { formatThaiSyncTime } from "../lib/freshness";

const emptySubscribe = () => () => {};

export type MainSection = "papers" | "repos" | "news" | "saved";

interface HeaderProps {
  updatedAt: string;
  totalItems: number;
  papersCount?: number;
  reposCount?: number;
  newsCount?: number;
  unreadNewCounts?: {
    papers: number;
    repos: number;
    news: number;
    total: number;
  };
  syncStatus?: SyncStatusData;
  activeSection: MainSection;
  onSelectSection: (section: MainSection) => void;
  onJumpToNewSection?: (section: "papers" | "repos" | "news") => void;
  savedCount: number;
  searchQuery: string;
  onSearch: (query: string) => void;
  topHeadline?: string;
  isReaderMode?: boolean;
}

export function Header({
  updatedAt,
  totalItems,
  unreadNewCounts,
  syncStatus,
  activeSection,
  onSelectSection,
  onJumpToNewSection,
  savedCount,
  searchQuery,
  onSearch,
  topHeadline,
  isReaderMode = false,
}: HeaderProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [notifOverride, setNotifOverride] = useState<
    NotificationPermission | "unsupported" | null
  >(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpenWhenScrolled, setSearchOpenWhenScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const effectiveUpdatedAt = syncStatus?.last_sync_at || updatedAt;

  // Scroll-aware dynamic capsule shrink / expand
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setSearchOpenWhenScrolled(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const syncTimeThai = effectiveUpdatedAt
    ? formatThaiSyncTime(effectiveUpdatedAt)
    : "";

  const relativeTime = (() => {
    if (!isClient || !effectiveUpdatedAt) return "";
    try {
      return formatDistanceToNow(new Date(effectiveUpdatedAt), {
        addSuffix: true,
      });
    } catch {
      return "วันนี้";
    }
  })();

  const thaiDateStr = (() => {
    if (!isClient) return "";
    try {
      return new Date().toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  })();

  const notifPermission: NotificationPermission | "unsupported" =
    notifOverride ??
    (!isClient
      ? "default"
      : !("Notification" in window)
      ? "unsupported"
      : Notification.permission);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const sendNotification = (title: string, body: string) => {
    try {
      const notif = new Notification(title, {
        body,
        icon: "/icon.png",
        badge: "/icon.png",
        tag: "reporadar-alert",
      });
      notif.onclick = () => window.focus();
    } catch (e) {
      console.warn("Could not fire notification:", e);
    }
  };

  const handleNotificationClick = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
      return;
    }
    if (Notification.permission === "denied") {
      showToast("การแจ้งเตือนถูกปิดอยู่ กรุณาเปิดสิทธิ์ที่แถบ URL ด้านบน");
      return;
    }
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      setNotifOverride(perm);
      if (perm === "granted") {
        sendNotification(
          "THE REPO RADAR: เปิดรับข่าวสารสำเร็จ",
          topHeadline ||
            "พร้อมส่งสรุปเปเปอร์วิจัยและ GitHub Trending ทุกเช้า 07:00 น."
        );
        showToast("เปิดรับการแจ้งเตือนฉบับเช้าเรียบร้อยแล้ว");
      }
      return;
    }
    sendNotification(
      "THE REPO RADAR: ฉบับวันนี้พร้อมอ่านแล้ว",
      topHeadline || `มีบทความสรุปใหม่ ${totalItems} เรื่องรอให้คุณอ่าน`
    );
    showToast("ส่งการแจ้งเตือนทดสอบไปยังระบบแล้ว");
  };

  const newPapersCount =
    unreadNewCounts?.papers ?? syncStatus?.new_counts.papers ?? 0;
  const newReposCount =
    unreadNewCounts?.repos ?? syncStatus?.new_counts.repos ?? 0;
  const newNewsCount =
    unreadNewCounts?.news ?? syncStatus?.new_counts.news ?? 0;
  const totalNewSyncCount = syncStatus?.new_counts.total ?? 0;

  const showInlineSearch =
    !isScrolled || searchOpenWhenScrolled || Boolean(searchQuery);

  return (
    <>
      {/* ============================================================
       * SCROLL-AWARE FLOATING CAPSULE NAVBAR
       * Wide & airy at top of page -> smoothly shrinks on scroll down
       * ============================================================ */}
      <div className="sticky top-3 z-[var(--z-sticky-nav)] w-full pointer-events-none px-3 sm:px-6 pt-3">
        <div className="flex justify-center">
          <nav
            aria-label="หมวดหมู่หลักของวารสาร"
            data-scrolled={isScrolled ? "true" : "false"}
            className={`capsule-nav pointer-events-auto flex items-center justify-between gap-2 max-w-full ${
              isScrolled
                ? "w-auto max-w-[880px] px-2 py-1.5"
                : "w-full max-w-[1260px] px-2.5 sm:px-3.5 py-2"
            }`}
          >
            {/* Left Brand Emblem (wordmark tucks in smoothly on scroll) */}
            <button
              type="button"
              onClick={() => {
                onSelectSection("papers");
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2.5 pl-1 pr-2 py-0.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="กลับหน้าแรก THE REPO RADAR"
            >
              <span
                className={`rounded-full grad-brand flex items-center justify-center font-editorial-display font-bold text-white shadow-[var(--shadow-ember-glow)] shrink-0 transition-all duration-200 ${
                  isScrolled ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-xs"
                }`}
              >
                RR
              </span>
              {!isScrolled && (
                <span className="hidden md:inline font-editorial-display text-sm font-bold tracking-tight text-ink whitespace-nowrap">
                  THE REPO RADAR
                </span>
              )}
            </button>

            {/* Center Editorial Section Tabs */}
            <div className="flex items-center gap-1 rail-fade min-w-0">
              <button
                type="button"
                aria-current={activeSection === "papers" ? "page" : undefined}
                onClick={() => onSelectSection("papers")}
                className={`inline-flex items-center gap-1.5 rounded-full border font-editorial-label transition-all duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  isScrolled
                    ? "min-h-[32px] px-2.5 sm:px-3 py-1 text-xs"
                    : "min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm"
                } ${
                  activeSection === "papers"
                    ? "bg-ink text-paper border-ink font-semibold shadow-sm"
                    : "bg-transparent text-ink-2 border-transparent hover:bg-white/8 hover:text-ink"
                }`}
              >
                {activeSection === "papers" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                    aria-hidden="true"
                  />
                )}
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>เปเปอร์วิจัย AI</span>
                {newPapersCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] num ${
                      activeSection === "papers"
                        ? "bg-accent text-white"
                        : "bg-accent-soft text-accent-2 border border-accent/40"
                    }`}
                  >
                    +{newPapersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-current={activeSection === "repos" ? "page" : undefined}
                onClick={() => onSelectSection("repos")}
                className={`inline-flex items-center gap-1.5 rounded-full border font-editorial-label transition-all duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  isScrolled
                    ? "min-h-[32px] px-2.5 sm:px-3 py-1 text-xs"
                    : "min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm"
                } ${
                  activeSection === "repos"
                    ? "bg-ink text-paper border-ink font-semibold shadow-sm"
                    : "bg-transparent text-ink-2 border-transparent hover:bg-white/8 hover:text-ink"
                }`}
              >
                {activeSection === "repos" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                    aria-hidden="true"
                  />
                )}
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>GitHub Repos</span>
                {newReposCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] num ${
                      activeSection === "repos"
                        ? "bg-accent text-white"
                        : "bg-accent-soft text-accent-2 border border-accent/40"
                    }`}
                  >
                    +{newReposCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-current={activeSection === "news" ? "page" : undefined}
                onClick={() => onSelectSection("news")}
                className={`inline-flex items-center gap-1.5 rounded-full border font-editorial-label transition-all duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  isScrolled
                    ? "min-h-[32px] px-2.5 sm:px-3 py-1 text-xs"
                    : "min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm"
                } ${
                  activeSection === "news"
                    ? "bg-ink text-paper border-ink font-semibold shadow-sm"
                    : "bg-transparent text-ink-2 border-transparent hover:bg-white/8 hover:text-ink"
                }`}
              >
                {activeSection === "news" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                    aria-hidden="true"
                  />
                )}
                <Newspaper className="w-3.5 h-3.5 shrink-0" />
                <span>ข่าว AI Lab</span>
                {newNewsCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] num ${
                      activeSection === "news"
                        ? "bg-accent text-white"
                        : "bg-accent-soft text-accent-2 border border-accent/40"
                    }`}
                  >
                    +{newNewsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-current={activeSection === "saved" ? "page" : undefined}
                onClick={() => onSelectSection("saved")}
                className={`inline-flex items-center gap-1.5 rounded-full border font-editorial-label transition-all duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                  isScrolled
                    ? "min-h-[32px] px-2.5 sm:px-3 py-1 text-xs"
                    : "min-h-[36px] px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm"
                } ${
                  activeSection === "saved"
                    ? "bg-accent text-accent-ink border-accent font-semibold shadow-[var(--shadow-ember-glow)]"
                    : "bg-transparent text-ink-2 border-transparent hover:bg-white/8 hover:text-ink"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                <span>คั่นหน้า ({savedCount})</span>
              </button>
            </div>

            {/* Right Search + Notification Bell */}
            <div className="flex items-center gap-1.5 shrink-0 relative">
              {showInlineSearch ? (
                <div
                  className={`relative transition-all duration-200 ${
                    isScrolled
                      ? "w-36 sm:w-44"
                      : "w-36 sm:w-48 lg:w-56"
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    name="search"
                    aria-label="ค้นหาบทความ หัวข้อ ภาษา"
                    value={searchQuery}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpenWhenScrolled(false);
                    }}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="ค้นหาบทความ, หัวข้อ, ภาษา..."
                    className={`w-full pl-8 pr-7 py-1 text-xs sm:text-sm font-editorial-label rounded-full border border-rule-2 bg-paper-3/90 text-ink placeholder:text-muted focus:bg-paper focus:border-accent-hi focus:outline-none ${
                      isScrolled ? "min-h-[32px]" : "min-h-[36px]"
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearch("")}
                      aria-label="ล้างคำค้นหา"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpenWhenScrolled(true);
                    setTimeout(() => searchInputRef.current?.focus(), 40);
                  }}
                  aria-label="เปิดช่องค้นหา"
                  title="ค้นหาบทความ"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-paper-3 border border-rule text-ink-2 hover:text-ink hover:border-accent-hi transition-colors cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleNotificationClick}
                aria-label={
                  notifPermission === "granted"
                    ? "แจ้งเตือนฉบับเช้า: เปิดอยู่"
                    : "เปิดแจ้งเตือนฉบับเช้า"
                }
                title={
                  notifPermission === "granted"
                    ? "รับข่าวเช้า: เปิด (คลิกเพื่อทดสอบ)"
                    : "เปิดแจ้งเตือนฉบับเช้าบนเบราว์เซอร์"
                }
                className={`inline-flex items-center justify-center rounded-full border transition-colors duration-[var(--dur-micro)] cursor-pointer shrink-0 ${
                  isScrolled ? "w-8 h-8" : "w-9 h-9"
                } ${
                  notifPermission === "granted"
                    ? "bg-accent text-accent-ink border-accent"
                    : "bg-paper-3 text-ink-2 border-rule hover:text-ink hover:border-accent-hi"
                }`}
              >
                {notifPermission === "granted" ? (
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                )}
              </button>

              {toastMsg && (
                <div
                  role="status"
                  className="dusk-glass absolute right-0 top-full mt-2 z-50 whitespace-nowrap text-ink border border-rule-2 text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-accent-hi" />
                  <span>{toastMsg}</span>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* ============================================================
       * COMPACT EDITORIAL MASTHEAD & LIVE SYNC PULSE STRIP
       * Minimal vertical footprint so front-page journalism leads immediately
       * ============================================================ */}
      {!isReaderMode && (
        <header className="w-full relative overflow-hidden border-b border-rule/80">
          {/* Ambient Ember Corner Wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-0 w-[440px] h-[200px] rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, #ea580c 0%, #c2410c 45%, transparent 72%)",
            }}
          />

          <div className="container relative z-10 pt-5 pb-4 sm:pt-6 sm:pb-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* Editorial Title Lockup */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-editorial-display text-2xl sm:text-3xl lg:text-[2.15rem] leading-none text-ink tracking-tight">
                  THE REPO RADAR
                </h1>
                {totalNewSyncCount > 0 && (
                  <span className="badge-new-ember inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-editorial-label num">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>+{totalNewSyncCount} อัปเดตใหม่วันนี้</span>
                  </span>
                )}
                {thaiDateStr && (
                  <span className="hidden sm:inline text-xs font-editorial-label text-muted border-l border-rule pl-2.5">
                    {thaiDateStr}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted font-editorial-body max-w-2xl leading-relaxed">
                วารสารสรุปงานวิจัย AI มาแรงจาก Hugging Face, โปรเจกต์ GitHub
                Trending และข่าวสาร AI Lab จาก Google Blog — อ่านง่ายสไตล์เทคบล็อก
              </p>
            </div>

            {/* Live Sync Verification Pill Strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-2 border border-rule text-ink">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-accent-hi ember-pulse-dot shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {syncTimeThai
                    ? `ซิงก์ล่าสุด: ${syncTimeThai}`
                    : "ซิงก์ฉบับวันนี้แล้ว"}
                </span>
                {relativeTime && (
                  <span className="hidden xl:inline text-muted">
                    ({relativeTime})
                  </span>
                )}
              </div>

              {syncStatus && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="sr-only">เข้าใหม่วันนี้:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToNewSection
                        ? onJumpToNewSection("papers")
                        : onSelectSection("papers")
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-accent-soft border border-accent/40 text-accent-2 hover:border-accent-hi transition-colors cursor-pointer num"
                    title="ดูเปเปอร์วิจัยใหม่ที่เข้าวันนี้"
                  >
                    <span>+{syncStatus.new_counts.papers} เปเปอร์</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToNewSection
                        ? onJumpToNewSection("repos")
                        : onSelectSection("repos")
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-paper-2 border border-rule text-ink-2 hover:border-accent-hi hover:text-ink transition-colors cursor-pointer num"
                    title="ดู GitHub Repos ใหม่ที่เข้าวันนี้"
                  >
                    <span>+{syncStatus.new_counts.repos} Repos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToNewSection
                        ? onJumpToNewSection("news")
                        : onSelectSection("news")
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-paper-2 border border-rule text-ink-2 hover:border-accent-hi hover:text-ink transition-colors cursor-pointer num"
                    title="ดูข่าว Google AI ใหม่ที่เข้าวันนี้"
                  >
                    <span>+{syncStatus.new_counts.news} ข่าว Google</span>
                  </button>

                  <span
                    className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-[11px] ${
                      syncStatus.telegram_sent_at
                        ? "bg-success-soft border-success/35 text-success"
                        : "bg-paper-2 border-rule text-muted"
                    }`}
                    title={
                      syncStatus.telegram_sent_at
                        ? `ส่งแจ้งเตือนเข้า Telegram แล้วเมื่อ ${formatThaiSyncTime(syncStatus.telegram_sent_at)}`
                        : "Telegram Alert พร้อมเชื่อมต่อ"
                    }
                  >
                    <Send className="w-3 h-3 shrink-0" />
                    <span>
                      {syncStatus.telegram_sent_at
                        ? "Telegram ส่งแล้ว"
                        : "Telegram พร้อมใช้"}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>
      )}
    </>
  );
}
