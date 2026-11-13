"use client";

import { useState } from "react";
import { type RepositoryData } from "../types";
import {
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Zap,
  Star,
  Copy,
  Check,
  Flame,
  TrendingUp,
  Cpu,
  Users,
  ThumbsUp,
} from "lucide-react";

export interface RepoCardProps {
  repo: RepositoryData;
  isTwoDayStreak?: boolean;
  starsAddedSinceYesterday?: number;
  isYesterdayView?: boolean;
  stillTrendingToday?: boolean;
}

export function RepoCard({
  repo,
  isTwoDayStreak = false,
  starsAddedSinceYesterday = 0,
  isYesterdayView = false,
  stillTrendingToday = false,
}: RepoCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(repo.quick_start);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMaturityClass = (rating: string) => {
    switch (rating) {
      case "Production-Ready":
        return "bg-success-soft text-success border-success";
      case "Experimental":
        return "bg-warn-soft text-warn border-warn";
      case "PoC":
        return "bg-error-soft text-error border-error";
      default:
        return "bg-paper-2 text-ink-2 border-rule-2";
    }
  };

  return (
    <article
      className={`bg-paper border ${
        isTwoDayStreak ? "border-ink" : "border-rule"
      }`}
    >
      {/* Header Section */}
      <div className="p-5 sm:p-6 border-b border-rule flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-editorial-display text-xl sm:text-2xl text-ink max-w-none">
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-accent"
              >
                {repo.owner}/{repo.name}
              </a>
            </h2>
            {isTwoDayStreak && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-editorial-label bg-accent text-accent-ink whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>ติดเทรนด์ 2 วันซ้อน</span>
              </span>
            )}
            {isYesterdayView && stillTrendingToday && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-editorial-label bg-success-soft text-success border border-rule whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>วันนี้ก็ยังติดเทรนด์</span>
              </span>
            )}
            <span
              className={`px-2 py-0.5 text-xs font-editorial-label border whitespace-nowrap ${getMaturityClass(
                repo.maturity_rating
              )}`}
            >
              {repo.maturity_rating}
            </span>
            {repo.language && (
              <span className="px-2 py-0.5 text-xs font-editorial-label bg-paper-2 text-ink border border-rule whitespace-nowrap">
                {repo.language}
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg font-editorial-body text-ink-2 leading-snug max-w-none">
            {repo.one_liner}
          </p>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
          <div className="inline-flex items-center gap-1.5 text-ink font-editorial-label font-medium bg-paper-2 border border-rule px-3 py-1 num">
            <Star className="w-4 h-4 text-accent shrink-0" />
            <span>{(repo.stars / 1000).toFixed(1)}k</span>
          </div>
          <span className="text-xs font-editorial-label text-success num whitespace-nowrap">
            +{repo.stars_today.toLocaleString()} {isYesterdayView ? "เมื่อวาน" : "วันนี้"}
          </span>
          {isTwoDayStreak && (
            <span className="text-xs font-editorial-label text-warn bg-warn-soft px-2 py-0.5 border border-rule num whitespace-nowrap">
              {starsAddedSinceYesterday > 0
                ? `+${starsAddedSinceYesterday.toLocaleString()} ดาวจากเมื่อวาน`
                : "ฮิตต่อเนื่องจากเมื่อวาน"}
            </span>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-rule">
        {/* Column 1: AI Strategic Vision */}
        <div className="p-5 sm:p-6 space-y-5">
          <h3 className="flex items-center gap-2 font-editorial-display text-lg text-ink pb-2 border-b border-rule">
            <Cpu className="w-4 h-4 text-accent shrink-0" />
            <span>AI Strategic Vision</span>
          </h3>

          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-editorial-label text-muted mb-1">
                ปัญหาที่โปรเจกต์นี้เข้ามาแก้
              </dt>
              <dd className="text-sm font-editorial-body text-ink-2">{repo.problem_solved}</dd>
            </div>

            <div>
              <dt className="text-xs font-editorial-label text-muted mb-1">
                เปรียบเทียบกับทางเลือกเดิม
              </dt>
              <dd className="text-sm font-editorial-body text-ink-2 italic">
                &ldquo;{repo.alternative_comparison}&rdquo;
              </dd>
            </div>
          </dl>

          <div className="editorial-well p-4 space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-editorial-label text-accent">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>โอกาสต่อยอดและแนวทางสร้างมูลค่า</span>
            </h4>
            <p className="text-sm font-editorial-body text-ink-2">
              {repo.ai_opportunity.monetization_idea}
            </p>
            <div className="pt-2 border-t border-rule text-xs font-editorial-label text-muted">
              <span className="text-ink font-medium">Stack Synergy: </span>
              <span>{repo.ai_opportunity.stack_synergy}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Real Human Vibe Check */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-rule">
            <h3 className="flex items-center gap-2 text-ink font-editorial-label text-sm">
              <Users className="w-4 h-4 text-accent shrink-0" />
              <span>Real Human Vibe Check</span>
            </h3>
            <div className="inline-flex items-center gap-2 text-xs font-editorial-label bg-paper-2 px-2.5 py-1 border border-rule">
              <span className="text-muted">Hype / Reality:</span>
              <span className="font-bold text-ink num">
                {repo.human_vibe_check.hype_vs_reality}/10
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-editorial-label text-muted mb-2 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-success shrink-0" />
                <span>สิ่งที่คนใช้งานชื่นชอบ</span>
              </h4>
              <ul className="space-y-1.5">
                {repo.human_vibe_check.pros.map((pro, i) => (
                  <li
                    key={i}
                    className="text-sm font-editorial-body text-ink-2 flex items-start gap-2"
                  >
                    <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-editorial-label text-muted mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0" />
                <span>ข้อควรระวังและกับดัก</span>
              </h4>
              <ul className="space-y-1.5">
                {repo.human_vibe_check.gotchas_and_traps.map((gotcha, i) => (
                  <li
                    key={i}
                    className="text-sm font-editorial-body text-ink-2 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-warn mt-0.5 shrink-0" />
                    <span>{gotcha}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-4 bg-paper-2 border-t border-rule flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-2/3 flex items-center bg-paper border border-rule-2 overflow-hidden">
          <div className="p-2.5 bg-paper-2 border-r border-rule text-muted shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <code className="text-xs text-ink px-3 py-2 flex-1 font-mono whitespace-pre-wrap overflow-x-auto">
            {repo.quick_start}
          </code>
          <button
            type="button"
            onClick={copyToClipboard}
            className="p-2.5 hover:bg-paper-2 text-muted hover:text-ink transition-colors duration-[var(--dur-micro)] border-l border-rule cursor-pointer shrink-0"
            title="คัดลอกคำสั่ง"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <a
            href={`${repo.url}/issues`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 min-h-[38px] px-3.5 py-2 bg-paper hover:bg-paper-3 text-ink text-sm font-editorial-label border border-rule-2 transition-colors duration-[var(--dur-micro)] whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Issues</span>
          </a>
          <a
            href={`https://hn.algolia.com/?q=${encodeURIComponent(repo.name)}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 min-h-[38px] px-3.5 py-2 bg-paper hover:bg-paper-3 text-accent text-sm font-editorial-label border border-accent transition-colors duration-[var(--dur-micro)] whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>HN Search</span>
          </a>
        </div>
      </div>
    </article>
  );
}
