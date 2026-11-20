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
    expect(screen.getByText(/มาแรงวันนี้/)).toBeDefined();

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
    const yesterdayBtn = screen.getByRole("button", { name: /เมื่อวาน/i });
    fireEvent.click(yesterdayBtn);
    expect(yesterdayBtn.className).toContain("bg-ink");

    // Click All 7 Days edition button
    const all7Btn = screen.getByRole("button", { name: /รวมย้อนหลัง/i });
    fireEvent.click(all7Btn);
    expect(all7Btn.className).toContain("bg-ink");

    // Click Category filter (e.g. AI Agents & Memory)
    const agentCatBtn = screen.getByRole("button", {
      name: /AI Agents & Memory/i,
    });
    fireEvent.click(agentCatBtn);
    expect(agentCatBtn.className).toContain("bg-accent");

    // Click 'ทั้งหมด' to reset category
    const allCatBtn = screen.getByRole("button", { name: /ทั้งหมด/i });
    fireEvent.click(allCatBtn);
    expect(allCatBtn.className).toContain("bg-accent");
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
    const all7Btn = screen.getByRole("button", { name: /รวมย้อนหลัง/i });
    fireEvent.click(all7Btn);

    // Check pagination exists
    const nextBtn = screen.getByRole("button", { name: /หน้าถัดไป/i });
    if (nextBtn) {
      fireEvent.click(nextBtn);
      // Verify page 2 is active
      const page2Btn = screen.getByRole("button", { name: "2" });
      expect(page2Btn.className).toContain("bg-ink");
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
    expect(fontLargeBtn.className).toContain("bg-ink");

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
    expect(screen.getByText(/เปเปอร์วิจัยที่คั่นไว้ \(1\)/i)).toBeDefined();

    // Click remove button
    const removeBtn = screen.getByRole("button", { name: /ลบออก/i });
    fireEvent.click(removeBtn);

    // Verify empty state
    expect(screen.getByText(/ยังไม่มีบทความที่คั่นหน้าไว้/i)).toBeDefined();
  });

  it("E2E Journey 8: Editorial Single-Mode & Accessible Filter State Controls", () => {
    render(<Home />);

    // Verify single-mode Editorial surface without night-mode toggle
    expect(
      screen.queryByTitle(/สลับโหมดสีกระดาษถนอมสายตา/i)
    ).toBeNull();

    // Verify interactive buttons expose aria-pressed state cleanly
    const todayBtn = screen.getByRole("button", { name: /วันนี้/i });
    expect(todayBtn.getAttribute("aria-pressed")).toBe("true");

    const withCodeBtn = screen.getByRole("button", { name: /มีโค้ด GitHub/i });
    expect(withCodeBtn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(withCodeBtn);
    expect(withCodeBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("E2E Journey 9: AI Lab News (Google Blog RSS) Column, Subcategories & Full Reader", () => {
    render(<Home />);

    // Switch to AI Lab News tab
    const nav = screen.getByRole("navigation", { name: "หมวดหมู่หลักของวารสาร" });
    const newsTab = within(nav).getByRole("button", { name: /ข่าว AI Lab/i });
    fireEvent.click(newsTab);

    // Verify AI Lab News column rendered
    expect(
      screen.getByRole("heading", { name: /คอลัมน์ข่าวสาร AI Lab/i })
    ).toBeDefined();
    expect(
      screen.getByText(/ข่าวประกาศทางการจาก Google Official Blog/i)
    ).toBeDefined();

    // Test subcategory filtering
    const geminiCatBtn = screen.getByRole("button", {
      name: /Gemini & Models/i,
    });
    fireEvent.click(geminiCatBtn);
    expect(geminiCatBtn.className).toContain("bg-accent");

    const allNewsBtn = screen.getByRole("button", { name: /ทั้งหมด/i });
    fireEvent.click(allNewsBtn);
    expect(allNewsBtn.className).toContain("bg-accent");

    // Test Compact Digest toggle in AI Lab News
    const compactBtn = screen.getByTitle(/มุมมองสารบัญด่วน/i);
    fireEvent.click(compactBtn);
    expect(screen.getByText(/สารบัญด่วนข่าว AI Lab/i)).toBeDefined();

    const cardsBtn = screen.getByTitle(/มุมมองการ์ดข่าว/i);
    fireEvent.click(cardsBtn);

    // Open lead news article in Full Reader mode
    const readNewsBtn = screen.getByText(/กดอ่านข่าวเจาะลึก/i);
    fireEvent.click(readNewsBtn);

    // Verify full reader TOC & sections
    expect(screen.getByText(/สารบัญบทความ \(TOC\)/i)).toBeDefined();
    expect(screen.getByText(/เปรียบเทียบก่อนอัปเดต vs หลังอัปเดต/i)).toBeDefined();
    expect(screen.getByText(/3 แนวทางการนำไปใช้ประโยชน์จริง/i)).toBeDefined();
    expect(screen.getByText(/เปิดอ่านประกาศต้นฉบับบน Google Blog/i)).toBeDefined();

    // Bookmark the news article from reader and verify in Saved section
    const articleEl = screen.getByRole("article");
    const saveBtn = within(articleEl).getByRole("button", { name: /คั่นหน้า/i });
    fireEvent.click(saveBtn);
    expect(within(articleEl).getByRole("button", { name: /คั่นแล้ว/i })).toBeDefined();

    const savedTab = within(nav).getByRole("button", { name: /คั่นหน้า/i });
    fireEvent.click(savedTab);
    expect(screen.getByText(/ข่าวสาร AI Lab ที่คั่นไว้ \(1\)/i)).toBeDefined();

    const removeBtn = screen.getByRole("button", { name: /ลบออก/i });
    fireEvent.click(removeBtn);
    expect(screen.getByText(/ยังไม่มีบทความที่คั่นหน้าไว้/i)).toBeDefined();
  });

  it("E2E Journey 10: Scroll-Aware Dynamic Capsule Navbar & Live Sync Verification Strip", () => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    render(<Home />);

    // Verify Live Sync Verification Strip displays sync status and new counts
    expect(screen.getByText(/ซิงก์ล่าสุด:/i)).toBeDefined();
    expect(screen.getByText(/เข้าใหม่วันนี้:/i)).toBeDefined();

    // Verify active nav item exposes aria-current="page" and starts expanded at scrollY=0
    const nav = screen.getByRole("navigation", { name: "หมวดหมู่หลักของวารสาร" });
    expect(nav.getAttribute("data-scrolled")).toBe("false");
    const papersBtn = within(nav).getByRole("button", { name: /เปเปอร์วิจัย AI/i });
    expect(papersBtn.getAttribute("aria-current")).toBe("page");
    expect(within(nav).getByRole("searchbox", { name: /ค้นหาบทความ/i })).toBeDefined();

    // Scroll down past threshold (scrollY > 40) -> capsule shrinks smoothly
    Object.defineProperty(window, "scrollY", { value: 180, writable: true, configurable: true });
    fireEvent.scroll(window);

    expect(nav.getAttribute("data-scrolled")).toBe("true");
    // Search collapses to compact icon button when scrolled
    const openSearchBtn = within(nav).getByRole("button", { name: /เปิดช่องค้นหา/i });
    fireEvent.click(openSearchBtn);
    expect(within(nav).getByRole("searchbox", { name: /ค้นหาบทความ/i })).toBeDefined();

    // Scroll back to top (scrollY = 0) -> capsule expands back to full width
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
    fireEvent.scroll(window);
    expect(nav.getAttribute("data-scrolled")).toBe("false");
  });

  it("E2E Journey 11: NEW Freshness Filter, Instant Floating Back Dock, Escape Key & Facebook Post Studio", () => {
    render(<Home />);

    // Verify NEW badges & Only-New filter exist
    const onlyNewBtn = screen.getByRole("button", { name: /เฉพาะรายการมาใหม่/i });
    expect(onlyNewBtn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(onlyNewBtn);
    expect(onlyNewBtn.getAttribute("aria-pressed")).toBe("true");

    // Open lead article
    const readLinks = screen.getAllByText(/กดอ่านบทความ/i);
    fireEvent.click(readLinks[0]);

    // Verify Facebook Share Studio sits quietly collapsed and expands on click
    const fbSummary = screen.getByText(/ฉบับร่างโพสต์ Facebook \(พร้อมแชร์ลงเพจ\)/i);
    expect(fbSummary).toBeDefined();
    fireEvent.click(fbSummary);
    expect(screen.getByRole("button", { name: /คัดลอกโพสต์ลง Facebook/i })).toBeDefined();

    // Verify Instant Floating Reader Dock sits in a toolbar with instant Back button
    const dock = screen.getByRole("toolbar", { name: /แถบเครื่องมืออ่านบทความด่วน/i });
    const instantBackBtn = within(dock).getByRole("button", { name: /ย้อนกลับทันที/i });
    fireEvent.click(instantBackBtn);

    // Returned immediately to feed
    expect(screen.getByText(/คอลัมน์งานวิจัย/i)).toBeDefined();

    // Re-open and test Escape key instant back
    const readLinksAgain = screen.getAllByText(/กดอ่านบทความ/i);
    fireEvent.click(readLinksAgain[0]);
    expect(screen.getByText(/สารบัญบทความ \(TOC\)/i)).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByText(/คอลัมน์งานวิจัย/i)).toBeDefined();
  });

  it("E2E Journey 12: Progressive 3-Pass Deep Reading (Triage, Glossary Scaffolding, Mechanism & Evidence, Hands-On)", async () => {
    const { ArticleReader } = await import("../src/components/ArticleReader");
    const papersModule = await import("../src/data/papers.json");
    const basePaper = papersModule.default.days[0].papers[0];

    const enrichedPaper = {
      ...basePaper,
      reading_guide: {
        pass1_triage: {
          core_idea: "ปรับจูนโมเดลพยากรณ์อากาศด้วยเมทริกซ์ Low-rank แบบตั้งฉาก",
          prerequisite_level: "พื้นฐาน PyTorch และเข้าใจไอเดีย LoRA เบื้องต้น",
          worth_deep_dive: "รู้คอนเซปต์ Pass 1-2 ก็เพียงพอหากไม่ได้ทำสาย Geo-AI",
          context_lineage: "ต่อยอดจาก LoRA (2021) และ DoRA",
        },
        glossary: [
          {
            term: "Downscaling",
            meaning: "การเพิ่มความละเอียดของข้อมูลพยากรณ์จากภาพรวมระดับทวีปให้ละเอียดถึงระดับจังหวัด",
            analogy: "เหมือนขยายภาพแผนที่เบลอๆ ให้คมชัดเห็นถนนแต่ละเส้น",
          },
        ],
        how_it_works: [
          {
            step: "แยก Rank Budget เป็น 2 แกน",
            detail: "แบ่งพารามิเตอร์ที่ปรับแต่งเป็นแกนหลัก (Principal) และแกนตั้งฉาก (Orthogonal)",
          },
        ],
        hard_evidence: [
          {
            metric: "VRAM Overhead",
            value: "-38% vs Full Fine-tune",
            context: "ทดสอบบนชุดข้อมูล ERA5",
          },
        ],
        pass3_hands_on: {
          prerequisites: ["Python 3.10+", "PyTorch 2.x"],
          try_it_steps: ["ลองอ่านไฟล์ adapter ใน GitHub เพื่อดูวิธีแยกแกน"],
          next_to_learn: ["Singular Value Decomposition (SVD)"],
        },
        source_depth: "arxiv_and_readme" as const,
      },
    };

    render(
      <ArticleReader
        paper={enrichedPaper as unknown as import("../src/types").PaperData}
        isSaved={false}
        onToggleSave={() => {}}
        onBack={() => {}}
      />
    );

    // Pass 1 Triage visible immediately
    expect(screen.getByText(/Pass 1 · คัดกรองก่อนลงลึก \(5 Cs\)/i)).toBeDefined();
    expect(screen.getByText(/สกัดจาก arXiv HTML \+ GitHub README/i)).toBeDefined();

    // Vocabulary Scaffolding drawer opens cleanly
    const glossarySummary = screen.getByText(/ปูศัพท์เทคนิคก่อนอ่าน \(1 คำ\)/i);
    fireEvent.click(glossarySummary);
    expect(screen.getByText(/เหมือนขยายภาพแผนที่เบลอๆ/i)).toBeDefined();

    // Pass 2 Mechanism & Hard Evidence visible immediately
    expect(screen.getByText(/Pass 2 · กลไกการทำงานจริง/i)).toBeDefined();
    expect(screen.getByText(/-38% vs Full Fine-tune/i)).toBeDefined();

    // Pass 3 Hands-On drawer opens cleanly (and replaces legacy 3 Use Cases)
    expect(screen.queryByText(/แนวทางการนำไปประยุกต์ใช้จริง \(3 ยูสเคส\)/i)).toBeNull();
    const pass3Summary = screen.getByText(/Pass 3 · ลองทำตามจริง & หัวข้อศึกษาต่อ/i);
    fireEvent.click(pass3Summary);
    expect(screen.getByText(/Singular Value Decomposition \(SVD\)/i)).toBeDefined();
  });
});


