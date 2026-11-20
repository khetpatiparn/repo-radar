"use client";

import type React from "react";
import type { DeepReadingGuide } from "../types";
import {
  ChevronDown,
  BookMarked,
  Layers,
  Terminal,
  Compass,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const SOURCE_DEPTH_LABELS: Record<
  NonNullable<DeepReadingGuide["source_depth"]>,
  string
> = {
  full_article: "สกัดจากบทความต้นฉบับเต็ม",
  arxiv_and_readme: "สกัดจาก arXiv HTML + GitHub README",
  arxiv_html: "สกัดจาก arXiv HTML ฉบับเต็ม",
  readme_and_issues: "สกัดจาก README + โครงสร้างไฟล์ + Issues",
  abstract_only: "สกัดจากบทคัดย่อ (Abstract)",
};

export function Pass1TriageStrip({ guide }: { guide: DeepReadingGuide }) {
  const { pass1_triage, source_depth } = guide;

  return (
    <div className="mt-5 pt-5 border-t border-rule space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-editorial-label">
        <span className="text-accent-hi tracking-wide uppercase">
          Pass 1 · คัดกรองก่อนลงลึก (5 Cs)
        </span>
        {source_depth && (
          <span className="text-muted">{SOURCE_DEPTH_LABELS[source_depth]}</span>
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
        <div>
          <dt className="text-[11px] font-editorial-label text-muted uppercase tracking-wide mb-0.5">
            แก่นเรื่องนี้ (Core Idea)
          </dt>
          <dd className="text-ink leading-relaxed">{pass1_triage.core_idea}</dd>
        </div>

        <div>
          <dt className="text-[11px] font-editorial-label text-muted uppercase tracking-wide mb-0.5">
            ต่อยอดจาก (Context)
          </dt>
          <dd className="text-ink-2 leading-relaxed">
            {pass1_triage.context_lineage}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-editorial-label text-muted uppercase tracking-wide mb-0.5">
            พื้นฐานที่ควรมี (Prerequisites)
          </dt>
          <dd className="text-ink-2 leading-relaxed">
            {pass1_triage.prerequisite_level}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-editorial-label text-muted uppercase tracking-wide mb-0.5">
            คุ้มเวลาเจาะลึกแค่ไหน (Verdict)
          </dt>
          <dd className="text-accent-2 font-medium leading-relaxed">
            {pass1_triage.worth_deep_dive}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function GlossaryScaffolding({
  sectionId,
  glossary,
}: {
  sectionId: string;
  glossary: DeepReadingGuide["glossary"];
}) {
  if (!glossary || glossary.length === 0) return null;

  const previewTerms = glossary
    .slice(0, 4)
    .map((g) => g.term)
    .join(" · ");

  return (
    <details
      id={sectionId}
      className="group rounded-[var(--radius-card)] bg-paper-2 transition-colors"
    >
      <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-4 select-none">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-sm font-editorial-label text-ink">
            <BookMarked className="w-4 h-4 text-accent-hi shrink-0" />
            <span>ปูศัพท์เทคนิคก่อนอ่าน ({glossary.length} คำ)</span>
          </div>
          <p className="text-xs text-muted truncate font-mono">{previewTerms}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-editorial-label text-muted group-hover:text-ink shrink-0">
          <span className="group-open:hidden">กดเปิดดู</span>
          <span className="hidden group-open:inline">พับเก็บ</span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>

      <div className="px-5 pb-5 pt-2 border-t border-rule divide-y divide-rule">
        {glossary.map((item, idx) => (
          <div key={idx} className="py-3.5 first:pt-2 last:pb-0 space-y-1">
            <div className="font-mono text-sm font-semibold text-ink">
              {item.term}
            </div>
            <p className="text-sm text-ink-2 leading-relaxed max-w-[68ch]">
              {item.meaning}
            </p>
            {item.analogy && (
              <p className="text-xs sm:text-sm text-muted italic max-w-[68ch]">
                เปรียบง่ายๆ: {item.analogy}
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

export function Pass2MechanismAndEvidence({
  sectionId,
  sectionNum,
  howItWorks,
  hardEvidence,
}: {
  sectionId: string;
  sectionNum: string;
  howItWorks: DeepReadingGuide["how_it_works"];
  hardEvidence: DeepReadingGuide["hard_evidence"];
}) {
  const hasSteps = howItWorks && howItWorks.length > 0;
  const hasEvidence = hardEvidence && hardEvidence.length > 0;
  if (!hasSteps && !hasEvidence) return null;

  return (
    <section id={sectionId} className="space-y-8">
      {hasSteps && (
        <div className="space-y-4">
          <h2 className="font-editorial-display text-xl sm:text-2xl text-ink pb-2 border-b border-rule flex items-center gap-2 max-w-none">
            <span className="font-editorial-label text-xs text-accent-hi num">
              {`${sectionNum} //`}
            </span>
            <Layers className="w-4 h-4 text-accent-hi shrink-0" />
            <span>Pass 2 · กลไกการทำงานจริง (How It Works)</span>
          </h2>

          <ol className="divide-y divide-rule border-b border-rule">
            {howItWorks.map((item, idx) => (
              <li
                key={idx}
                className="py-4 flex items-start gap-4 text-base"
              >
                <span className="font-mono text-xs font-semibold text-accent-hi pt-1 shrink-0 num">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="space-y-1 min-w-0">
                  <div className="font-editorial-display text-base sm:text-lg text-ink leading-snug">
                    {item.step}
                  </div>
                  <p className="text-sm sm:text-base text-ink-2 leading-relaxed max-w-[66ch]">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {hasEvidence && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-editorial-label text-ink">
            <BarChart3 className="w-4 h-4 text-accent-hi shrink-0" />
            <span>ตัวเลข สเปก และหลักฐานจริงจากต้นฉบับ (Hard Evidence)</span>
          </div>

          <div className="divide-y divide-rule border-t border-b border-rule">
            {hardEvidence.map((ev, idx) => (
              <div
                key={idx}
                className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline text-sm"
              >
                <div className="sm:col-span-4 font-editorial-label text-muted">
                  {ev.metric}
                </div>
                <div className="sm:col-span-3 font-mono font-semibold text-ink num">
                  {ev.value}
                </div>
                <div className="sm:col-span-5 text-ink-2/90 leading-relaxed">
                  {ev.context}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function Pass3HandsOnDrawer({
  sectionId,
  sectionNum,
  handsOn,
  quickStartSlot,
}: {
  sectionId: string;
  sectionNum: string;
  handsOn: DeepReadingGuide["pass3_hands_on"];
  quickStartSlot?: React.ReactNode;
}) {
  const hasPrereqs = handsOn.prerequisites.length > 0;
  const hasSteps = handsOn.try_it_steps.length > 0;
  const hasNext = handsOn.next_to_learn.length > 0;
  if (!hasPrereqs && !hasSteps && !hasNext) return null;

  return (
    <details
      id={sectionId}
      className="group rounded-[var(--radius-card)] bg-paper-2 transition-colors"
    >
      <summary className="list-none cursor-pointer px-5 sm:px-6 py-4 flex items-center justify-between gap-4 select-none">
        <div className="space-y-1 min-w-0">
          <div className="font-editorial-display text-lg sm:text-xl text-ink flex items-center gap-2">
            <span className="font-editorial-label text-xs text-accent-hi num">
              {`${sectionNum} //`}
            </span>
            <Terminal className="w-4 h-4 text-accent-hi shrink-0" />
            <span>Pass 3 · ลองทำตามจริง &amp; หัวข้อศึกษาต่อ</span>
          </div>
          <p className="text-xs text-muted font-editorial-label">
            สิ่งที่ต้องเตรียม ({handsOn.prerequisites.length}) · ขั้นตอนลองเล่น (
            {handsOn.try_it_steps.length}) · ต่อยอดความรู้ (
            {handsOn.next_to_learn.length})
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-editorial-label text-muted group-hover:text-ink shrink-0">
          <span className="group-open:hidden">เปิดคู่มือลงมือทำ</span>
          <span className="hidden group-open:inline">พับเก็บ</span>
          <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180" />
        </span>
      </summary>

      <div className="px-5 sm:px-6 pb-6 pt-4 border-t border-rule space-y-6 text-sm sm:text-base">
        {hasPrereqs && (
          <div className="space-y-2">
            <div className="text-xs font-editorial-label text-muted uppercase tracking-wide">
              สิ่งที่ต้องเตรียมก่อนลอง (Prerequisites)
            </div>
            <ul className="space-y-1.5">
              {handsOn.prerequisites.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-ink-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-hi shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {quickStartSlot}

        {hasSteps && (
          <div className="space-y-2.5">
            <div className="text-xs font-editorial-label text-muted uppercase tracking-wide">
              ลองจับของจริงใน 5–10 นาที (Try-It Steps)
            </div>
            <ol className="space-y-2.5">
              {handsOn.try_it_steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-ink-2">
                  <span className="font-mono text-xs font-semibold text-accent-hi pt-0.5 shrink-0 num">
                    {idx + 1}.
                  </span>
                  <span className="leading-relaxed max-w-[66ch]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {hasNext && (
          <div className="pt-4 border-t border-rule space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-editorial-label text-muted uppercase tracking-wide">
              <Compass className="w-3.5 h-3.5 text-accent-hi shrink-0" />
              <span>ถ้าอยากเข้าใจทะลุ ควรไปค้นเรื่องอะไรต่อ (Next to Learn)</span>
            </div>
            <ul className="space-y-1.5">
              {handsOn.next_to_learn.map((topic, idx) => (
                <li key={idx} className="flex items-start gap-2 text-ink">
                  <span className="text-accent-hi font-bold shrink-0" aria-hidden="true">
                    &rarr;
                  </span>
                  <span className="leading-relaxed max-w-[66ch]">{topic}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
