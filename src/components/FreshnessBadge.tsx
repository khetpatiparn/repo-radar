"use client";

import type React from "react";
import { useState } from "react";
import { Check, CalendarClock } from "lucide-react";
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
      <div className="inline-flex flex-wrap items-center gap-2">
        <span className="badge-new-ember inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-editorial-label font-semibold uppercase tracking-wider whitespace-nowrap leading-none">
          ใหม่วันนี้
        </span>
        {!compact && info.isDelayedArrival && info.provenanceLabel && (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-editorial-label text-muted whitespace-nowrap"
            title="บทความนี้เผยแพร่ก่อนวันนี้ แต่เพิ่งถูกดึงเข้าระบบในการซิงก์รอบล่าสุด"
          >
            <CalendarClock className="w-3 h-3 text-accent-2 shrink-0" />
            <span>{info.provenanceLabel}</span>
          </span>
        )}
      </div>
    );
  }

  if (info.isNew && info.isRead) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-editorial-label text-muted whitespace-nowrap">
        <Check className="w-3 h-3 text-accent-2 shrink-0" />
        <span>เข้าใหม่วันนี้ · อ่านแล้ว</span>
      </span>
    );
  }

  if (info.isRead) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-editorial-label text-muted whitespace-nowrap">
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

  const frameClass = `relative w-full ${aspectClass} rounded-[8px] overflow-hidden bg-paper-2`;

  return (
    <div className={frameClass}>
      {hasImage ? (
        fit === "contain" ? (
          <div className="w-full h-full bg-[#f4f4f6] p-3 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={safeSrc}
              alt={alt}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onError={() => setFailed(true)}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
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
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"
            />
          </>
        )
      ) : (
        <div
          className="w-full h-full p-5 flex flex-col justify-between relative overflow-hidden"
          style={{
            background:
              "linear-gradient(155deg, #16161b 0%, #101014 60%, #0b0b0e 100%)",
          }}
        >
          <span className="text-[10px] font-mono text-muted uppercase tracking-[0.16em]">
            THE REPO RADAR
          </span>
          <div className="space-y-1">
            <div className="text-sm font-editorial-display text-ink truncate">
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

      {/* Subtle flat corner NEW micro-tag */}
      {isNew && (
        <span
          aria-hidden="true"
          className="absolute top-2.5 left-2.5 z-10 badge-new-ember inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono font-semibold tracking-wider uppercase leading-none"
        >
          NEW
        </span>
      )}

      {/* Optional top-right action (e.g. Bookmark button) */}
      {topRightAction && (
        <div className="absolute top-2.5 right-2.5 z-10">{topRightAction}</div>
      )}
    </div>
  );
}
