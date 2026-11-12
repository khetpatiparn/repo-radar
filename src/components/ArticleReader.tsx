"use client";

import { useState } from "react";
import { type PaperData, type RepositoryData } from "../types";
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
} from "lucide-react";

type FontSizeScale = "normal" | "large" | "xlarge";

interface ArticleReaderProps {
  paper?: PaperData | null;
  repo?: RepositoryData | null;
  isSaved: boolean;
  onToggleSave: () => void;
  onBack: () => void;
  isTwoDayStreak?: boolean;
  starsAddedSinceYesterday?: number;
}

export function ArticleReader({
  paper,
  repo,
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
    const tocItems = [
      { id: "sec-tldr", num: "01", label: "สรุปใจความสำคัญ (TL;DR)" },
      { id: "sec-figure", num: "02", label: "ภาพประกอบจากงานวิจัย" },
      { id: "sec-story", num: "03", label: "เจาะลึกแบบภาษาคนทั่วไป" },
      { id: "sec-impact", num: "04", label: "วิธีเดิม vs วิธีใหม่ & ผลกระทบ" },
      { id: "sec-usecases", num: "05", label: "3 ยูสเคสการนำไปใช้ต่อยอด" },
      { id: "sec-community", num: "06", label: "เสียงสะท้อน & ข้อจำกัด" },
      { id: "sec-sources", num: "07", label: "ลิงก์เปเปอร์ต้นฉบับ & โค้ด" },
    ];

    return (
      <article className="w-full px-4 sm:px-8 lg:px-10 py-5 sm:py-8">
        {/* Top Reader Bar */}
        <div className="pb-4 mb-6 sm:mb-8 border-b-2 border-[var(--paper-rule-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--paper-ink)] hover:text-[var(--paper-accent)] transition cursor-pointer active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>กลับไปหน้าหนังสือพิมพ์</span>
          </button>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            {/* Font Size Controls for Eye Comfort */}
            <div className="flex items-center border border-[var(--paper-rule)] rounded bg-[var(--paper-sheet)] overflow-hidden text-xs">
              <span className="px-2 py-1 text-[var(--paper-muted)] border-r border-[var(--paper-rule)] text-[11px] sm:text-xs">
                ขนาดอักษร
              </span>
              <button
                onClick={() => setFontSize("normal")}
                className={`px-2.5 py-1 font-medium cursor-pointer transition ${
                  fontSize === "normal"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
                }`}
              >
                ก
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-2.5 py-1 font-semibold cursor-pointer transition ${
                  fontSize === "large"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
                }`}
              >
                ก+
              </button>
              <button
                onClick={() => setFontSize("xlarge")}
                className={`px-2.5 py-1 font-bold cursor-pointer transition ${
                  fontSize === "xlarge"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)] hover:bg-[var(--paper-subtle)]"
                }`}
              >
                ก++
              </button>
            </div>

            <button
              onClick={onToggleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer active:scale-95 shrink-0 ${
                isSaved
                  ? "bg-[var(--paper-accent)] text-white border-[var(--paper-accent)]"
                  : "bg-[var(--paper-sheet)] text-[var(--paper-ink)] border-[var(--paper-rule)] hover:border-[var(--paper-rule-strong)]"
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>คั่นแล้ว</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>คั่นหน้า</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Sticky Sidebar: Table of Contents (Desktop lg: only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
              <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-sheet)] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--paper-ink)] pb-3 mb-3 border-b border-[var(--paper-rule)]">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--paper-accent)]" />
                  <span>สารบัญบทความ (TOC)</span>
                </div>
                <nav className="space-y-1.5 text-xs sm:text-sm">
                  {tocItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-start gap-2 py-1 text-[var(--paper-muted)] hover:text-[var(--paper-ink)] transition"
                    >
                      <span className="font-mono text-xs text-[var(--paper-accent)] mt-0.5 shrink-0">
                        {item.num}
                      </span>
                      <span className="leading-snug">{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Paper Metadata Card */}
              <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/60 text-xs space-y-2.5">
                <div className="font-bold text-[var(--paper-ink)] uppercase tracking-wider">
                  ข้อมูลจำเพาะของเปเปอร์
                </div>
                <div>
                  <span className="text-[var(--paper-muted)]">รหัส arXiv: </span>
                  <span className="font-mono text-[var(--paper-ink)] font-semibold">
                    {paper.id}
                  </span>
                </div>
                {paper.organization && (
                  <div>
                    <span className="text-[var(--paper-muted)]">สถาบัน/ทีมวิจัย: </span>
                    <span className="font-semibold text-[var(--paper-ink)]">
                      {paper.organization}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[var(--paper-muted)]">คะแนนโหวตชุมชน: </span>
                  <span className="font-semibold text-[var(--paper-ink)]">
                    ▲ {paper.upvotes} Upvotes
                  </span>
                </div>
                <div>
                  <span className="text-[var(--paper-muted)]">คะแนนความน่าจับตา: </span>
                  <span className="font-semibold text-[var(--paper-green)]">
                    {paper.community_pulse.hype_score}/10
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Editorial Reading Column */}
          <div className="lg:col-span-9 bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded p-4 sm:p-8 md:p-10 shadow-xs">
            {/* Mobile / Tablet Quick Collapsible Table of Contents */}
            <details className="lg:hidden mb-6 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/70 p-3 sm:p-4 text-xs sm:text-sm">
              <summary className="font-bold text-[var(--paper-ink)] cursor-pointer flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--paper-accent)]" />
                  <span>สารบัญบทความ (แตะเพื่อกระโดดไปยังหัวข้อ)</span>
                </span>
                <span className="text-xs text-[var(--paper-muted)]">7 หัวข้อ</span>
              </summary>
              <nav className="mt-3 pt-3 border-t border-[var(--paper-rule)] space-y-2">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 py-1 text-[var(--paper-body)] hover:text-[var(--paper-accent)]"
                  >
                    <span className="font-mono text-xs text-[var(--paper-accent)]">
                      {item.num}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </details>

            {/* Article Header */}
            <header className="pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-[var(--paper-rule)]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs mb-3 sm:mb-4">
                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent-soft)] text-[var(--paper-accent)]">
                  {paper.category}
                </span>
                {paper.organization && (
                  <span className="px-2.5 py-0.5 rounded font-semibold bg-[var(--paper-subtle)] text-[var(--paper-ink)]">
                    🏛️ {paper.organization}
                  </span>
                )}
                {paper.github_url && (
                  <span className="px-2.5 py-0.5 rounded font-semibold bg-[var(--paper-green-soft)] text-[var(--paper-green)]">
                    💻 มีโค้ด GitHub
                  </span>
                )}
                <span className="text-[var(--paper-muted)] flex items-center gap-1 sm:ml-auto">
                  <Clock className="w-3.5 h-3.5" />
                  อ่าน {paper.reading_time_minutes} นาที
                </span>
              </div>

              <h1 className="font-editorial text-xl sm:text-3xl md:text-4xl font-bold text-[var(--paper-ink)] leading-snug mb-3 sm:mb-4">
                {paper.hook_headline}
              </h1>

              <p className="text-sm sm:text-base text-[var(--paper-muted)] font-serif italic mb-4">
                ชื่อเปเปอร์ต้นฉบับ: &ldquo;{paper.title}&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--paper-rule)] text-xs text-[var(--paper-muted)]">
                <div>
                  {paper.authors.length > 0 && (
                    <span>
                      ผู้วิจัย: {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 ? " และคณะ" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 font-medium text-[var(--paper-ink)] text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-[var(--paper-accent)]" />
                    {paper.upvotes} โหวตบน HF
                  </span>
                  <span>•</span>
                  <span>{paper.published_date}</span>
                </div>
              </div>
            </header>

            {/* Body Content with Adjustable Font Scale */}
            <div className={`space-y-10 text-[var(--paper-body)] ${fontSizeClass}`}>
              {/* Section 01: TL;DR */}
              <section
                id="sec-tldr"
                className="p-6 rounded bg-[var(--paper-subtle)]/70 border-l-4 border-[var(--paper-accent)]"
              >
                <h2 className="font-editorial text-lg font-bold text-[var(--paper-ink)] mb-3 flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    01 //
                  </span>
                  <span>สรุปใจความสำคัญใน 30 วินาที (Key Takeaways)</span>
                </h2>
                <ul className="space-y-2.5 text-base">
                  {paper.tldr_takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-bold text-[var(--paper-accent)] shrink-0">
                        •
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 02: Paper Visual Preview */}
              <section id="sec-figure" className="space-y-3">
                <h2 className="font-editorial text-xl font-bold text-[var(--paper-ink)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    02 //
                  </span>
                  <span>ภาพประกอบและแผนผังจากงานวิจัย</span>
                </h2>
                {!imgError && paper.thumbnail_url ? (
                  <figure className="border border-[var(--paper-rule)] rounded overflow-hidden bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={paper.thumbnail_url}
                      alt={paper.title}
                      onError={() => setImgError(true)}
                      className="w-full max-h-[420px] object-contain mx-auto rounded"
                    />
                    <figcaption className="text-xs text-center text-stone-600 mt-2.5 pt-2 border-t border-stone-200 font-sans">
                      ภาพตัวอย่างจากเอกสารงานวิจัย {paper.title} (arXiv:{paper.id})
                    </figcaption>
                  </figure>
                ) : (
                  <div className="p-6 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/40 text-sm text-[var(--paper-muted)]">
                    ดูแผนผังสถาปัตยกรรมและตารางผลการทดลองฉบับเต็มได้ในเอกสาร PDF ด้านล่างของบทความ
                  </div>
                )}
              </section>

              {/* Section 03: Deep Layman Explanation */}
              <section id="sec-story" className="space-y-5">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    03 //
                  </span>
                  <span>เจาะลึกเรื่องราวแบบคนทั่วไปเข้าใจง่าย</span>
                </h2>
                <p className="font-semibold text-[var(--paper-ink)]">
                  {paper.short_teaser}
                </p>
                {paper.layman_story.map((paragraph, idx) => (
                  <p key={idx} className="text-[var(--paper-body)]">
                    {paragraph}
                  </p>
                ))}
              </section>

              {/* Section 04: Before vs After & Impact */}
              <section id="sec-impact" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    04 //
                  </span>
                  <span>เปรียบเทียบวิธีเดิม vs วิธีใหม่ และผลกระทบ</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)]">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--paper-muted)] mb-2">
                      ข้อจำกัดของวิธีแบบเดิม (Before)
                    </div>
                    <p>{paper.impact_comparison.before}</p>
                  </div>

                  <div className="p-5 rounded border border-[var(--paper-green)]/40 bg-[var(--paper-green-soft)]/50">
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--paper-green)] mb-2">
                      สิ่งที่เปลี่ยนไปจากเปเปอร์นี้ (After)
                    </div>
                    <p>{paper.impact_comparison.after}</p>
                  </div>
                </div>

                <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/50 text-base">
                  <span className="font-bold text-[var(--paper-ink)]">
                    ทำไมเรื่องนี้ถึงสำคัญต่ออนาคต:{" "}
                  </span>
                  <span>{paper.impact_comparison.why_it_matters}</span>
                </div>
              </section>

              {/* Section 05: 3 Concrete Use Cases */}
              <section id="sec-usecases" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    05 //
                  </span>
                  <span>แนวทางการนำไปประยุกต์ใช้จริง (3 ยูสเคส)</span>
                </h2>

                <div className="space-y-4 text-base">
                  {paper.use_cases.map((uc, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <h3 className="font-editorial font-bold text-lg text-[var(--paper-ink)]">
                          ยูสเคสที่ {idx + 1}: {uc.title}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[var(--paper-subtle)] text-[var(--paper-ink)]">
                          {uc.role}
                        </span>
                      </div>
                      <p className="mb-2">{uc.description}</p>
                      <div className="text-sm text-[var(--paper-muted)] pt-2 border-t border-[var(--paper-rule)]">
                        <strong className="text-[var(--paper-ink)]">
                          ตัวอย่างการใช้งานจริง:{" "}
                        </strong>
                        {uc.example}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 06: Community Pulse */}
              <section id="sec-community" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    06 //
                  </span>
                  <span>เสียงสะท้อนจากนักวิจัยและข้อควรระวัง</span>
                </h2>

                <p className="text-base italic text-[var(--paper-muted)]">
                  &ldquo;{paper.community_pulse.summary}&rdquo;
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] space-y-2">
                    <div className="font-bold text-sm text-[var(--paper-green)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>จุดเด่นที่คนในวงการชื่นชม</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {paper.community_pulse.praises.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--paper-green)] font-bold">
                            +
                          </span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] space-y-2">
                    <div className="font-bold text-sm text-[var(--paper-amber)] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>ข้อจำกัดและสิ่งที่ต้องระวัง</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      {paper.community_pulse.critiques.map((c, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--paper-amber)] font-bold">
                            !
                          </span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 07: External Source Links (Only clicked when user wants raw PDF/Repo) */}
              <section
                id="sec-sources"
                className="pt-6 border-t-2 border-[var(--paper-rule-strong)] space-y-4"
              >
                <h2 className="font-editorial text-xl font-bold text-[var(--paper-ink)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    07 //
                  </span>
                  <span>เอกสารต้นทางและซอร์สโค้ด (สำหรับผู้ที่ต้องการศึกษาฉบับเต็ม)</span>
                </h2>
                <p className="text-sm text-[var(--paper-muted)]">
                  คุณสามารถกดปุ่มด้านล่างเพื่อเปิดดูไฟล์ PDF ต้นฉบับบน arXiv,
                  ร่วมพูดคุยบน Hugging Face, หรือดาวน์โหลดโค้ดบน GitHub ได้โดยตรง:
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {paper.github_url && (
                    <a
                      href={paper.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold bg-[var(--paper-ink)] text-[var(--paper-sheet)] hover:opacity-90 transition"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>เปิด GitHub Repository ของเปเปอร์นี้</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <a
                    href={paper.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold border border-[var(--paper-rule-strong)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:bg-[var(--paper-subtle)] transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>อ่านเปเปอร์ต้นฉบับ (arXiv PDF)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={paper.hf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-body)] hover:bg-[var(--paper-subtle)] transition"
                  >
                    <span>หน้าพูดคุยบน Hugging Face</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {paper.project_url && (
                    <a
                      href={paper.project_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-body)] hover:bg-[var(--paper-subtle)] transition"
                    >
                      <span>เว็บไซต์โปรเจกต์ / Demo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
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
    const repoToc = [
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
      <article className="w-full px-4 sm:px-8 lg:px-10 py-5 sm:py-8">
        {/* Top Reader Bar */}
        <div className="pb-4 mb-6 sm:mb-8 border-b-2 border-[var(--paper-rule-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--paper-ink)] hover:text-[var(--paper-accent)] transition cursor-pointer active:scale-95 self-start"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>กลับไปหน้าหนังสือพิมพ์</span>
          </button>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <div className="flex items-center border border-[var(--paper-rule)] rounded bg-[var(--paper-sheet)] overflow-hidden text-xs">
              <span className="px-2 py-1 text-[var(--paper-muted)] border-r border-[var(--paper-rule)] text-[11px] sm:text-xs">
                ขนาดอักษร
              </span>
              <button
                onClick={() => setFontSize("normal")}
                className={`px-2.5 py-1 font-medium cursor-pointer ${
                  fontSize === "normal"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)]"
                }`}
              >
                ก
              </button>
              <button
                onClick={() => setFontSize("large")}
                className={`px-2.5 py-1 font-semibold cursor-pointer ${
                  fontSize === "large"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)]"
                }`}
              >
                ก+
              </button>
              <button
                onClick={() => setFontSize("xlarge")}
                className={`px-2.5 py-1 font-bold cursor-pointer ${
                  fontSize === "xlarge"
                    ? "bg-[var(--paper-ink)] text-[var(--paper-sheet)]"
                    : "text-[var(--paper-body)]"
                }`}
              >
                ก++
              </button>
            </div>

            <button
              onClick={onToggleSave}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border transition cursor-pointer active:scale-95 shrink-0 ${
                isSaved
                  ? "bg-[var(--paper-accent)] text-white border-[var(--paper-accent)]"
                  : "bg-[var(--paper-sheet)] text-[var(--paper-ink)] border-[var(--paper-rule)]"
              }`}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>คั่นแล้ว</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>คั่นหน้า</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          {/* Left Sticky TOC (Desktop lg: only) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 space-y-6">
              <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-sheet)] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--paper-ink)] pb-3 mb-3 border-b border-[var(--paper-rule)]">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--paper-accent)]" />
                  <span>สารบัญบทวิเคราะห์</span>
                </div>
                <nav className="space-y-1.5 text-xs sm:text-sm">
                  {repoToc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-start gap-2 py-1 text-[var(--paper-muted)] hover:text-[var(--paper-ink)] transition"
                    >
                      <span className="font-mono text-xs text-[var(--paper-accent)] mt-0.5 shrink-0">
                        {item.num}
                      </span>
                      <span className="leading-snug">{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>

              <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/60 text-xs space-y-2.5">
                <div className="font-bold text-[var(--paper-ink)] uppercase tracking-wider">
                  สถิติ GitHub ล่าสุด
                </div>
                <div>
                  <span className="text-[var(--paper-muted)]">ชื่อเต็ม: </span>
                  <span className="font-mono font-semibold text-[var(--paper-ink)]">
                    {repo.owner}/{repo.name}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--paper-muted)]">ดาวทั้งหมด: </span>
                  <span className="font-semibold text-[var(--paper-ink)]">
                    ⭐ {repo.stars.toLocaleString()} (+{repo.stars_today.toLocaleString()} วันนี้)
                  </span>
                </div>
                {isTwoDayStreak && (
                  <div className="text-[var(--paper-amber)] font-semibold">
                    🔥 ติดเทรนด์ 2 วันซ้อน
                    {starsAddedSinceYesterday > 0
                      ? ` (+${starsAddedSinceYesterday.toLocaleString()} ดาว)`
                      : ""}
                  </div>
                )}
                <div>
                  <span className="text-[var(--paper-muted)]">ความพร้อมใช้งาน: </span>
                  <span className="font-semibold text-[var(--paper-ink)]">
                    {repo.maturity_rating}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Reading Sheet */}
          <div className="lg:col-span-9 bg-[var(--paper-sheet)] border border-[var(--paper-rule)] rounded p-4 sm:p-8 md:p-10 shadow-xs">
            {/* Mobile / Tablet Quick Collapsible Table of Contents */}
            <details className="lg:hidden mb-6 rounded border border-[var(--paper-rule)] bg-[var(--paper-subtle)]/70 p-3 sm:p-4 text-xs sm:text-sm">
              <summary className="font-bold text-[var(--paper-ink)] cursor-pointer flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--paper-accent)]" />
                  <span>สารบัญบทวิเคราะห์ (แตะเพื่อกระโดดไปยังหัวข้อ)</span>
                </span>
                <span className="text-xs text-[var(--paper-muted)]">5 หัวข้อ</span>
              </summary>
              <nav className="mt-3 pt-3 border-t border-[var(--paper-rule)] space-y-2">
                {repoToc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-2 py-1 text-[var(--paper-body)] hover:text-[var(--paper-accent)]"
                  >
                    <span className="font-mono text-xs text-[var(--paper-accent)]">
                      {item.num}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </details>

            <header className="pb-6 sm:pb-8 mb-6 sm:mb-8 border-b border-[var(--paper-rule)]">
              <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs mb-3 sm:mb-4">
                <span className="px-2.5 py-0.5 rounded font-bold uppercase tracking-wider bg-[var(--paper-accent-soft)] text-[var(--paper-accent)]">
                  {repo.language || "Open Source"}
                </span>
                <span className="px-2.5 py-0.5 rounded font-semibold bg-[var(--paper-subtle)] text-[var(--paper-ink)]">
                  {repo.maturity_rating}
                </span>
                {isTwoDayStreak && (
                  <span className="px-2.5 py-0.5 rounded font-semibold bg-[var(--paper-amber-soft)] text-[var(--paper-amber)]">
                    🔥 ติดเทรนด์ 2 วันซ้อน
                  </span>
                )}
                <span className="sm:ml-auto flex items-center gap-1 font-semibold text-[var(--paper-ink)]">
                  <Star className="w-3.5 h-3.5 text-[var(--paper-amber)] fill-[var(--paper-amber)]" />
                  {repo.stars.toLocaleString()} (+{repo.stars_today.toLocaleString()} วันนี้)
                </span>
              </div>

              <h1 className="font-editorial text-xl sm:text-3xl md:text-4xl font-bold text-[var(--paper-ink)] leading-snug mb-3">
                {repo.one_liner}
              </h1>

              <p className="font-mono text-xs sm:text-sm text-[var(--paper-muted)]">
                Repository: {repo.owner}/{repo.name} • สัญญาอนุญาต:{" "}
                {repo.license || "ไม่ระบุ"} • Issues เปิดอยู่: {repo.open_issues}
              </p>
            </header>

            <div className={`space-y-10 text-[var(--paper-body)] ${fontSizeClass}`}>
              <section id="repo-overview" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    01 //
                  </span>
                  <span>ทำไมโปรเจกต์นี้ถึงเกิดมา และช่วยแก้ปัญหาอะไร?</span>
                </h2>
                <p>{repo.problem_solved}</p>
                <div className="p-4 rounded bg-[var(--paper-subtle)]/60 text-base">
                  <strong className="text-[var(--paper-ink)]">
                    เหตุผลประเมินความพร้อม ({repo.maturity_rating}):{" "}
                  </strong>
                  <span>{repo.maturity_reason}</span>
                </div>
              </section>

              <section id="repo-compare" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    02 //
                  </span>
                  <span>เปรียบเทียบกับเครื่องมืออื่นที่ใกล้เคียงกัน</span>
                </h2>
                <blockquote className="p-5 rounded border-l-4 border-[var(--paper-accent)] bg-[var(--paper-subtle)]/50 italic">
                  &ldquo;{repo.alternative_comparison}&rdquo;
                </blockquote>
              </section>

              <section id="repo-saas" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    03 //
                  </span>
                  <span>แนวทางนำไปต่อยอดสร้างธุรกิจ / Micro-SaaS</span>
                </h2>
                <div className="p-6 rounded border border-[var(--paper-green)]/40 bg-[var(--paper-green-soft)]/50 space-y-3 text-base">
                  <div className="font-bold text-[var(--paper-green)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>ไอเดียสร้างรายได้ (Monetization Idea)</span>
                  </div>
                  <p>{repo.ai_opportunity.monetization_idea}</p>
                  <div className="pt-3 border-t border-[var(--paper-rule)] text-sm">
                    <strong className="text-[var(--paper-ink)]">
                      การใช้ร่วมกับ Modern Stack:{" "}
                    </strong>
                    <span>{repo.ai_opportunity.stack_synergy}</span>
                  </div>
                </div>
              </section>

              <section id="repo-vibe" className="space-y-4">
                <h2 className="font-editorial text-2xl font-bold text-[var(--paper-ink)] pb-2 border-b border-[var(--paper-rule)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    04 //
                  </span>
                  <span>เสียงสะท้อนจากนักพัฒนาจริง (Vibe Check: {repo.human_vibe_check.hype_vs_reality}/10)</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                  <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] space-y-2">
                    <div className="font-bold text-sm text-[var(--paper-green)]">
                      👍 จุดเด่นที่คนชอบ
                    </div>
                    <ul className="space-y-2 text-sm">
                      {repo.human_vibe_check.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--paper-green)] font-bold">+</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded border border-[var(--paper-rule)] bg-[var(--paper-bg)] space-y-2">
                    <div className="font-bold text-sm text-[var(--paper-amber)]">
                      ⚠️ ข้อควรระวัง / ข้อจำกัด
                    </div>
                    <ul className="space-y-2 text-sm">
                      {repo.human_vibe_check.gotchas_and_traps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--paper-amber)] font-bold">!</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section
                id="repo-quickstart"
                className="pt-6 border-t-2 border-[var(--paper-rule-strong)] space-y-4"
              >
                <h2 className="font-editorial text-xl font-bold text-[var(--paper-ink)] flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--paper-accent)]">
                    05 //
                  </span>
                  <span>คำสั่งเริ่มต้นใช้งาน (Quick Start) & ลิงก์ต้นทาง</span>
                </h2>

                <div className="flex items-center justify-between gap-2 p-4 rounded bg-[var(--paper-bg)] border border-[var(--paper-rule)] font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap text-[var(--paper-ink)]">
                    {repo.quick_start}
                  </pre>
                  <button
                    onClick={copyQuickStart}
                    className="px-3 py-1.5 rounded border border-[var(--paper-rule)] bg-[var(--paper-sheet)] text-[var(--paper-ink)] hover:bg-[var(--paper-subtle)] shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[var(--paper-green)]" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
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
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold bg-[var(--paper-ink)] text-[var(--paper-sheet)] hover:opacity-90 transition"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>เปิด GitHub Repository ({repo.owner}/{repo.name})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={`${repo.url}/issues`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold border border-[var(--paper-rule)] bg-[var(--paper-bg)] text-[var(--paper-ink)] hover:bg-[var(--paper-subtle)] transition"
                  >
                    <span>ดู Issues & ปัญหาที่พบ ({repo.open_issues})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
