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
    <header className="border-b border-[var(--paper-rule)] bg-[var(--paper-sheet)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-8">
        {/* Top Dateline & Utility Ribbon */}
        <div className="py-2.5 border-b border-[var(--paper-rule)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--paper-muted)]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--paper-ink)] uppercase tracking-wider">
              ฉบับประจำ{thaiDateStr || "วันนี้"}
            </span>
            <span>•</span>
            <span>ตีพิมพ์อัตโนมัติทุกเช้า 07:00 น.</span>
            {relativeTime && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  ซิงก์ข้อมูลล่าสุด {relativeTime}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Eye-comfort Paper / Night Mode Switch */}
            <button
              onClick={onToggleNightMode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:border-[var(--paper-rule-strong)] transition cursor-pointer font-medium"
              title="สลับโหมดสีกระดาษถนอมสายตา / โหมดอ่านกลางคืน"
            >
              {isNightMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[var(--paper-amber)]" />
                  <span>กระดาษถนอมสายตา</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[var(--paper-muted)]" />
                  <span>โหมดอ่านกลางคืน</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:border-[var(--paper-rule-strong)] transition cursor-pointer font-medium"
              >
                {notifPermission === "granted" ? (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-[var(--paper-green)]" />
                    <span className="hidden sm:inline">รับข่าวเช้า: เปิด</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[var(--paper-muted)]" />
                    <span className="hidden sm:inline">แจ้งเตือนฉบับเช้า</span>
                  </>
                )}
              </button>

              {toastMsg && (
                <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-[var(--paper-ink)] text-[var(--paper-sheet)] text-xs px-3 py-1.5 rounded shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centerpiece Newspaper Masthead */}
        <div className="py-6 sm:py-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--paper-muted)] mb-2 font-mono">
            <span>VOL. 2026</span>
            <span>•</span>
            <span>OPEN SOURCE & AI RESEARCH CHRONICLE</span>
            <span>•</span>
            <span>THAI EDITION</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="RepoRadar Seal"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-md opacity-90"
            />
            <h1 className="font-masthead text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--paper-ink)]">
              THE REPO RADAR
            </h1>
          </div>

          <p className="mt-2.5 text-sm sm:text-base text-[var(--paper-muted)] max-w-2xl mx-auto font-editorial">
            วารสารสรุปงานวิจัย AI มาแรงจาก Hugging Face และโปรเจกต์ GitHub
            Trending — ย่อยเรื่องยากให้เป็นภาษาคนทั่วไป อ่านสบายตาเหมือนอ่านหนังสือ
          </p>
        </div>

        {/* Double Hairline Newspaper Section Bar */}
        <div className="border-t-2 border-b border-[var(--paper-rule-strong)] py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <nav
            aria-label="หมวดหมู่หลักของวารสาร"
            className="flex flex-wrap items-center gap-1.5 sm:gap-2"
          >
            <button
              onClick={() => onSelectSection("papers")}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition cursor-pointer ${
                activeSection === "papers"
                  ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>คอลัมน์เปเปอร์วิจัย AI (Daily Papers)</span>
            </button>

            <button
              onClick={() => onSelectSection("repos")}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition cursor-pointer ${
                activeSection === "repos"
                  ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>คอลัมน์โอเพนซอร์ส (GitHub Repos)</span>
            </button>

            <button
              onClick={() => onSelectSection("saved")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded text-sm font-semibold transition cursor-pointer ${
                activeSection === "saved"
                  ? "bg-[var(--paper-accent)] text-white"
                  : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>ที่คั่นหน้าไว้ ({savedCount})</span>
            </button>
          </nav>

          {/* Clean Newspaper Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[var(--paper-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ค้นหาบทความ, หัวข้อวิจัย, ภาษา..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] placeholder-[var(--paper-muted)] focus:outline-none focus:border-[var(--paper-rule-strong)]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
