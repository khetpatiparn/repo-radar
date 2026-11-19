"use client";

import type React from "react";
import { useState } from "react";
import { Sparkles, Check, CalendarClock } from "lucide-react";
import type { FreshnessInfo } from "../lib/freshness";

export function FreshnessBadge({
  info,
  compact = false,
}: {
  info?: FreshnessInfo;
  compact?: boolean;
}) {
  if (!info) return null;

  if (info.isUnreadNew) {
    return (
      <div className="inline-flex flex-wrap items-center gap-1.5">
        <span className="badge-new-ember inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-editorial-label tracking-wide whitespace-nowrap">
          <span
            className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
            aria-hidden="true"
          />
          <span>ใหม่วันนี้</span>
        </span>
        {!compact && info.isDelayedArrival && info.provenanceLabel && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper-3 border border-accent/35 text-[11px] font-editorial-label text-accent-2 whitespace-nowrap"
            title="บทความนี้เผยแพร่ก่อนวันนี้ แต่เพิ่งถูกดึงเข้าระบบในการซิงก์รอบล่าสุด"
          >
            <CalendarClock className="w-3 h-3 shrink-0" />
            <span>{info.provenanceLabel}</span>
          </span>
        )}
      </div>
    );
  }

  if (info.isNew && info.isRead) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft border border-accent/30 text-[11px] font-editorial-label text-accent-2 whitespace-nowrap">
        <Check className="w-3 h-3 shrink-0" />
        <span>เข้าใหม่วันนี้ · อ่านแล้ว</span>
      </span>
    );
  }

  if (info.isRead) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper-3 border border-rule text-[11px] font-editorial-label text-muted whitespace-nowrap">
        <Check className="w-3 h-3 shrink-0" />
        <span>อ่านแล้ว</span>
      </span>
    );
  }

  return null;
}

export function BlogCoverMedia({
  src,
  alt,
  category,
  sublabel,
  fit = "cover",
  aspect = "16/10",
  edgeToEdge = false,
  isNew = false,
  priority = false,
  topRightAction,
}: {
  src?: string | null;
  alt: string;
  category: string;
  sublabel?: string;
  fit?: "cover" | "contain";
  aspect?: "16/9" | "16/10" | "4/3";
  edgeToEdge?: boolean;
  isNew?: boolean;
  priority?: boolean;
  topRightAction?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const safeSrc = src ?? undefined;
  const hasImage = Boolean(safeSrc) && !failed;

  const aspectClass =
    aspect === "16/9"
      ? "aspect-[16/9]"
      : aspect === "4/3"
      ? "aspect-[4/3]"
      : "aspect-[16/10]";

  const frameClass = edgeToEdge
    ? `relative w-full ${aspectClass} overflow-hidden border-b border-rule bg-paper`
    : `relative w-full ${aspectClass} rounded-[var(--radius-inner)] overflow-hidden border border-rule bg-paper`;

  return (
    <div className={frameClass}>
      {hasImage ? (
        fit === "contain" ? (
          <div className="w-full h-full bg-[#f5f5f7] p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onError={() => setFailed(true)}
              className="w-full h-full object-contain rounded-[6px] transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onError={() => setFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
            />
          </>
        )
      ) : (
        <div
          className="w-full h-full p-4 flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, rgba(234,88,12,0.3) 0%, transparent 55%), linear-gradient(145deg, #1b1614 0%, #121216 58%, #09090b 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/55 border border-white/15 text-[10px] font-editorial-label text-accent-2 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>THE REPO RADAR</span>
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-editorial-label text-accent-2 truncate">
              {category}
            </div>
            {sublabel && (
              <div className="text-[11px] font-mono text-muted truncate">
                {sublabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtle corner NEW overlay */}
      {isNew && (
        <span
          aria-hidden="true"
          className="absolute top-3 left-3 z-10 badge-new-ember inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-editorial-label tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span>NEW</span>
        </span>
      )}

      {/* Optional top-right action (e.g. Bookmark button) */}
      {topRightAction && (
        <div className="absolute top-2.5 right-2.5 z-10">{topRightAction}</div>
      )}
    </div>
  );
}
