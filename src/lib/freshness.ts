import type { SyncStatusData } from "../types";

export const READ_IDS_STORAGE_KEY = "reporadar_read_ids_v1";

const THAI_SHORT_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function toBangkokDateString(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value ?? "";
    const m = parts.find((p) => p.type === "month")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    return y && m && day ? `${y}-${m}-${day}` : "";
  } catch {
    return "";
  }
}

export function formatThaiSyncTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "วันนี้";
    const dateStr = d.toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${dateStr} เวลา ${timeStr} น.`;
  } catch {
    return "วันนี้";
  }
}

export function formatThaiShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  const monthIdx = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const monthLabel = THAI_SHORT_MONTHS[monthIdx];
  if (!monthLabel || Number.isNaN(day)) return dateStr;
  return `${day} ${monthLabel}`;
}

export interface FreshnessInfo {
  /** Newly added in the latest daily sync batch */
  isNew: boolean;
  /** Newly added AND user hasn't opened it yet */
  isUnreadNew: boolean;
  /** Published earlier than sync date, e.g. yesterday's paper pulled into today's sync */
  isDelayedArrival: boolean;
  /** Human-readable date provenance label */
  provenanceLabel: string | null;
  /** Whether the user already opened this item */
  isRead: boolean;
}

export function getFreshnessInfo(
  item: {
    id: string;
    published_date?: string;
    first_seen_at?: string;
  },
  kind: "papers" | "repos" | "news",
  syncStatus: SyncStatusData,
  readIds: ReadonlySet<string>
): FreshnessInfo {
  const newIdSet = syncStatus.new_ids[kind] || [];
  const inNewIds = newIdSet.includes(item.id);
  const firstSeenDateIct = item.first_seen_at
    ? toBangkokDateString(item.first_seen_at)
    : "";
  const isNew =
    inNewIds ||
    (Boolean(firstSeenDateIct) &&
      firstSeenDateIct === syncStatus.last_sync_date_ict);

  const readKey = `${kind}:${item.id}`;
  const isRead = readIds.has(readKey);
  const isUnreadNew = isNew && !isRead;

  const publishedDateClean = item.published_date?.slice(0, 10) || "";
  const isDelayedArrival =
    isNew &&
    Boolean(publishedDateClean) &&
    publishedDateClean !== syncStatus.last_sync_date_ict;

  let provenanceLabel: string | null = null;
  if (isDelayedArrival) {
    provenanceLabel = `เพิ่งดึงเข้าวันนี้ · เผยแพร่ ${formatThaiShortDate(publishedDateClean)}`;
  } else if (isNew) {
    provenanceLabel = "เข้าใหม่รอบซิงก์วันนี้";
  }

  return {
    isNew,
    isUnreadNew,
    isDelayedArrival,
    provenanceLabel,
    isRead,
  };
}
