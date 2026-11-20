"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  type PaperData,
  type RepositoryData,
  type NewsArticleData,
} from "../types";
import type { FreshnessInfo } from "../lib/freshness";
import {
  buildPaperFacebookPost,
  buildRepoFacebookPost,
  buildNewsFacebookPost,
  copyTextWithFallback,
} from "../lib/facebookPost";
import { FreshnessBadge } from "./FreshnessBadge";
import {
  Pass1TriageStrip,
  GlossaryScaffolding,
  Pass2MechanismAndEvidence,
  Pass3HandsOnDrawer,
} from "./DeepReadingBlocks";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ExternalLink,
  FileText,
  Code2,
  Clock,
  ThumbsUp,
  Star,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Newspaper,
  Building2,
  Flame,
  Share2,
  Type,
  RotateCcw,
} from "lucide-react";

type FontSizeScale = "normal" | "large" | "xlarge";

interface TocItem {
  id: string;
  num: string;
  label: string;
}

interface ArticleReaderProps {
  paper?: PaperData | null;
  repo?: RepositoryData | null;
  news?: NewsArticleData | null;
  freshness?: FreshnessInfo;
  isSaved: boolean;
  onToggleSave: () => void;
  onBack: () => void;
  isTwoDayStreak?: boolean;
  starsAddedSinceYesterday?: number;
}

function ReaderTopBar({
  onBack,
  fontSize,
  setFontSize,
  isSaved,
  onToggleSave,
}: {
  onBack: () => void;
  fontSize: FontSizeScale;
  setFontSize: (scale: FontSizeScale) => void;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="pb-4 mb-8 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 text-sm font-editorial-label cursor-pointer self-start whitespace-nowrap"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>กลับไปหน้าหนังสือพิมพ์</span>
      </button>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center rounded-full bg-paper-2 p-0.5 text-xs font-editorial-label">
          <span className="px-3 py-1 text-muted whitespace-nowrap">
            ขนาดอักษร
          </span>
          <button
            type="button"
            aria-pressed={fontSize === "normal"}
            onClick={() => setFontSize("normal")}
            className={`min-h-[32px] px-3 py-1 rounded-full cursor-pointer transition-colors duration-[var(--dur-micro)] whitespace-nowrap ${
              fontSize === "normal"
                ? "bg-ink text-paper font-semibold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            ก
          </button>
          <button
            type="button"
            aria-pressed={fontSize === "large"}
            onClick={() => setFontSize("large")}
            className={`min-h-[32px] px-3 py-1 rounded-full cursor-pointer transition-colors duration-[var(--dur-micro)] whitespace-nowrap ${
              fontSize === "large"
                ? "bg-ink text-paper font-semibold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            ก+
          </button>
          <button
            type="button"
            aria-pressed={fontSize === "xlarge"}
            onClick={() => setFontSize("xlarge")}
            className={`min-h-[32px] px-3 py-1 rounded-full cursor-pointer transition-colors duration-[var(--dur-micro)] whitespace-nowrap ${
              fontSize === "xlarge"
                ? "bg-ink text-paper font-semibold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            ก++
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={isSaved}
          className={`inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full transition-colors duration-[var(--dur-micro)] cursor-pointer shrink-0 whitespace-nowrap ${
            isSaved
              ? "bg-accent text-accent-ink"
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
  );
}

function ReaderDesktopToc({
  title,
  items,
}: {
  title: string;
  items: TocItem[];
}) {
  return (
    <div className="p-5 bg-paper-2 rounded-[var(--radius-card)]">
      <div className="flex items-center gap-2 text-sm font-editorial-label text-ink pb-3 mb-3 border-b border-rule">
        <BookOpen className="w-4 h-4 text-accent-hi shrink-0" />
        <span>{title}</span>
      </div>
      <nav className="space-y-1.5 text-sm font-editorial-body">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-start gap-2.5 py-1 text-muted hover:text-ink"
          >
            <span className="font-editorial-label text-xs text-accent-hi mt-0.5 shrink-0 num">
              {item.num}
            </span>
            <span className="leading-snug">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function ReaderMobileToc({
  summaryLabel,
  countText,
  items,
}: {
  summaryLabel: string;
  countText: string;
  items: TocItem[];
}) {
  return (
    <details className="lg:hidden mb-6 editorial-well p-4 text-sm">
      <summary className="font-editorial-label text-ink cursor-pointer flex items-center justify-between select-none">
        <span className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent-hi shrink-0" />
          <span>{summaryLabel}</span>
        </span>
        <span className="text-xs text-muted">{countText}</span>
      </summary>
      <nav className="mt-3 pt-3 border-t border-rule space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-2.5 py-1 text-ink-2 hover:text-accent-2"
          >
            <span className="font-editorial-label text-xs text-accent-hi num">
              {item.num}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </details>
  );
}

function FacebookShareStudio({
  sectionId,
  sectionNum,
  initialDraft,
  draft,
  onChangeDraft,
  onCopyDraft,
  copiedFb,
  fbLiveStatus,
}: {
  sectionId: string;
  sectionNum: string;
  initialDraft: string;
  draft: string;
  onChangeDraft: (val: string) => void;
  onCopyDraft: () => void;
  copiedFb: boolean;
  fbLiveStatus: string;
}) {
  const isEdited = draft !== initialDraft;

  return (
    <details
      id={sectionId}
      className="group rounded-[var(--radius-card)] bg-paper-2 transition-colors"
    >
      <summary className="list-none cursor-pointer px-5 sm:px-6 py-4 flex items-center justify-between gap-4 select-none">
        <div className="min-w-0 space-y-0.5">
          <div className="font-editorial-display text-lg text-ink flex items-center gap-2">
            <span className="font-editorial-label text-xs text-accent-hi num">
              {`${sectionNum} //`}
            </span>
            <span>ฉบับร่างโพสต์ Facebook (พร้อมแชร์ลงเพจ)</span>
          </div>
          <p className="text-xs text-muted font-editorial-body">
            พับเก็บไว้ให้ไม่กวนตา — กดเปิดเมื่อต้องการแก้ไขหรือคัดลอกไปแชร์ในอนาคต
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-editorial-label text-muted group-hover:text-ink shrink-0">
          <span className="group-open:hidden">กดเปิดฉบับร่าง</span>
          <span className="hidden group-open:inline">พับเก็บ</span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>

      <div className="px-5 sm:px-6 pb-6 pt-4 border-t border-rule space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-muted font-editorial-body">
            เรียบเรียงจากข้อเท็จจริงในบทความ — ปรับแต่งข้อความแล้วกดคัดลอกได้เลย
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {isEdited && (
              <button
                type="button"
                onClick={() => onChangeDraft(initialDraft)}
                className="dusk-pill-ghost inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-editorial-label cursor-pointer whitespace-nowrap"
                title="คืนค่าฉบับร่างตั้งต้น"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>รีเซ็ต</span>
              </button>
            )}
            <button
              type="button"
              onClick={onCopyDraft}
              className="dusk-pill-primary inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 text-xs sm:text-sm font-editorial-label cursor-pointer whitespace-nowrap"
            >
              {copiedFb ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>คัดลอกโพสต์แล้ว</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>คัดลอกโพสต์ลง Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live region strictly outside the button, empty until a copy */}
        <span role="status" aria-live="polite" className="visually-hidden">
          {fbLiveStatus}
        </span>

        <div className="space-y-2">
          <label htmlFor={`${sectionId}-textarea`} className="visually-hidden">
            ข้อความฉบับร่างโพสต์ Facebook
          </label>
          <textarea
            id={`${sectionId}-textarea`}
            value={draft}
            onChange={(e) => onChangeDraft(e.target.value)}
            rows={11}
            className="w-full p-4 rounded-[var(--radius-inner)] bg-paper border border-rule-2 text-sm text-ink-2 font-editorial-body leading-relaxed focus:border-accent-hi focus:outline-none resize-y"
          />
          <div className="flex items-center justify-between text-xs font-editorial-label text-muted">
            <span>ปรับแต่งข้อความได้อิสระก่อนกดคัดลอก</span>
            <span className="num">{draft.length.toLocaleString()} ตัวอักษร</span>
          </div>
        </div>
      </div>
    </details>
  );
}

export function ArticleReader({
  paper,
  repo,
  news,
  freshness,
  isSaved,
  onToggleSave,
  onBack,
  isTwoDayStreak = false,
  starsAddedSinceYesterday = 0,
}: ArticleReaderProps) {
  const [fontSize, setFontSize] = useState<FontSizeScale>("normal");
  const [copiedCode, setCopiedCode] = useState(false);
  const [codeLiveStatus, setCodeLiveStatus] = useState("");
  const [copiedFb, setCopiedFb] = useState(false);
  const [fbLiveStatus, setFbLiveStatus] = useState("");
  const [failedImgUrl, setFailedImgUrl] = useState<string | null>(null);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const fbCopyToggleRef = useRef(false);
  const codeCopyToggleRef = useRef(false);

  const articleKey = paper
    ? `paper:${paper.id}`
    : repo
    ? `repo:${repo.id}`
    : news
    ? `news:${news.id}`
    : "";

  const currentThumbUrl = paper?.thumbnail_url || news?.thumbnail_url || "";
  const imgError = Boolean(currentThumbUrl && failedImgUrl === currentThumbUrl);
  const setImgError = (hasError: boolean) => {
    setFailedImgUrl(hasError ? currentThumbUrl : null);
  };

  const initialFbDraft = useMemo(() => {
    if (paper) return buildPaperFacebookPost(paper);
    if (repo) return buildRepoFacebookPost(repo);
    if (news) return buildNewsFacebookPost(news);
    return "";
  }, [paper, repo, news]);

  const [editedFbDraft, setEditedFbDraft] = useState<{
    key: string;
    value: string;
  } | null>(null);

  const fbDraft =
    editedFbDraft && editedFbDraft.key === articleKey
      ? editedFbDraft.value
      : initialFbDraft;

  const setFbDraft = (value: string) => {
    setEditedFbDraft({ key: articleKey, value });
  };

  // Escape key returns instantly to feed without scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      onBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  // Live reading progress for Floating Bottom Reader Dock (zero React re-renders on scroll)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let rafId = 0;
    const paintProgress = () => {
      rafId = 0;
      const doc = document.documentElement;
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
      const pct = Math.round(ratio * 100);
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${pct}%`;
      }
      if (progressContainerRef.current) {
        progressContainerRef.current.setAttribute(
          "aria-label",
          `ความคืบหน้าการอ่าน ${pct} เปอร์เซ็นต์`
        );
      }
    };
    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(paintProgress);
      }
    };
    paintProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handleCopyFacebookPost = async () => {
    const ok = await copyTextWithFallback(fbDraft);
    if (ok) {
      setCopiedFb(true);
      fbCopyToggleRef.current = !fbCopyToggleRef.current;
      setFbLiveStatus(
        `คัดลอกโพสต์ Facebook เรียบร้อยแล้ว${fbCopyToggleRef.current ? "" : "\u00A0"}`
      );
      setTimeout(() => setCopiedFb(false), 2200);
    } else {
      setFbLiveStatus("ไม่สามารถคัดลอกอัตโนมัติได้ กรุณาคัดลอกจากกล่องข้อความด้านล่าง");
    }
  };

  const handleCopyQuickStart = async (text: string) => {
    const ok = await copyTextWithFallback(text);
    if (ok) {
      setCopiedCode(true);
      codeCopyToggleRef.current = !codeCopyToggleRef.current;
      setCodeLiveStatus(
        `คัดลอกคำสั่งเรียบร้อยแล้ว${codeCopyToggleRef.current ? "" : "\u00A0"}`
      );
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const cycleFontSize = () => {
    setFontSize((prev) =>
      prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal"
    );
  };

  const fontSizeClass =
    fontSize === "xlarge"
      ? "text-xl leading-9"
      : fontSize === "large"
      ? "text-[18.5px] leading-8"
      : "text-[17px] leading-8";

  const renderFloatingDock = () => (
    <div
      role="toolbar"
      aria-label="แถบเครื่องมืออ่านบทความด่วน"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[var(--z-sticky)] max-w-[94vw] pointer-events-auto"
    >
      <div className="reader-dock px-2.5 py-2 flex items-center gap-1.5 sm:gap-2">
        {/* Instant Back Button — always reachable from any scroll depth */}
        <button
          type="button"
          onClick={onBack}
          className="dusk-pill-primary inline-flex items-center gap-1.5 min-h-[36px] px-3.5 sm:px-4 py-1.5 text-xs sm:text-sm font-editorial-label cursor-pointer whitespace-nowrap"
          title="ย้อนกลับทันที (หรือกดปุ่ม Esc)"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>ย้อนกลับทันที</span>
        </button>

        {/* Reading progress pill */}
        <div
          ref={progressContainerRef}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.05] text-[11px] font-editorial-label text-muted"
          aria-label="ความคืบหน้าการอ่าน 0 เปอร์เซ็นต์"
        >
          <div className="w-14 h-1.5 rounded-full bg-paper overflow-hidden">
            <div
              ref={progressBarRef}
              className="h-full w-full origin-left bg-accent"
              style={{ transform: "scaleX(0)" }}
            />
          </div>
          <span ref={progressTextRef} className="num text-ink-2 w-7 text-right">
            0%
          </span>
        </div>

        {/* One-Click Copy Facebook Post */}
        <button
          type="button"
          onClick={handleCopyFacebookPost}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs sm:text-sm font-editorial-label text-ink transition-colors cursor-pointer whitespace-nowrap"
          title="คัดลอกฉบับร่างโพสต์ Facebook พร้อมแชร์"
        >
          {copiedFb ? (
            <>
              <Check className="w-3.5 h-3.5 text-success shrink-0" />
              <span className="text-success">คัดลอก FB แล้ว</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-accent-hi shrink-0" />
              <span>คัดลอกโพสต์ FB</span>
            </>
          )}
        </button>

        {/* Quick Font Size Cycle */}
        <button
          type="button"
          onClick={cycleFontSize}
          className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-xs font-editorial-label text-ink-2 hover:text-ink transition-colors cursor-pointer whitespace-nowrap"
          title="สลับขนาดตัวอักษร"
          aria-label="ปรับขนาดตัวอักษร"
        >
          <Type className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xs:inline">
            {fontSize === "normal" ? "ก" : fontSize === "large" ? "ก+" : "ก++"}
          </span>
        </button>

        {/* Quick Bookmark Toggle */}
        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={isSaved}
          aria-label={isSaved ? "บันทึกแล้ว" : "บันทึกบทความ"}
          className={`inline-flex items-center justify-center min-h-[36px] min-w-[36px] px-2.5 py-1.5 rounded-full transition-colors cursor-pointer ${
            isSaved
              ? "bg-accent text-accent-ink"
              : "bg-white/[0.06] text-ink-2 hover:text-ink hover:bg-white/[0.1]"
          }`}
          title={isSaved ? "เอาออกจากที่คั่นหน้า" : "บันทึกไว้อ่านภายหลัง"}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 shrink-0" />
          ) : (
            <Bookmark className="w-4 h-4 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );

  if (paper) {
    const guide = paper.reading_guide;
    const tocItems: TocItem[] = [
      { id: "sec-tldr", num: "01", label: guide ? "Pass 1: คัดกรอง & TL;DR" : "สรุปใจความสำคัญ (TL;DR)" },
      { id: "sec-figure", num: "02", label: "ภาพประกอบจากงานวิจัย" },
      { id: "sec-story", num: "03", label: guide ? "Pass 2: กลไก & ตัวเลขจริง" : "เจาะลึกแบบภาษาคนทั่วไป" },
      { id: "sec-impact", num: "04", label: "วิธีเดิม vs วิธีใหม่ & ผลกระทบ" },
      { id: "sec-usecases", num: "05", label: guide ? "Pass 3: ลองทำจริง & ศึกษาต่อ" : "แนวทางการนำไปประยุกต์ใช้จริง" },
      { id: "sec-community", num: "06", label: "จุดแข็ง & ข้อจำกัด" },
      { id: "sec-sources", num: "07", label: "ลิงก์เปเปอร์ต้นฉบับ & โค้ด" },
      { id: "sec-facebook", num: "08", label: "ฉบับร่างโพสต์ Facebook" },
    ];

    return (
      <>
        <article className="container py-6 sm:py-10 pb-28">
          <ReaderTopBar
            onBack={onBack}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Left Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20 space-y-6">
                <ReaderDesktopToc title="สารบัญบทความ (TOC)" items={tocItems} />

                <div className="p-5 editorial-well text-xs sm:text-sm space-y-2.5">
                  <div className="font-editorial-label text-ink pb-2 border-b border-rule">
                    ข้อมูลจำเพาะของเปเปอร์
                  </div>
                  <dl className="space-y-2 font-editorial-body">
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        รหัส arXiv:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink num">{paper.id}</dd>
                    </div>
                    {paper.organization && (
                      <div>
                        <dt className="text-muted text-xs font-editorial-label inline">
                          สถาบัน/ทีมวิจัย:{" "}
                        </dt>
                        <dd className="inline font-medium text-ink">
                          {paper.organization}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        คะแนนโหวตชุมชน:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink num">
                        {paper.upvotes} Upvotes
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        คะแนนความน่าจับตา:{" "}
                      </dt>
                      <dd className="inline font-medium text-success num">
                        {paper.community_pulse.hype_score}/10
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>

            {/* Main Editorial Reading Column */}
            <div className="lg:col-span-9 bg-paper border-t border-rule-2 pt-2 lg:pl-6">
              <ReaderMobileToc
                summaryLabel="สารบัญบทความ (แตะเพื่อกระโดดไปยังหัวข้อ)"
                countText="8 หัวข้อ"
                items={tocItems}
              />

              {/* Article Header */}
              <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
                {freshness && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FreshnessBadge info={freshness} />
                  </div>
                )}

                <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                  {paper.hook_headline}
                </h1>

                <p className="text-sm sm:text-base text-muted font-editorial-body italic max-w-3xl">
                  ชื่อเปเปอร์ต้นฉบับ: &ldquo;{paper.title}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-ink whitespace-nowrap">
                    {paper.category}
                  </span>
                  {paper.organization && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-paper-2 text-ink whitespace-nowrap">
                      <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>{paper.organization}</span>
                    </span>
                  )}
                  {paper.github_url && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-soft text-success whitespace-nowrap">
                      <Code2 className="w-3.5 h-3.5 shrink-0" />
                      <span>มีโค้ด GitHub</span>
                    </span>
                  )}
                  <span className="text-muted inline-flex items-center gap-1 sm:ml-auto num">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>อ่าน {paper.reading_time_minutes} นาที</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rule text-xs sm:text-sm font-editorial-label text-muted">
                  <div>
                    {paper.authors.length > 0 && (
                      <span>
                        ผู้วิจัย: {paper.authors.slice(0, 3).join(", ")}
                        {paper.authors.length > 3 ? " และคณะ" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-ink num">
                    <span className="inline-flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                      <span>{paper.upvotes} โหวตบน HF</span>
                    </span>
                    <span className="border-l border-rule pl-4">
                      {paper.published_date}
                    </span>
                  </div>
                </div>
              </header>

              {/* Body Content */}
              <div className={`space-y-10 text-ink-2 font-editorial-body ${fontSizeClass}`}>
                {/* Section 01: Pass 1 Triage & TL;DR */}
                <section
                  id="sec-tldr"
                  className="p-6 editorial-well border-t-2 border-t-accent"
                >
                  <h2 className="font-editorial-display text-xl text-ink mb-3 flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      01 //
                    </span>
                    <span>สรุปใจความสำคัญใน 30 วินาที (Key Takeaways)</span>
                  </h2>
                  <ul className="space-y-2.5 text-base max-w-[68ch]">
                    {paper.tldr_takeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-bold text-accent-hi shrink-0" aria-hidden="true">
                          &rsaquo;
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {guide && <Pass1TriageStrip guide={guide} />}
                </section>

                {/* Collapsible Vocabulary Scaffolding (95% threshold before Pass 2) */}
                {guide && (
                  <GlossaryScaffolding
                    sectionId="sec-glossary"
                    glossary={guide.glossary}
                  />
                )}

                {/* Section 02: Figure */}
                <section id="sec-figure" className="space-y-3">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      02 //
                    </span>
                    <span>ภาพประกอบและแผนผังจากงานวิจัย</span>
                  </h2>
                  {!imgError && paper.thumbnail_url ? (
                    <figure className="editorial-photo p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={paper.thumbnail_url}
                        alt={paper.title}
                        onError={() => setImgError(true)}
                        className="w-full max-h-[420px] object-contain mx-auto"
                      />
                      <figcaption className="text-xs text-center text-[var(--color-well-muted)] mt-2.5 pt-2 border-t border-[var(--color-well-rule)] font-editorial-label">
                        ภาพตัวอย่างจากเอกสารงานวิจัย {paper.title} (arXiv:{paper.id})
                      </figcaption>
                    </figure>
                  ) : (
                    <div className="p-6 editorial-well text-sm text-muted">
                      ดูแผนผังสถาปัตยกรรมและตารางผลการทดลองฉบับเต็มได้ในเอกสาร PDF ด้านล่างของบทความ
                    </div>
                  )}
                </section>

                {/* Section 03: Pass 2 Mechanism, Hard Evidence & Deep Narrative */}
                {guide ? (
                  <div className="space-y-8">
                    <Pass2MechanismAndEvidence
                      sectionId="sec-story"
                      sectionNum="03"
                      howItWorks={guide.how_it_works}
                      hardEvidence={guide.hard_evidence}
                    />
                    <div className="space-y-4">
                      <p className="lead text-ink font-medium max-w-[65ch]">
                        {paper.short_teaser}
                      </p>
                      {paper.layman_story.map((paragraph, idx) => (
                        <p key={idx} className="text-ink-2 max-w-[68ch]">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <section id="sec-story" className="space-y-5">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      <span className="font-editorial-label text-xs text-accent-hi num">
                        03 //
                      </span>
                      <span>เจาะลึกเรื่องราวแบบคนทั่วไปเข้าใจง่าย</span>
                    </h2>
                    <p className="lead text-ink font-medium max-w-[65ch]">
                      {paper.short_teaser}
                    </p>
                    {paper.layman_story.map((paragraph, idx) => (
                      <p key={idx} className="text-ink-2 max-w-[68ch]">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                )}

                {/* Section 04: Before vs After */}
                <section id="sec-impact" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      04 //
                    </span>
                    <span>เปรียบเทียบวิธีเดิม vs วิธีใหม่ และผลกระทบ</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2">
                      <div className="text-xs font-editorial-label text-muted mb-2">
                        ข้อจำกัดของวิธีแบบเดิม (Before)
                      </div>
                      <p>{paper.impact_comparison.before}</p>
                    </div>

                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 border-l-2 border-l-success">
                      <div className="text-xs font-editorial-label text-success mb-2">
                        สิ่งที่เปลี่ยนไปจากเปเปอร์นี้ (After)
                      </div>
                      <p className="text-ink">{paper.impact_comparison.after}</p>
                    </div>
                  </div>

                  <div className="p-5 editorial-well text-base">
                    <span className="font-bold text-ink">
                      ทำไมเรื่องนี้ถึงสำคัญต่ออนาคต:{" "}
                    </span>
                    <span>{paper.impact_comparison.why_it_matters}</span>
                  </div>
                </section>

                {/* Section 05: Pass 3 Hands-On (or legacy Use Cases fallback) */}
                {guide ? (
                  <Pass3HandsOnDrawer
                    sectionId="sec-usecases"
                    sectionNum="05"
                    handsOn={guide.pass3_hands_on}
                  />
                ) : (
                  <section id="sec-usecases" className="space-y-4">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      <span className="font-editorial-label text-xs text-accent-hi num">
                        05 //
                      </span>
                      <span>แนวทางการนำไปประยุกต์ใช้จริง (3 ยูสเคส)</span>
                    </h2>

                    <div className="divide-y divide-rule border-t border-b border-rule text-base">
                      {paper.use_cases.map((uc, idx) => (
                        <div key={idx} className="py-5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-editorial-display text-lg text-ink max-w-none">
                              ยูสเคสที่ {idx + 1}: {uc.title}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-editorial-label bg-paper-2 text-ink whitespace-nowrap">
                              {uc.role}
                            </span>
                          </div>
                          <p className="max-w-[68ch]">{uc.description}</p>
                          <div className="text-sm text-muted pt-1">
                            <strong className="text-ink">ตัวอย่างการใช้งานจริง: </strong>
                            {uc.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 06: Community Pulse */}
                <section id="sec-community" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      06 //
                    </span>
                    <span>จุดแข็งและข้อควรระวังเชิงเทคนิค</span>
                  </h2>

                  <p className="text-base italic text-muted max-w-[68ch]">
                    &ldquo;{paper.community_pulse.summary}&rdquo;
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-success flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>จุดเด่นที่คนในวงการชื่นชม</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {paper.community_pulse.praises.map((p, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-success font-bold shrink-0">+</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-warn flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>ข้อจำกัดและสิ่งที่ต้องระวัง</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {paper.community_pulse.critiques.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-warn font-bold shrink-0">!</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 07: External Sources */}
                <section id="sec-sources" className="editorial-opens space-y-4">
                  <h2 className="font-editorial-display text-xl text-ink flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      07 //
                    </span>
                    <span>เอกสารต้นทางและซอร์สโค้ด (สำหรับผู้ที่ต้องการศึกษาฉบับเต็ม)</span>
                  </h2>
                  <p className="text-sm text-muted max-w-[65ch]">
                    คุณสามารถกดปุ่มด้านล่างเพื่อเปิดดูไฟล์ PDF ต้นฉบับบน arXiv,
                    ร่วมพูดคุยบน Hugging Face หรือดาวน์โหลดโค้ดบน GitHub ได้โดยตรง
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {paper.github_url && (
                      <a
                        href={paper.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="dusk-pill-primary inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap"
                      >
                        <Code2 className="w-4 h-4 shrink-0" />
                        <span>เปิด GitHub Repository ของเปเปอร์นี้</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}

                    <a
                      href={paper.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>อ่านเปเปอร์ต้นฉบับ (arXiv PDF)</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>

                    <a
                      href={paper.hf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label text-ink-2 whitespace-nowrap"
                    >
                      <span>หน้าพูดคุยบน Hugging Face</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>

                    {paper.project_url && (
                      <a
                        href={paper.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label text-ink-2 whitespace-nowrap"
                      >
                        <span>เว็บไซต์โปรเจกต์ / Demo</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    )}
                  </div>
                </section>

                {/* Section 08: Facebook Share Studio */}
                <FacebookShareStudio
                  sectionId="sec-facebook"
                  sectionNum="08"
                  initialDraft={initialFbDraft}
                  draft={fbDraft}
                  onChangeDraft={setFbDraft}
                  onCopyDraft={handleCopyFacebookPost}
                  copiedFb={copiedFb}
                  fbLiveStatus={fbLiveStatus}
                />
              </div>
            </div>
          </div>
        </article>

        {renderFloatingDock()}
      </>
    );
  }

  if (repo) {
    const guide = repo.reading_guide;
    const repoToc: TocItem[] = [
      { id: "repo-overview", num: "01", label: guide ? "Pass 1: คัดกรอง & ปัญหาที่แก้" : "บทนำ & ปัญหาที่โปรเจกต์นี้เข้ามาแก้" },
      { id: "repo-compare", num: "02", label: guide ? "Pass 2: กลไก & เปรียบเทียบ" : "เปรียบเทียบกับเครื่องมืออื่นในตลาด" },
      { id: "repo-saas", num: "03", label: guide ? "Pass 3: ลองทำจริง & ศึกษาต่อ" : "แนวทางการประยุกต์ใช้งาน" },
      { id: "repo-vibe", num: "04", label: "จุดแข็ง & ข้อควรระวังจริง" },
      { id: "repo-quickstart", num: "05", label: "คำสั่งทดลองรัน & ลิงก์ GitHub" },
      { id: "repo-facebook", num: "06", label: "ฉบับร่างโพสต์ Facebook" },
    ];

    return (
      <>
        <article className="container py-6 sm:py-10 pb-28">
          <ReaderTopBar
            onBack={onBack}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20 space-y-6">
                <ReaderDesktopToc title="สารบัญบทวิเคราะห์" items={repoToc} />

                <div className="p-5 editorial-well text-xs sm:text-sm space-y-2.5">
                  <div className="font-editorial-label text-ink pb-2 border-b border-rule">
                    สถิติ GitHub ล่าสุด
                  </div>
                  <dl className="space-y-2 font-editorial-body">
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        ชื่อเต็ม:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink">
                        {repo.owner}/{repo.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        ดาวทั้งหมด:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink num">
                        {repo.stars.toLocaleString()} (+{repo.stars_today.toLocaleString()} วันนี้)
                      </dd>
                    </div>
                    {isTwoDayStreak && (
                      <div className="text-accent-2 font-editorial-label inline-flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          ติดเทรนด์ 2 วันซ้อน
                          {starsAddedSinceYesterday > 0
                            ? ` (+${starsAddedSinceYesterday.toLocaleString()} ดาว)`
                            : ""}
                        </span>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        ความพร้อมใช้งาน:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink">
                        {repo.maturity_rating}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9 bg-paper border-t border-rule-2 pt-2 lg:pl-6">
              <ReaderMobileToc
                summaryLabel="สารบัญบทวิเคราะห์ (แตะเพื่อกระโดดไปยังหัวข้อ)"
                countText="6 หัวข้อ"
                items={repoToc}
              />

              <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
                {freshness && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FreshnessBadge info={freshness} />
                  </div>
                )}

                <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                  {repo.one_liner}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-ink whitespace-nowrap">
                    {repo.language || "Open Source"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-paper-2 text-ink whitespace-nowrap">
                    {repo.maturity_rating}
                  </span>
                  {isTwoDayStreak && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warn-soft text-warn whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 shrink-0" />
                      <span>ติดเทรนด์ 2 วันซ้อน</span>
                    </span>
                  )}
                  <span className="sm:ml-auto inline-flex items-center gap-1.5 font-medium text-ink num">
                    <Star className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                    <span>
                      {repo.stars.toLocaleString()} (+{repo.stars_today.toLocaleString()} วันนี้)
                    </span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm font-editorial-label text-muted pt-2 border-t border-rule">
                  <span>
                    Repository: <strong className="text-ink">{repo.owner}/{repo.name}</strong>
                  </span>
                  <span className="border-l border-rule pl-4">
                    สัญญาอนุญาต: {repo.license || "ไม่ระบุ"}
                  </span>
                  <span className="border-l border-rule pl-4 num">
                    Issues เปิดอยู่: {repo.open_issues}
                  </span>
                </div>
              </header>

              <div className={`space-y-10 text-ink-2 font-editorial-body ${fontSizeClass}`}>
                <section id="repo-overview" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      01 //
                    </span>
                    <span>ทำไมโปรเจกต์นี้ถึงเกิดมา และช่วยแก้ปัญหาอะไร?</span>
                  </h2>
                  <p className="max-w-[68ch]">{repo.problem_solved}</p>
                  {repo.deep_dive_paragraphs && repo.deep_dive_paragraphs.length > 0 && (
                    <div className="space-y-4">
                      {repo.deep_dive_paragraphs.map((para, idx) => (
                        <p key={idx} className="max-w-[68ch] text-ink-2">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="p-5 editorial-well border-t-2 border-t-accent text-base">
                    <strong className="text-ink">
                      เหตุผลประเมินความพร้อม ({repo.maturity_rating}):{" "}
                    </strong>
                    <span>{repo.maturity_reason}</span>
                    {guide && <Pass1TriageStrip guide={guide} />}
                  </div>
                </section>

                {/* Collapsible Vocabulary Scaffolding */}
                {guide && (
                  <GlossaryScaffolding
                    sectionId="repo-glossary"
                    glossary={guide.glossary}
                  />
                )}

                {/* Pass 2: Mechanism & Evidence + Alternative Comparison */}
                <div className="space-y-8">
                  {guide && (
                    <Pass2MechanismAndEvidence
                      sectionId="repo-compare"
                      sectionNum="02"
                      howItWorks={guide.how_it_works}
                      hardEvidence={guide.hard_evidence}
                    />
                  )}

                  <section id={guide ? undefined : "repo-compare"} className="space-y-4">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      {!guide && (
                        <span className="font-editorial-label text-xs text-accent-hi num">
                          02 //
                        </span>
                      )}
                      <span>เปรียบเทียบกับเครื่องมืออื่นที่ใกล้เคียงกัน</span>
                    </h2>
                    <blockquote className="p-5 border-t-2 border-t-accent editorial-well italic max-w-[68ch]">
                      &ldquo;{repo.alternative_comparison}&rdquo;
                    </blockquote>
                  </section>
                </div>

                {/* Section 03: Pass 3 Hands-On (or legacy fallback) */}
                {guide ? (
                  <Pass3HandsOnDrawer
                    sectionId="repo-saas"
                    sectionNum="03"
                    handsOn={guide.pass3_hands_on}
                  />
                ) : (
                  <section id="repo-saas" className="space-y-4">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      <span className="font-editorial-label text-xs text-accent-hi num">
                        03 //
                      </span>
                      <span>แนวทางการประยุกต์ใช้งานและการเชื่อมต่อ</span>
                    </h2>
                    <div className="p-6 rounded-[var(--radius-card)] bg-paper-2 border-l-2 border-l-success space-y-3 text-base">
                      <div className="font-editorial-label text-success flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>แนวทางการนำไปต่อยอด</span>
                      </div>
                      <p className="text-ink max-w-[68ch]">{repo.ai_opportunity.monetization_idea}</p>
                      <div className="pt-3 border-t border-rule text-sm">
                        <strong className="text-ink">การทำงานร่วมกับเครื่องมืออื่น: </strong>
                        <span>{repo.ai_opportunity.stack_synergy}</span>
                      </div>
                    </div>
                  </section>
                )}

                <section id="repo-vibe" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      04 //
                    </span>
                    <span>
                      เสียงสะท้อนจากนักพัฒนาจริง (Vibe Check: {repo.human_vibe_check.hype_vs_reality}/10)
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-success flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 shrink-0" />
                        <span>จุดเด่นที่คนชอบ</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {repo.human_vibe_check.pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-success font-bold shrink-0">+</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-warn flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>ข้อควรระวัง / ข้อจำกัด</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {repo.human_vibe_check.gotchas_and_traps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-warn font-bold shrink-0">!</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                <section id="repo-quickstart" className="editorial-opens space-y-4">
                  <h2 className="font-editorial-display text-xl text-ink flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      05 //
                    </span>
                    <span>คำสั่งเริ่มต้นใช้งาน (Quick Start) &amp; ลิงก์ต้นทาง</span>
                  </h2>

                  <div className="flex items-center justify-between gap-2 p-4 bg-paper-2 border border-rule-2 rounded-[var(--radius-inner)] overflow-x-auto">
                    <pre className="font-mono text-xs whitespace-pre-wrap text-ink">
                      {repo.quick_start}
                    </pre>
                    <button
                      type="button"
                      onClick={() => handleCopyQuickStart(repo.quick_start)}
                      className="dusk-pill-ghost px-3.5 py-1.5 shrink-0 cursor-pointer inline-flex items-center gap-1.5 text-xs font-editorial-label whitespace-nowrap"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success shrink-0" />
                          <span>คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          <span>คัดลอกคำสั่ง</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span role="status" aria-live="polite" className="visually-hidden">
                    {codeLiveStatus}
                  </span>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="dusk-pill-primary inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap"
                    >
                      <Code2 className="w-4 h-4 shrink-0" />
                      <span>เปิด GitHub Repository ({repo.owner}/{repo.name})</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>

                    <a
                      href={`${repo.url}/issues`}
                      target="_blank"
                      rel="noreferrer"
                      className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap"
                    >
                      <span>ดู Issues &amp; ปัญหาที่พบ ({repo.open_issues})</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </section>

                {/* Section 06: Facebook Share Studio */}
                <FacebookShareStudio
                  sectionId="repo-facebook"
                  sectionNum="06"
                  initialDraft={initialFbDraft}
                  draft={fbDraft}
                  onChangeDraft={setFbDraft}
                  onCopyDraft={handleCopyFacebookPost}
                  copiedFb={copiedFb}
                  fbLiveStatus={fbLiveStatus}
                />
              </div>
            </div>
          </div>
        </article>

        {renderFloatingDock()}
      </>
    );
  }

  if (news) {
    const guide = news.reading_guide;
    const newsToc: TocItem[] = [
      { id: "news-tldr", num: "01", label: guide ? "Pass 1: คัดกรอง & TL;DR" : "สรุปใจความสำคัญ (TL;DR)" },
      { id: "news-figure", num: "02", label: "ภาพประกอบข่าว" },
      { id: "news-story", num: "03", label: guide ? "Pass 2: กลไก & สเปกจริง" : "เจาะลึกข่าวแบบเข้าใจง่าย" },
      { id: "news-impact", num: "04", label: "ก่อน vs หลังอัปเดต & ผลกระทบ" },
      { id: "news-playbook", num: "05", label: guide ? "Pass 3: ลองทำจริง & ศึกษาต่อ" : "แนวทางนำไปใช้ประโยชน์จริง" },
      { id: "news-highlights", num: "06", label: "สิ่งใหม่ที่โดดเด่น & ข้อควรระวัง" },
      { id: "news-source", num: "07", label: "ลิงก์ประกาศต้นฉบับ" },
      { id: "news-facebook", num: "08", label: "ฉบับร่างโพสต์ Facebook" },
    ];

    return (
      <>
        <article className="container py-6 sm:py-10 pb-28">
          <ReaderTopBar
            onBack={onBack}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-20 space-y-6">
                <ReaderDesktopToc title="สารบัญบทความ (TOC)" items={newsToc} />

                <div className="p-5 editorial-well text-xs sm:text-sm space-y-2.5">
                  <div className="font-editorial-label text-ink pb-2 border-b border-rule">
                    ข้อมูลข่าวสารจาก AI Lab
                  </div>
                  <dl className="space-y-2 font-editorial-body">
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        แหล่งข่าว:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink">{news.source}</dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        หมวดหมู่:{" "}
                      </dt>
                      <dd className="inline font-medium text-accent-2">{news.category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs font-editorial-label inline">
                        วันที่เผยแพร่:{" "}
                      </dt>
                      <dd className="inline font-medium text-ink num">
                        {news.published_date}
                      </dd>
                    </div>
                  </dl>
                  {news.rss_categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {news.rss_categories.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-paper text-xs font-editorial-label text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9 bg-paper border-t border-rule-2 pt-2 lg:pl-6">
              <ReaderMobileToc
                summaryLabel="สารบัญข่าว (แตะเพื่อกระโดดไปยังหัวข้อ)"
                countText="8 หัวข้อ"
                items={newsToc}
              />

              <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
                {freshness && (
                  <div className="flex flex-wrap items-center gap-2">
                    <FreshnessBadge info={freshness} />
                  </div>
                )}

                <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                  {news.hook_headline}
                </h1>

                <p className="text-sm sm:text-base text-muted font-editorial-body italic max-w-3xl">
                  หัวข้อข่าวต้นฉบับ: &ldquo;{news.title}&rdquo;
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-ink whitespace-nowrap">
                    {news.category}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-paper-2 text-ink whitespace-nowrap">
                    <Newspaper className="w-3.5 h-3.5 text-accent-hi shrink-0" />
                    <span>{news.source}</span>
                  </span>
                  <span className="text-muted inline-flex items-center gap-1 sm:ml-auto num">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>อ่าน {news.reading_time_minutes} นาที</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rule text-xs sm:text-sm font-editorial-label text-muted">
                  <div>
                    {news.authors.length > 0 ? (
                      <span>ผู้เขียน: {news.authors.join(", ")}</span>
                    ) : (
                      <span>เผยแพร่โดย: {news.source}</span>
                    )}
                  </div>
                  <div className="font-medium text-ink num">{news.published_date}</div>
                </div>
              </header>

              <div className={`space-y-10 text-ink-2 font-editorial-body ${fontSizeClass}`}>
                {/* 01: Pass 1 Triage & TL;DR */}
                <section
                  id="news-tldr"
                  className="p-6 editorial-well border-t-2 border-t-accent"
                >
                  <h2 className="font-editorial-display text-xl text-ink mb-3 flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      01 //
                    </span>
                    <span>สรุปใจความสำคัญใน 30 วินาที (Key Takeaways)</span>
                  </h2>
                  <ul className="space-y-2.5 text-base max-w-[68ch]">
                    {news.tldr_takeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-bold text-accent-hi shrink-0" aria-hidden="true">
                          &rsaquo;
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {guide && <Pass1TriageStrip guide={guide} />}
                </section>

                {/* Collapsible Vocabulary Scaffolding */}
                {guide && (
                  <GlossaryScaffolding
                    sectionId="news-glossary"
                    glossary={guide.glossary}
                  />
                )}

                {/* 02: Figure */}
                <section id="news-figure" className="space-y-3">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      02 //
                    </span>
                    <span>ภาพประกอบข่าวจากประกาศทางการ</span>
                  </h2>
                  {!imgError && news.thumbnail_url ? (
                    <figure className="editorial-photo p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={news.thumbnail_url}
                        alt={news.title}
                        onError={() => setImgError(true)}
                        className="w-full max-h-[420px] object-contain mx-auto"
                      />
                      <figcaption className="text-xs text-center text-[var(--color-well-muted)] mt-2.5 pt-2 border-t border-[var(--color-well-rule)] font-editorial-label">
                        ภาพประกอบจาก {news.source}: {news.title}
                      </figcaption>
                    </figure>
                  ) : (
                    <div className="p-6 editorial-well text-sm text-muted">
                      ติดตามภาพประกอบเพิ่มเติมและวิดีโอสาธิตได้ในประกาศฉบับเต็มจากลิงก์ Google Blog ด้านล่าง
                    </div>
                  )}
                </section>

                {/* 03: Pass 2 Mechanism, Specs & Story */}
                {guide ? (
                  <div className="space-y-8">
                    <Pass2MechanismAndEvidence
                      sectionId="news-story"
                      sectionNum="03"
                      howItWorks={guide.how_it_works}
                      hardEvidence={guide.hard_evidence}
                    />
                    <div className="space-y-4">
                      <p className="lead text-ink font-medium max-w-[65ch]">
                        {news.short_teaser}
                      </p>
                      {news.layman_story.map((paragraph, idx) => (
                        <p key={idx} className="text-ink-2 max-w-[68ch]">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <section id="news-story" className="space-y-5">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      <span className="font-editorial-label text-xs text-accent-hi num">
                        03 //
                      </span>
                      <span>เจาะลึกข่าวและประเด็นสำคัญแบบเข้าใจง่าย</span>
                    </h2>
                    <p className="lead text-ink font-medium max-w-[65ch]">
                      {news.short_teaser}
                    </p>
                    {news.layman_story.map((paragraph, idx) => (
                      <p key={idx} className="text-ink-2 max-w-[68ch]">
                        {paragraph}
                      </p>
                    ))}
                  </section>
                )}

                {/* 04: Before vs After */}
                <section id="news-impact" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      04 //
                    </span>
                    <span>เปรียบเทียบก่อนอัปเดต vs หลังอัปเดต</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2">
                      <div className="text-xs font-editorial-label text-muted mb-2">
                        ก่อนอัปเดต (Before)
                      </div>
                      <p>{news.impact_comparison.before}</p>
                    </div>

                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 border-l-2 border-l-success">
                      <div className="text-xs font-editorial-label text-success mb-2">
                        หลังอัปเดต (After)
                      </div>
                      <p className="text-ink">{news.impact_comparison.after}</p>
                    </div>
                  </div>

                  <div className="p-5 editorial-well text-base">
                    <span className="font-bold text-ink">
                      ทำไมอัปเดตนี้ถึงสำคัญ:{" "}
                    </span>
                    <span>{news.impact_comparison.why_it_matters}</span>
                  </div>
                </section>

                {/* 05: Pass 3 Hands-On (or legacy Actionable Playbook fallback) */}
                {guide ? (
                  <Pass3HandsOnDrawer
                    sectionId="news-playbook"
                    sectionNum="05"
                    handsOn={guide.pass3_hands_on}
                  />
                ) : (
                  <section id="news-playbook" className="space-y-4">
                    <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                      <span className="font-editorial-label text-xs text-accent-hi num">
                        05 //
                      </span>
                      <span>3 แนวทางการนำไปใช้ประโยชน์จริง (Actionable Playbook)</span>
                    </h2>

                    <div className="divide-y divide-rule border-t border-b border-rule text-base">
                      {news.actionable_playbook.map((item, idx) => (
                        <div key={idx} className="py-5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-editorial-display text-lg text-ink max-w-none">
                              แนวทางที่ {idx + 1}: {item.title}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-editorial-label bg-paper-2 text-ink whitespace-nowrap">
                              {item.role}
                            </span>
                          </div>
                          <p className="max-w-[68ch]">{item.description}</p>
                          <div className="text-sm text-muted pt-1">
                            <strong className="text-ink">ตัวอย่างการใช้งานจริง: </strong>
                            {item.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 06: Highlights & Watchouts */}
                <section id="news-highlights" className="space-y-4">
                  <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      06 //
                    </span>
                    <span>จุดเด่นที่เปิดตัว &amp; ข้อควรจับตา</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-success flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>สิ่งใหม่ที่โดดเด่น</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {news.key_highlights.whats_new.map((w, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-success font-bold shrink-0">+</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-[var(--radius-inner)] bg-paper-2 space-y-2">
                      <div className="font-editorial-label text-sm text-warn flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>ข้อจำกัดและสิ่งที่ต้องติดตาม</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {news.key_highlights.watchouts.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-warn font-bold shrink-0">!</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 07: Source link */}
                <section id="news-source" className="editorial-opens space-y-4">
                  <h2 className="font-editorial-display text-xl text-ink flex items-center gap-2 max-w-none">
                    <span className="font-editorial-label text-xs text-accent-hi num">
                      07 //
                    </span>
                    <span>อ่านประกาศต้นฉบับจาก {news.source}</span>
                  </h2>
                  <p className="text-sm text-muted max-w-[65ch]">
                    กดปุ่มด้านล่างเพื่อเปิดอ่านบทความต้นฉบับฉบับเต็ม รูปภาพเพิ่มเติม
                    หรือวิดีโอเปิดตัวจาก Google Official Blog
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noreferrer"
                      className="dusk-pill-primary inline-flex items-center gap-2 min-h-[44px] px-5 py-2 text-sm font-editorial-label whitespace-nowrap"
                    >
                      <Newspaper className="w-4 h-4 shrink-0" />
                      <span>เปิดอ่านประกาศต้นฉบับบน Google Blog</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                </section>

                {/* 08: Facebook Share Studio */}
                <FacebookShareStudio
                  sectionId="news-facebook"
                  sectionNum="08"
                  initialDraft={initialFbDraft}
                  draft={fbDraft}
                  onChangeDraft={setFbDraft}
                  onCopyDraft={handleCopyFacebookPost}
                  copiedFb={copiedFb}
                  fbLiveStatus={fbLiveStatus}
                />
              </div>
            </div>
          </div>
        </article>

        {renderFloatingDock()}
      </>
    );
  }

  return null;
}
