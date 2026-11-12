import { useState, useEffect } from "react";
import { Search, Bell, BellRing, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  updatedAt: string;
  totalRepos: number;
  avgHype: number;
  onSearch: (query: string) => void;
  topRepoName?: string;
}

export function Header({ updatedAt, totalRepos, avgHype, onSearch, topRepoName }: HeaderProps) {
  const [relativeTime, setRelativeTime] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (updatedAt) {
      setRelativeTime(formatDistanceToNow(new Date(updatedAt), { addSuffix: true }));
    }
  }, [updatedAt]);

  // Check notification permission and listen for fresh updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }

    setNotifPermission(Notification.permission);

    // If permission is already granted and a new sync arrived since last notification
    if (Notification.permission === "granted" && updatedAt) {
      const lastNotified = localStorage.getItem("reporadar_last_notified");
      if (lastNotified && lastNotified !== updatedAt) {
        sendNotification(
          "RepoRadar // ตรวจพบเทรนด์ใหม่ล่าสุด!",
          `ตรวจพบ ${totalRepos} Repositories มาแรงวันนี้! อันดับ 1: ${topRepoName || "โปรเจกต์ใหม่"}`
        );
        localStorage.setItem("reporadar_last_notified", updatedAt);
      }
    }
  }, [updatedAt, totalRepos, topRepoName]);

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
      notif.onclick = () => {
        window.focus();
      };
    } catch (e) {
      console.warn("Could not fire notification:", e);
    }
  };

  const handleNotificationClick = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showToast("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนบน Windows");
      return;
    }

    if (Notification.permission === "denied") {
      showToast("การแจ้งเตือนถูกปิดอยู่ กรุณากดที่รูปแม่กุญแจหน้า URL เพื่อเปิดรับการแจ้งเตือน");
      return;
    }

    if (Notification.permission === "default") {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === "granted") {
          localStorage.setItem("reporadar_last_notified", updatedAt);
          sendNotification(
            "RepoRadar // เปิดแจ้งเตือนบน Windows สำเร็จ!",
            `ตรวจพบ ${totalRepos} Repositories มาแรงวันนี้! เช่น ${topRepoName || "meta/astryx"}`
          );
          showToast("เปิดการแจ้งเตือนบน Windows สำเร็จ! (ดูที่มุมขวาล่างของจอ)");
        } else {
          showToast("คุณได้ปฏิเสธการแจ้งเตือน");
        }
      } catch (e) {
        console.error("Error requesting permission:", e);
      }
      return;
    }

    // If already granted, fire a test Windows Toast notification
    sendNotification(
      "RepoRadar // ทดสอบแจ้งเตือนบน Windows",
      `ตรวจพบ ${totalRepos} Repositories กำลังมาแรง! อันดับ 1: ${topRepoName || "meta/astryx"}`
    );
    showToast("ส่งการแจ้งเตือนไปยัง Windows เรียบร้อยแล้ว! (มุมขวาล่าง)");
  };

  return (
    <header className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 text-zinc-100 py-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="RepoRadar Logo" className="w-9 h-9 rounded-lg shadow-md shrink-0" />
        <div>
          <h1 className="text-xl font-bold tracking-tight">RepoRadar <span className="text-zinc-500 font-normal">// GitHub Trending Intelligence</span></h1>
          <p className="text-xs text-zinc-400">อัปเดตล่าสุดเมื่อ {relativeTime}</p>
        </div>
      </div>

      <div className="relative w-full md:w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-md leading-5 bg-zinc-800 text-zinc-300 placeholder-zinc-400 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
          placeholder="ค้นหา repo, ภาษา, หรือปัญหา..."
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 text-sm">
        {/* Windows Notifications Button */}
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 ${
              notifPermission === "granted"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700"
            }`}
            title={
              notifPermission === "granted"
                ? "การแจ้งเตือนเปิดอยู่ (คลิกเพื่อทดสอบแจ้งเตือนบน Windows)"
                : "คลิกเพื่อเปิดรับการแจ้งเตือนเทรนด์ใหม่บน Windows"
            }
          >
            {notifPermission === "granted" ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>แจ้งเตือน Windows: เปิด</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>เปิดแจ้งเตือน Windows</span>
              </>
            )}
          </button>

          {/* Feedback Toast */}
          {toastMsg && (
            <div className="absolute right-0 top-full mt-2 z-50 whitespace-nowrap bg-zinc-950 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}
        </div>

        <div className="h-8 border-l border-zinc-700"></div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Repos</span>
            <span className="font-semibold text-emerald-400">{totalRepos}</span>
          </div>
          <div className="h-6 border-l border-zinc-800"></div>
          <div className="flex flex-col items-center">
            <span className="text-zinc-400 text-xs">Avg Hype</span>
            <span className="font-semibold text-emerald-400">{avgHype.toFixed(1)}/10</span>
          </div>
        </div>
      </div>
    </header>
  );
}
