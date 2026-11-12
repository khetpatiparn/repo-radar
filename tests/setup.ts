import "@testing-library/dom";
import { vi, beforeEach } from "vitest";

// Polyfill window.scrollTo
if (typeof window !== "undefined") {
  window.scrollTo = vi.fn();
}

// Polyfill Notification API
if (typeof window !== "undefined" && !("Notification" in window)) {
  (window as any).Notification = class MockNotification {
    static permission: NotificationPermission = "default";
    static requestPermission = vi.fn().mockResolvedValue("granted");
    constructor(public title: string, public options?: any) {}
  };
}

// Polyfill navigator.clipboard
if (typeof navigator !== "undefined" && !navigator.clipboard) {
  (navigator as any).clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };
}

// Clear localStorage before each test
beforeEach(() => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});
