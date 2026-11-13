"use client";

import { useState } from "react";
import {
  type PaperData,
  type RepositoryData,
  type NewsArticleData,
} from "../types";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  FileText,
  Code2,
  Clock,
  ThumbsUp,
  Star,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Newspaper,
  Building2,
  Flame,
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
        className="dusk-pill-ghost inline-flex items-center gap-2 min-h-[38px] px-4 py-1.5 text-sm font-editorial-label transition-colors duration-[var(--dur-micro)] cursor-pointer self-start whitespace-nowrap"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span>กลับไปหน้าหนังสือพิมพ์</span>
      </button>

      <div className="flex items-center justify-between sm:justify-end gap-3">
        <div className="flex items-center rounded-full border border-rule bg-paper-2 p-0.5 text-xs font-editorial-label">
          <span className="px-3 py-1 text-muted whitespace-nowrap">
            ขนาดอักษร
          </span>
          <button
            type="button"
            aria-pressed={fontSize === "normal"}
            onClick={() => setFontSize("normal")}
            className={`min-h-[32px] px-3 py-1 rounded-full cursor-pointer transition-colors duration-[var(--dur-micro)] whitespace-nowrap ${
              fontSize === "normal"
                ? "bg-ink text-paper"
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
                ? "bg-ink text-paper"
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
                ? "bg-ink text-paper"
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
          className={`inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 text-xs sm:text-sm font-editorial-label rounded-full border transition-colors duration-[var(--dur-micro)] cursor-pointer shrink-0 whitespace-nowrap ${
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
    <div className="p-5 border border-rule bg-paper-2 rounded-[var(--radius-card)]">
      <div className="flex items-center gap-2 text-sm font-editorial-label text-ink pb-3 mb-3 border-b border-rule">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <span>{title}</span>
      </div>
      <nav className="space-y-1.5 text-sm font-editorial-body">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-start gap-2.5 py-1 text-muted hover:text-ink"
          >
            <span className="font-editorial-label text-xs text-accent mt-0.5 shrink-0 num">
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
          <BookOpen className="w-4 h-4 text-accent shrink-0" />
          <span>{summaryLabel}</span>
        </span>
        <span className="text-xs text-muted">{countText}</span>
      </summary>
      <nav className="mt-3 pt-3 border-t border-rule space-y-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="flex items-center gap-2.5 py-1 text-ink-2 hover:text-accent"
          >
            <span className="font-editorial-label text-xs text-accent num">
              {item.num}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </details>
  );
}

export function ArticleReader({
  paper,
  repo,
  news,
  isSaved,
  onToggleSave,
  onBack,
  isTwoDayStreak = false,
  starsAddedSinceYesterday = 0,
}: ArticleReaderProps) {
  const [fontSize, setFontSize] = useState<FontSizeScale>("normal");
  const [copiedCode, setCopiedCode] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fontSizeClass =
    fontSize === "xlarge"
      ? "text-xl leading-9"
      : fontSize === "large"
      ? "text-[18.5px] leading-8"
      : "text-[17px] leading-8";

  if (paper) {
    const tocItems: TocItem[] = [
      { id: "sec-tldr", num: "01", label: "สรุปใจความสำคัญ (TL;DR)" },
      { id: "sec-figure", num: "02", label: "ภาพประกอบจากงานวิจัย" },
      { id: "sec-story", num: "03", label: "เจาะลึกแบบภาษาคนทั่วไป" },
      { id: "sec-impact", num: "04", label: "วิธีเดิม vs วิธีใหม่ & ผลกระทบ" },
      { id: "sec-usecases", num: "05", label: "3 ยูสเคสการนำไปใช้ต่อยอด" },
      { id: "sec-community", num: "06", label: "เสียงสะท้อน & ข้อจำกัด" },
      { id: "sec-sources", num: "07", label: "ลิงก์เปเปอร์ต้นฉบับ & โค้ด" },
    ];

    return (
      <article className="container py-6 sm:py-10">
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
            <div className="sticky top-6 space-y-6">
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
              countText="7 หัวข้อ"
              items={tocItems}
            />

            {/* Article Header */}
            <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
              <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                {paper.hook_headline}
              </h1>

              <p className="text-sm sm:text-base text-muted font-editorial-body italic max-w-3xl">
                ชื่อเปเปอร์ต้นฉบับ: &ldquo;{paper.title}&rdquo;
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                <span className="px-2.5 py-0.5 bg-accent text-accent-ink whitespace-nowrap">
                  {paper.category}
                </span>
                {paper.organization && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-paper-2 border border-rule text-ink whitespace-nowrap">
                    <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>{paper.organization}</span>
                  </span>
                )}
                {paper.github_url && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-success-soft border border-rule text-success whitespace-nowrap">
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
                    <ThumbsUp className="w-3.5 h-3.5 text-accent shrink-0" />
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
              {/* Section 01: TL;DR */}
              <section
                id="sec-tldr"
                className="p-6 editorial-well border-t-2 border-t-ink"
              >
                <h2 className="font-editorial-display text-xl text-ink mb-3 flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    01 //
                  </span>
                  <span>สรุปใจความสำคัญใน 30 วินาที (Key Takeaways)</span>
                </h2>
                <ul className="space-y-2.5 text-base max-w-[68ch]">
                  {paper.tldr_takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-bold text-accent shrink-0" aria-hidden="true">
                        &rsaquo;
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 02: Figure */}
              <section id="sec-figure" className="space-y-3">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    02 //
                  </span>
                  <span>ภาพประกอบและแผนผังจากงานวิจัย</span>
                </h2>
                {!imgError && paper.thumbnail_url ? (
                  <figure className="editorial-photo border border-rule bg-paper-2 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paper.thumbnail_url}
                      alt={paper.title}
                      onError={() => setImgError(true)}
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                    <figcaption className="text-xs text-center text-muted mt-2.5 pt-2 border-t border-rule font-editorial-label">
                      ภาพตัวอย่างจากเอกสารงานวิจัย {paper.title} (arXiv:{paper.id})
                    </figcaption>
                  </figure>
                ) : (
                  <div className="p-6 editorial-well text-sm text-muted">
                    ดูแผนผังสถาปัตยกรรมและตารางผลการทดลองฉบับเต็มได้ในเอกสาร PDF ด้านล่างของบทความ
                  </div>
                )}
              </section>

              {/* Section 03: Deep Layman Explanation */}
              <section id="sec-story" className="space-y-5">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
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

              {/* Section 04: Before vs After */}
              <section id="sec-impact" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    04 //
                  </span>
                  <span>เปรียบเทียบวิธีเดิม vs วิธีใหม่ และผลกระทบ</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 border border-rule bg-paper">
                    <div className="text-xs font-editorial-label text-muted mb-2">
                      ข้อจำกัดของวิธีแบบเดิม (Before)
                    </div>
                    <p>{paper.impact_comparison.before}</p>
                  </div>

                  <div className="p-5 border border-success bg-success-soft">
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

              {/* Section 05: 3 Concrete Use Cases */}
              <section id="sec-usecases" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
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
                        <span className="px-2.5 py-0.5 text-xs font-editorial-label bg-paper-2 border border-rule text-ink whitespace-nowrap">
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

              {/* Section 06: Community Pulse */}
              <section id="sec-community" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    06 //
                  </span>
                  <span>เสียงสะท้อนจากนักวิจัยและข้อควรระวัง</span>
                </h2>

                <p className="text-base italic text-muted max-w-[68ch]">
                  &ldquo;{paper.community_pulse.summary}&rdquo;
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 border border-rule bg-paper space-y-2">
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

                  <div className="p-5 border border-rule bg-paper space-y-2">
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
                  <span className="font-editorial-label text-xs text-accent num">
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
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (repo) {
    const repoToc: TocItem[] = [
      { id: "repo-overview", num: "01", label: "บทนำ & ปัญหาที่โปรเจกต์นี้เข้ามาแก้" },
      { id: "repo-compare", num: "02", label: "เปรียบเทียบกับเครื่องมืออื่นในตลาด" },
      { id: "repo-saas", num: "03", label: "ไอเดียต่อยอดสร้างรายได้ / Micro-SaaS" },
      { id: "repo-vibe", num: "04", label: "รีวิวจากการใช้งานจริง (Pros & Gotchas)" },
      { id: "repo-quickstart", num: "05", label: "คำสั่งทดลองรัน & ลิงก์ GitHub" },
    ];

    const copyQuickStart = () => {
      navigator.clipboard.writeText(repo.quick_start);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    return (
      <article className="container py-6 sm:py-10">
        <ReaderTopBar
          onBack={onBack}
          fontSize={fontSize}
          setFontSize={setFontSize}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
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
                    <div className="text-accent font-editorial-label inline-flex items-center gap-1.5">
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
              countText="5 หัวข้อ"
              items={repoToc}
            />

            <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
              <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                {repo.one_liner}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                <span className="px-2.5 py-0.5 bg-accent text-accent-ink whitespace-nowrap">
                  {repo.language || "Open Source"}
                </span>
                <span className="px-2.5 py-0.5 bg-paper-2 border border-rule text-ink whitespace-nowrap">
                  {repo.maturity_rating}
                </span>
                {isTwoDayStreak && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-warn-soft border border-rule text-warn whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>ติดเทรนด์ 2 วันซ้อน</span>
                  </span>
                )}
                <span className="sm:ml-auto inline-flex items-center gap-1.5 font-medium text-ink num">
                  <Star className="w-3.5 h-3.5 text-accent shrink-0" />
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
                  <span className="font-editorial-label text-xs text-accent num">
                    01 //
                  </span>
                  <span>ทำไมโปรเจกต์นี้ถึงเกิดมา และช่วยแก้ปัญหาอะไร?</span>
                </h2>
                <p className="max-w-[68ch]">{repo.problem_solved}</p>
                <div className="p-4 editorial-well text-base">
                  <strong className="text-ink">
                    เหตุผลประเมินความพร้อม ({repo.maturity_rating}):{" "}
                  </strong>
                  <span>{repo.maturity_reason}</span>
                </div>
              </section>

              <section id="repo-compare" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    02 //
                  </span>
                  <span>เปรียบเทียบกับเครื่องมืออื่นที่ใกล้เคียงกัน</span>
                </h2>
                <blockquote className="p-5 border-t-2 border-t-ink editorial-well italic max-w-[68ch]">
                  &ldquo;{repo.alternative_comparison}&rdquo;
                </blockquote>
              </section>

              <section id="repo-saas" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    03 //
                  </span>
                  <span>แนวทางนำไปต่อยอดสร้างธุรกิจ / Micro-SaaS</span>
                </h2>
                <div className="p-6 border border-success bg-success-soft space-y-3 text-base">
                  <div className="font-editorial-label text-success flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>ไอเดียสร้างรายได้ (Monetization Idea)</span>
                  </div>
                  <p className="text-ink max-w-[68ch]">{repo.ai_opportunity.monetization_idea}</p>
                  <div className="pt-3 border-t border-rule text-sm">
                    <strong className="text-ink">การใช้ร่วมกับ Modern Stack: </strong>
                    <span>{repo.ai_opportunity.stack_synergy}</span>
                  </div>
                </div>
              </section>

              <section id="repo-vibe" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    04 //
                  </span>
                  <span>
                    เสียงสะท้อนจากนักพัฒนาจริง (Vibe Check: {repo.human_vibe_check.hype_vs_reality}/10)
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 border border-rule bg-paper space-y-2">
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

                  <div className="p-5 border border-rule bg-paper space-y-2">
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
                  <span className="font-editorial-label text-xs text-accent num">
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
                    onClick={copyQuickStart}
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
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (news) {
    const newsToc: TocItem[] = [
      { id: "news-tldr", num: "01", label: "สรุปใจความสำคัญ (TL;DR)" },
      { id: "news-figure", num: "02", label: "ภาพประกอบข่าว" },
      { id: "news-story", num: "03", label: "เจาะลึกข่าวแบบเข้าใจง่าย" },
      { id: "news-impact", num: "04", label: "ก่อน vs หลังอัปเดต & ผลกระทบ" },
      { id: "news-playbook", num: "05", label: "แนวทางนำไปใช้ประโยชน์จริง" },
      { id: "news-highlights", num: "06", label: "สิ่งใหม่ที่โดดเด่น & ข้อควรระวัง" },
      { id: "news-source", num: "07", label: "ลิงก์ประกาศต้นฉบับ" },
    ];

    return (
      <article className="container py-6 sm:py-10">
        <ReaderTopBar
          onBack={onBack}
          fontSize={fontSize}
          setFontSize={setFontSize}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
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
                    <dd className="inline font-medium text-accent">{news.category}</dd>
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
                        className="px-2 py-0.5 bg-paper border border-rule text-xs font-editorial-label text-muted"
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
              countText="7 หัวข้อ"
              items={newsToc}
            />

            <header className="pb-6 sm:pb-8 mb-8 border-b border-rule space-y-4">
              <h1 className="font-editorial-display text-2xl sm:text-4xl md:text-[2.6rem] text-ink leading-tight max-w-none">
                {news.hook_headline}
              </h1>

              <p className="text-sm sm:text-base text-muted font-editorial-body italic max-w-3xl">
                หัวข้อข่าวต้นฉบับ: &ldquo;{news.title}&rdquo;
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs font-editorial-label">
                <span className="px-2.5 py-0.5 bg-accent text-accent-ink whitespace-nowrap">
                  {news.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-paper-2 border border-rule text-ink whitespace-nowrap">
                  <Newspaper className="w-3.5 h-3.5 text-accent shrink-0" />
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
              {/* 01: TL;DR */}
              <section
                id="news-tldr"
                className="p-6 editorial-well border-t-2 border-t-ink"
              >
                <h2 className="font-editorial-display text-xl text-ink mb-3 flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    01 //
                  </span>
                  <span>สรุปใจความสำคัญใน 30 วินาที (Key Takeaways)</span>
                </h2>
                <ul className="space-y-2.5 text-base max-w-[68ch]">
                  {news.tldr_takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-bold text-accent shrink-0" aria-hidden="true">
                        &rsaquo;
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 02: Figure */}
              <section id="news-figure" className="space-y-3">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    02 //
                  </span>
                  <span>ภาพประกอบข่าวจากประกาศทางการ</span>
                </h2>
                {!imgError && news.thumbnail_url ? (
                  <figure className="editorial-photo border border-rule bg-paper-2 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={news.thumbnail_url}
                      alt={news.title}
                      onError={() => setImgError(true)}
                      className="w-full max-h-[420px] object-contain mx-auto"
                    />
                    <figcaption className="text-xs text-center text-muted mt-2.5 pt-2 border-t border-rule font-editorial-label">
                      ภาพประกอบจาก {news.source}: {news.title}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="p-6 editorial-well text-sm text-muted">
                    ติดตามภาพประกอบเพิ่มเติมและวิดีโอสาธิตได้ในประกาศฉบับเต็มจากลิงก์ Google Blog ด้านล่าง
                  </div>
                )}
              </section>

              {/* 03: Layman Story */}
              <section id="news-story" className="space-y-5">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
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

              {/* 04: Before vs After */}
              <section id="news-impact" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    04 //
                  </span>
                  <span>เปรียบเทียบก่อนอัปเดต vs หลังอัปเดต</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 border border-rule bg-paper">
                    <div className="text-xs font-editorial-label text-muted mb-2">
                      ก่อนอัปเดต (Before)
                    </div>
                    <p>{news.impact_comparison.before}</p>
                  </div>

                  <div className="p-5 border border-success bg-success-soft">
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

              {/* 05: Actionable Playbook */}
              <section id="news-playbook" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
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
                        <span className="px-2.5 py-0.5 text-xs font-editorial-label bg-paper-2 border border-rule text-ink whitespace-nowrap">
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

              {/* 06: Highlights & Watchouts */}
              <section id="news-highlights" className="space-y-4">
                <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
                  <span className="font-editorial-label text-xs text-accent num">
                    06 //
                  </span>
                  <span>จุดเด่นที่เปิดตัว &amp; ข้อควรจับตา</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 border border-rule bg-paper space-y-2">
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

                  <div className="p-5 border border-rule bg-paper space-y-2">
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
                  <span className="font-editorial-label text-xs text-accent num">
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
            </div>
          </div>
        </div>
      </article>
    );
  }

  return null;
}
