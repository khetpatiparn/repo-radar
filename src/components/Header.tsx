"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  BellRing,
  CheckCircle2,
  BookOpen,
  Code2,
  Bookmark,
  Newspaper,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export type MainSection = "papers" | "repos" | "news" | "saved";

interface HeaderProps {
  updatedAt: string;
  totalItems: number;
  activeSection: MainSection;
  onSelectSection: (section: MainSection) => void;
  savedCount: number;
  searchQuery: string;
  onSearch: (query: string) => void;
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

  return (
    <header className="w-full bg-paper border-b border-rule">
      <div className="container">
        {/* Top Dateline & Notification Strip */}
        <div className="py-2.5 border-b border-rule flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-editorial-label text-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
            <span className="text-ink font-medium truncate">
              {thaiDateStr ? `ฉบับประจำ${thaiDateStr}` : "ฉบับประจำวันนี้"}
            </span>
            <span className="hidden sm:inline border-l border-rule pl-4">
              ตีพิมพ์อัตโนมัติทุกเช้า 07:00 น.
            </span>
            {relativeTime && (
              <span className="hidden md:inline border-l border-rule pl-4">
                ซิงก์ข้อมูล {relativeTime}
              </span>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleNotificationClick}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 border border-rule-2 bg-paper text-ink hover:bg-paper-2 transition-colors duration-[var(--dur-micro)] cursor-pointer whitespace-nowrap text-xs sm:text-sm font-editorial-label"
            >
              {notifPermission === "granted" ? (
                <>
                  <BellRing className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="hidden sm:inline">รับข่าวเช้า: เปิด</span>
                  <span className="sm:hidden">เปิด</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="hidden sm:inline">แจ้งเตือนฉบับเช้า</span>
                  <span className="sm:hidden">แจ้งเตือน</span>
                </>
              )}
            </button>

            {toastMsg && (
              <div
                role="status"
                className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-ink text-paper text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{toastMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Masthead */}
        <div className="py-5 sm:py-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b-4 border-ink">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="RepoRadar Seal"
                width={38}
                height={38}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0"
              />
              <h1 className="font-editorial-display text-3xl sm:text-5xl md:text-6xl leading-none text-ink max-w-none">
                THE REPO RADAR
              </h1>
            </div>
            <p className="text-sm sm:text-base text-ink-2 font-editorial-body max-w-2xl leading-relaxed">
              วารสารสรุปงานวิจัย AI มาแรงจาก Hugging Face, โปรเจกต์ GitHub
              Trending และข่าวสาร AI Lab จาก Google Blog (อ่านสบายตาในสไตล์สิ่งพิมพ์)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm font-editorial-label text-muted shrink-0">
            <span>ฉบับปี 2026</span>
            <span className="border-l border-rule pl-4">AI Research &amp; Open Source</span>
            <span className="border-l border-rule pl-4">Thai Edition</span>
          </div>
        </div>

        {/* Primary Navigation Rail & Search */}
        <div className="py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <nav
            aria-label="หมวดหมู่หลักของวารสาร"
            className="flex items-center gap-1.5 rail-fade py-0.5"
          >
            <button
              type="button"
              onClick={() => onSelectSection("papers")}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                activeSection === "papers"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-transparent hover:bg-paper-2 hover:border-rule"
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">คอลัมน์เปเปอร์วิจัย AI (Daily Papers)</span>
              <span className="sm:hidden">เปเปอร์วิจัย AI</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("repos")}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                activeSection === "repos"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-transparent hover:bg-paper-2 hover:border-rule"
              }`}
            >
              <Code2 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">คอลัมน์โอเพนซอร์ส (GitHub Repos)</span>
              <span className="sm:hidden">GitHub Repos</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("news")}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                activeSection === "news"
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper text-ink-2 border-transparent hover:bg-paper-2 hover:border-rule"
              }`}
            >
              <Newspaper className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">คอลัมน์ข่าวสาร AI Lab (Google Blog)</span>
              <span className="sm:hidden">ข่าว AI Lab</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectSection("saved")}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-editorial-label border transition-colors duration-[var(--dur-micro)] shrink-0 whitespace-nowrap cursor-pointer ${
                activeSection === "saved"
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-paper text-ink-2 border-transparent hover:bg-paper-2 hover:border-rule"
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">ที่คั่นหน้าไว้ ({savedCount})</span>
              <span className="sm:hidden">คั่นหน้า ({savedCount})</span>
            </button>
          </nav>

          {/* Editorial Search Input */}
          <div className="relative w-full md:w-64 lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              name="search"
              aria-label="ค้นหาบทความ หัวข้อ ภาษา"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="ค้นหาบทความ, หัวข้อ, ภาษา..."
              className="w-full min-h-[40px] pl-9 pr-3 py-1.5 text-sm font-editorial-label border border-rule-2 bg-paper text-ink placeholder:text-muted focus:border-ink"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
