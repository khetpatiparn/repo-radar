import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Home from "../src/app/page";

describe("End-to-End User Journeys (E2E Integration & Usability)", () => {
  it("E2E Journey 1: Masthead & Section Navigation", () => {
    render(<Home />);

    // Check newspaper masthead
    expect(screen.getAllByText("THE REPO RADAR").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(/วารสารสรุปงานวิจัย AI มาแรงจาก Hugging Face/)
    ).toBeDefined();

    // Check default active section is Papers
    expect(screen.getByText(/คอลัมน์งานวิจัย/)).toBeDefined();

    // Click GitHub Repos column
    const reposTab = screen.getByRole("button", { name: /GitHub Repos/i });
    fireEvent.click(reposTab);

    // Verify view switched to repos
    expect(screen.getByText(/🔥 มาแรงวันนี้/)).toBeDefined();

    // Switch to Saved tab
    const nav = screen.getByRole("navigation", { name: "หมวดหมู่หลักของวารสาร" });
    const savedTab = within(nav).getByRole("button", { name: /คั่นหน้า/i });
    fireEvent.click(savedTab);
    expect(
      screen.getByText(/คลังบทความและโปรเจกต์ที่คุณคั่นหน้าไว้/)
    ).toBeDefined();

    // Switch back to Papers
    const papersTab = screen.getByRole("button", { name: /เปเปอร์วิจัย AI/i });
    fireEvent.click(papersTab);
    expect(screen.getByText(/คอลัมน์งานวิจัย/)).toBeDefined();
  });

  it("E2E Journey 2: Edition & Category Filtering", () => {
    render(<Home />);

    // Click Yesterday edition button
    const yesterdayBtn = screen.getByRole("button", { name: /📅 เมื่อวาน/i });
    fireEvent.click(yesterdayBtn);
    expect(yesterdayBtn.className).toContain("bg-[var(--paper-ink)]");

    // Click All 7 Days edition button
    const all7Btn = screen.getByRole("button", { name: /🗓️ รวมย้อนหลัง/i });
    fireEvent.click(all7Btn);
    expect(all7Btn.className).toContain("bg-[var(--paper-ink)]");

    // Click Category filter (e.g. AI Agents & Memory)
    const agentCatBtn = screen.getByRole("button", {
      name: /AI Agents & Memory/i,
    });
    fireEvent.click(agentCatBtn);
    expect(agentCatBtn.className).toContain("bg-[var(--paper-accent)]");

    // Click 'ทั้งหมด' to reset category
    const allCatBtn = screen.getByRole("button", { name: /ทั้งหมด/i });
    fireEvent.click(allCatBtn);
    expect(allCatBtn.className).toContain("bg-[var(--paper-accent)]");
  });

  it("E2E Journey 3: Real-Time Keyword Search", () => {
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(/ค้นหาบทความ, หัวข้อ, ภาษา/i);
    expect(searchInput).toBeDefined();

    // Type a keyword that matches
    fireEvent.change(searchInput, { target: { value: "Memory" } });

    // Verify search filtered the list
    const items = screen.getAllByText(/Memory/i);
    expect(items.length).toBeGreaterThan(0);

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
  });

  it("E2E Journey 4: Anti-Scroll Fatigue - Cards vs Compact Digest View Toggle", () => {
    render(<Home />);

    // Find view toggle buttons
    const compactBtn = screen.getByTitle(/มุมมองสารบัญด่วน/i);
    fireEvent.click(compactBtn);

    // Verify Compact Digest header appeared
    expect(screen.getByText(/สารบัญด่วน \(สแกนเร็วในหน้าเดียว/i)).toBeDefined();

    // Toggle back to Cards view
    const cardsBtn = screen.getByTitle(/มุมมองการ์ดข่าว/i);
    fireEvent.click(cardsBtn);
    expect(screen.getByText(/คอลัมน์งานวิจัย/i)).toBeDefined();
  });

  it("E2E Journey 5: Anti-Scroll Fatigue - Bounded Pagination", () => {
    render(<Home />);

    // Select All 7 Days so we have multiple pages
    const all7Btn = screen.getByRole("button", { name: /🗓️ รวมย้อนหลัง/i });
    fireEvent.click(all7Btn);

    // Check pagination exists
    const nextBtn = screen.getByRole("button", { name: /หน้าถัดไป/i });
    if (nextBtn) {
      fireEvent.click(nextBtn);
      // Verify page 2 is active
      const page2Btn = screen.getByRole("button", { name: "2" });
      expect(page2Btn.className).toContain("bg-[var(--paper-ink)]");
    }
  });

  it("E2E Journey 6: Full-Page Article Reader Mode with Table of Contents", () => {
    render(<Home />);

    // Click lead article headline
    const readLinks = screen.getAllByText(/กดอ่านบทความ/i);
    expect(readLinks.length).toBeGreaterThan(0);
    fireEvent.click(readLinks[0]);

    // Verify reader mode opened with Table of Contents
    expect(screen.getByText(/สารบัญบทความ \(TOC\)/i)).toBeDefined();
    expect(screen.getByText(/01 \/\//i)).toBeDefined();
    expect(screen.getByText(/สรุปใจความสำคัญใน 30 วินาที/i)).toBeDefined();
    expect(screen.getByText(/07 \/\//i)).toBeDefined();
    expect(screen.getByText(/เอกสารต้นทางและซอร์สโค้ด/i)).toBeDefined();

    // Test font size switcher
    const fontLargeBtn = screen.getByRole("button", { name: "ก+" });
    fireEvent.click(fontLargeBtn);
    expect(fontLargeBtn.className).toContain("bg-[var(--paper-ink)]");

    const fontXLargeBtn = screen.getByRole("button", { name: "ก++" });
    if (fontXLargeBtn) fireEvent.click(fontXLargeBtn);

    // Test Back button
    const backBtn = screen.getByRole("button", {
      name: /กลับไปหน้าหนังสือพิมพ์/i,
    });
    fireEvent.click(backBtn);

    // Verify back on newspaper front page
    expect(screen.getAllByText("THE REPO RADAR").length).toBeGreaterThanOrEqual(1);
  });

  it("E2E Journey 7: Bookmarks & Permanent Saved Reading List", () => {
    render(<Home />);

    // Click first bookmark button on front page
    const bookmarkBtns = screen.getAllByTitle(/คั่นหน้าบทความนี้/i);
    expect(bookmarkBtns.length).toBeGreaterThan(0);
    fireEvent.click(bookmarkBtns[0]);

    // Go to Saved Section
    const nav = screen.getByRole("navigation", { name: "หมวดหมู่หลักของวารสาร" });
    const savedNavBtn = within(nav).getByRole("button", { name: /คั่นหน้า/i });
    fireEvent.click(savedNavBtn);

    // Verify bookmarked item is listed
    expect(screen.getByText(/📄 เปเปอร์วิจัยที่คั่นไว้ \(1\)/i)).toBeDefined();

    // Click remove button
    const removeBtn = screen.getByRole("button", { name: /ลบออก/i });
    fireEvent.click(removeBtn);

    // Verify empty state
    expect(screen.getByText(/ยังไม่มีบทความที่คั่นหน้าไว้/i)).toBeDefined();
  });

  it("E2E Journey 8: Eye-Comfort Paper vs Night Mode Theme Toggle", () => {
    render(<Home />);

    const themeToggleBtn = screen.getByTitle(/สลับโหมดสีกระดาษถนอมสายตา/i);
    expect(themeToggleBtn).toBeDefined();

    // Toggle to Night mode
    fireEvent.click(themeToggleBtn);
    expect(screen.getByText(/กระดาษถนอมสายตา/i)).toBeDefined();

    // Toggle back to Paper mode
    fireEvent.click(themeToggleBtn);
    expect(screen.getByText(/โหมดอ่านกลางคืน/i)).toBeDefined();
  });
});
