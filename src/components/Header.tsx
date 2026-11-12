"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  BellRing,
  CheckCircle2,
  Sun,
  Moon,
  BookOpen,
  Code2,
  Bookmark,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type MainSection = "papers" | "repos" | "saved";

interface HeaderProps {
  updatedAt: string;
  totalItems: number;
  activeSection: MainSection;
  onSelectSection: (section: MainSection) => void;
  savedCount: number;
  searchQuery: string;
  onSearch: (query: string) => void;
  isNightMode: boolean;
  onToggleNightMode: () => void;
  topHeadline?: string;
}

export function Header({
  updatedAt,
  totalItems,
  activeSection,
  onSelectSection,
  savedCount,
  searchQuery,
  onSearch,
  isNightMode,
  onToggleNightMode,
  topHeadline,
}: HeaderProps) {
  const [relativeTime, setRelativeTime] = useState("");
  const [thaiDateStr, setThaiDateStr] = useState("");
  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (updatedAt) {
      try {
        setRelativeTime(
          formatDistanceToNow(new Date(updatedAt), { addSuffix: true })
        );
        setThaiDateStr(
          new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      } catch {
        setRelativeTime("วันนี้");
      }
    }
  }, [updatedAt]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(Notification.permission);
  }, []);

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
      setNotifPermission(perm);
      if (perm === "granted") {
        sendNotification(
          "THE REPO RADAR // เปิดรับข่าวสารสำเร็จ",
          topHeadline || `พร้อมส่งสรุปเปเปอร์วิจัยและ GitHub Trending ทุกเช้า 07:00 น.`
        );
        showToast("เปิดรับการแจ้งเตือนฉบับเช้าเรียบร้อยแล้ว");
      }
      return;
    }
    sendNotification(
      "THE REPO RADAR // ฉบับวันนี้พร้อมอ่านแล้ว",
      topHeadline || `มีบทความสรุปใหม่ ${totalItems} เรื่องรอให้คุณอ่าน`
    );
    showToast("ส่งการแจ้งเตือนทดสอบไปยังระบบแล้ว");
  };

  return (
    <header className="border-b border-[var(--paper-rule)] bg-[var(--paper-sheet)] transition-colors w-full">
      <div className="w-full px-4 sm:px-8 lg:px-10">
        {/* Top Dateline & Utility Ribbon */}
        <div className="py-2 border-b border-[var(--paper-rule)] flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-[var(--paper-muted)]">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-[var(--paper-ink)] uppercase tracking-wider truncate">
              {thaiDateStr ? `ฉบับประจำ${thaiDateStr}` : "ฉบับประจำวันนี้"}
            </span>
            <span className="text-[var(--paper-rule-strong)] hidden xs:inline">•</span>
            <span className="hidden sm:inline">ตีพิมพ์อัตโนมัติทุกเช้า 07:00 น.</span>
            {relativeTime && (
              <>
                <span className="hidden md:inline text-[var(--paper-rule-strong)]">•</span>
                <span className="hidden md:inline">
                  ซิงก์ข้อมูล {relativeTime}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Eye-comfort Paper / Night Mode Switch */}
            <button
              onClick={onToggleNightMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:border-[var(--paper-rule-strong)] transition cursor-pointer font-medium active:scale-95 text-[11px] sm:text-xs"
              title="สลับโหมดสีกระดาษถนอมสายตา / โหมดอ่านกลางคืน"
            >
              {isNightMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--paper-amber)] shrink-0" />
                  <span className="hidden xs:inline">กระดาษถนอมสายตา</span>
                  <span className="xs:hidden">ถนอมสายตา</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--paper-muted)] shrink-0" />
                  <span className="hidden xs:inline">โหมดอ่านกลางคืน</span>
                  <span className="xs:hidden">กลางคืน</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:border-[var(--paper-rule-strong)] transition cursor-pointer font-medium active:scale-95 text-[11px] sm:text-xs"
              >
                {notifPermission === "granted" ? (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-[var(--paper-green)] shrink-0" />
                    <span className="hidden sm:inline">รับข่าวเช้า: เปิด</span>
                    <span className="sm:hidden">เปิด</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[var(--paper-muted)] shrink-0" />
                    <span className="hidden sm:inline">แจ้งเตือนฉบับเช้า</span>
                    <span className="sm:hidden">แจ้งเตือน</span>
                  </>
                )}
              </button>

              {toastMsg && (
                <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-[var(--paper-ink)] text-[var(--paper-sheet)] text-xs px-3 py-1.5 rounded shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centerpiece Newspaper Masthead */}
        <div className="py-5 sm:py-7 md:py-8 text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--paper-muted)] mb-1.5 sm:mb-2 font-mono flex-wrap justify-center">
            <span>VOL. 2026</span>
            <span>•</span>
            <span className="hidden xs:inline">AI RESEARCH & OPEN SOURCE</span>
            <span className="xs:hidden">AI & OSS</span>
            <span>•</span>
            <span>THAI EDITION</span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="RepoRadar Seal"
              className="w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded opacity-90 shrink-0"
            />
            <h1 className="font-masthead text-2xl xs:text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--paper-ink)]">
              THE REPO RADAR
            </h1>
          </div>

          <p className="mt-2 text-xs sm:text-sm md:text-base text-[var(--paper-muted)] max-w-2xl mx-auto font-editorial px-2 leading-relaxed">
            วารสารสรุปงานวิจัย AI มาแรงจาก Hugging Face และโปรเจกต์ GitHub
            Trending — ย่อยเรื่องยากให้เป็นภาษาคนทั่วไป อ่านสบายตาเหมือนอ่านหนังสือ
          </p>
        </div>

        {/* Double Hairline Newspaper Section Bar */}
        <div className="border-t-2 border-b border-[var(--paper-rule-strong)] py-2 sm:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Scrollable Navigation on Mobile & Tablet */}
          <nav
            aria-label="หมวดหมู่หลักของวารสาร"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
          >
            <button
              onClick={() => onSelectSection("papers")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                activeSection === "papers"
                  ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">คอลัมน์เปเปอร์วิจัย AI (Daily Papers)</span>
              <span className="sm:hidden">เปเปอร์วิจัย AI</span>
            </button>

            <button
              onClick={() => onSelectSection("repos")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                activeSection === "repos"
                  ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)] shadow-xs"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">คอลัมน์โอเพนซอร์ส (GitHub Repos)</span>
              <span className="sm:hidden">GitHub Repos</span>
            </button>

            <button
              onClick={() => onSelectSection("saved")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-semibold transition shrink-0 cursor-pointer active:scale-95 ${
                activeSection === "saved"
                  ? "bg-[var(--paper-accent)] text-white shadow-xs"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">ที่คั่นหน้าไว้ ({savedCount})</span>
              <span className="sm:hidden">คั่นหน้า ({savedCount})</span>
            </button>
          </nav>

          {/* Clean Newspaper Search Box */}
          <div className="relative w-full md:w-64 lg:w-72">
            <Search className="w-4 h-4 text-[var(--paper-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ค้นหาบทความ, หัวข้อ, ภาษา..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] placeholder-[var(--paper-muted)] focus:outline-none focus:border-[var(--paper-rule-strong)]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
