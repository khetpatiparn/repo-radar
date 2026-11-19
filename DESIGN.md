# THE REPO RADAR — Design System (`Ember Noir` Editorial CI)

> **Design System Foundation:** Generated with `ui-ux-pro-max` Design Intelligence (`Editorial Grid / Magazine` + `News Editorial` hierarchy) and `modern-web-guidance` standards, customized to the **Ember Noir** Corporate Identity (CI Brand): **Deep Orange Gradient × Obsidian Black × Crisp White × Dark Charcoal Gray**.

---

## 1. Brand Essence & Visual Philosophy

**THE REPO RADAR** is a daily Thai-language AI research, open-source, and Google AI Lab news publication built for developers, founders, and content creators who want high-signal briefings ready to read and share.

### Core Principles
1. **Editorial News-Blog First:** Every view should read like a flagship modern tech publication — bold headlines, crisp 16:10 visual covers, scannable bylines, clear visual hierarchy, and generous breathing room.
2. **Ember Noir CI Discipline:** Deep obsidian black (`#09090B`) and layered dark charcoal surfaces (`#121216` / `#18181D` / `#222229`) frame high-contrast white typography (`#FFFFFF`), punctuated intentionally by **Deep Orange (`#EA580C`) → Burnt Ember (`#C2410C`)** brand gradients for primary actions, live sync signals, and newly arrived badges.
3. **Zero-Friction Navigation:**
   - A **Floating Collapsible Capsule Navbar** stays lightweight (`< 10%` viewport height) and collapses to a micro-pill on demand so the news feed owns the screen.
   - **Instant Floating Back Navigation** inside the Article Reader keeps `← ย้อนกลับ` reachable from any scroll depth — no scrolling back to the top.
4. **Honest Freshness Signals:** Readers can tell at a glance when the last daily sync ran, how many items are brand new today, and whether an item was newly fetched today even if its original publication date was yesterday.

---

## 2. CI Brand Color System

### 2.1 Brand Primary & Deep Orange Gradients
| Token | Hex / Value | Role | Contrast Notes |
|---|---|---|---|
| `--color-accent` | `#EA580C` | Primary Deep Orange CI Accent (CTAs, active filter pills, NEW badges) | White `#FFFFFF` text on `#EA580C` (large/bold & UI controls) |
| `--color-accent-hi` | `#F97316` | Hover state & bright orange highlight / icons on dark | 7.2:1 on `#09090B` (AAA) |
| `--color-accent-text` | `#FB923C` | Inline orange links, section numbers, text highlights on dark | 9.1:1 on `#09090B` (AAA) |
| `--color-accent-deep` | `#C2410C` | Deep burnt orange for gradient depth & pressed states | 5.1:1 with `#FFFFFF` (AA) |
| `--color-accent-ink` | `#FFFFFF` | Crisp white foreground on solid/gradient Deep Orange fills | High legibility |
| `--grad-brand` | `linear-gradient(135deg, #F97316 0%, #EA580C 45%, #9A3412 100%)` | Primary CI Brand Gradient (logo seal, NEW badges, primary CTA pills, progress bar) | Signature CI strip |
| `--grad-ember-card` | `linear-gradient(145deg, rgba(234, 88, 12, 0.16) 0%, rgba(24, 24, 29, 0.94) 48%, #09090B 100%)` | Hero editorial feature stage & highlight banners | Keeps text ≥ 12:1 |
| `--grad-ember-border` | `linear-gradient(135deg, rgba(249, 115, 22, 0.55), rgba(63, 63, 70, 0.4))` | Active capsule rim & featured card accent border | Subtle metallic warmth |

### 2.2 Obsidian Black, Charcoal Gray & Pure White Neutrals
| Token | Hex | Role |
|---|---|---|
| `--color-paper` | `#09090B` | Main canvas background (Obsidian Black) |
| `--color-paper-2` | `#131317` | Primary card & toolbar surface (Deep Charcoal) |
| `--color-paper-3` | `#1C1C22` | Elevated surface, inputs, secondary pills, hover states |
| `--color-paper-4` | `#26262E` | Active subtle chips & pressed neutral surfaces |
| `--color-rule` | `#27272F` | Subtle 1px structural hairline dividers & card borders |
| `--color-rule-2` | `#3B3B46` | Interactive control borders & focusable pill outlines |
| `--color-ink` | `#FFFFFF` | Display headlines, active white-on-black pill fills, high-emphasis values |
| `--color-ink-2` | `#E4E4E7` | Primary Thai & English body copy (15.4:1 on `#09090B`) |
| `--color-muted` | `#A1A1AA` | Metadata, timestamps, secondary labels (7.3:1 on `#09090B`) |
| `--color-well` | `#F4F4F5` | Crisp light plate for white-background arXiv/research figures |
| `--color-card` | `#FFFFFF` | Pure white inner frame for paper diagrams |

### 2.3 Semantic Status Tokens
| Token | Hex | Soft Surface | Meaning |
|---|---|---|---|
| `--color-success` | `#34D399` | `#0D2820` | Synced / Verified / Production-Ready / Pros |
| `--color-warn` | `#FBBF24` | `#2B210B` | Watchouts / Experimental / Streak highlights |
| `--color-error` | `#F87171` | `#2C1215` | Errors / PoC / Failed clipboard fallback |

---

## 3. Typography System

Optimized for mixed **English technical headings** and **Thai long-form journalism** (`Noto Sans Thai` + `Wix Madefor Display` / `Wix Madefor Text` + monospace code).

| Role | Token / Utility | Size | Line Height | Weight | Tracking |
|---|---|---|---|---|---|
| Masthead Wordmark | `.font-editorial-display` | `clamp(1.65rem, 3vw, 2.75rem)` | `1.04` | `600` | `-0.028em` |
| Hero Feature Headline | `.font-editorial-display` | `clamp(1.75rem, 3.2vw, 2.75rem)` | `1.15` | `600` | `-0.022em` |
| Section Heading (`h2`) | `.font-editorial-display` | `1.375rem–1.75rem` | `1.2` | `600` | `-0.02em` |
| Blog Card Headline (`h3`/`h4`) | `.font-editorial-display` | `1.125rem` (`18px`) | `1.35` | `600` | `-0.015em` |
| Long-Form Article Body | `.font-editorial-body` | `17px / 18.5px / 20px` (scalable) | `1.85` | `400` | `0` |
| Card Excerpt | `.font-editorial-body` | `0.875rem` (`14px`) | `1.65` | `400` | `0` |
| Meta / Badges / Pills | `.font-editorial-label` | `0.75rem–0.875rem` (`12–14px`) | `1.3` | `500` | `0.01em` |
| Numeric Telemetry | `.num` | `font-variant-numeric: tabular-nums` | `1` | `600` | `-0.01em` |

**Reading Measure Rule:** Long-form Thai paragraphs are capped at `66ch–70ch` inside the Article Reader for effortless eye tracking without horizontal fatigue.

---

## 4. Layout Grid, Spacing & Surfaces

- **Max Container Width:** `1360px` (`--container: 1360px`) with responsive gutters (`16px` mobile → `24px` tablet → `48px` desktop).
- **8px Spacing Rhythm:** Cards use `p-5` (`20px`) or `p-6` (`24px`), grids use consistent `gap-6` (`24px`), sections separate with `space-y-8` (`32px`).
- **Radius Tokens:**
  - `--radius-card: 18px` (Blog cards, feature stage, filter surfaces)
  - `--radius-inner: 12px` (Cover media frames, code blocks, callouts)
  - `--radius-pill: 9999px` (Capsule navbar, filter chips, action pills, NEW badges)
- **Glassmorphism (Single-Layer Discipline):**
  - Applied exclusively to floating navigation surfaces (`.capsule-nav`, `.reader-dock`) using dark translucent obsidian (`rgba(15, 15, 19, 0.86)`) + `backdrop-filter: blur(20px) saturate(1.4)` + crisp 1px rim border. Never nested glass-on-glass.

---

## 5. Core Component Patterns

### 5.1 Scroll-Aware Dynamic Floating Capsule Navbar
- **Placement:** `sticky top-3 z-[var(--z-sticky-nav)]`, horizontally centered floating pill at the very top of the viewport.
- **Top-of-Page Expanded State (`scrollY <= 40`, `data-scrolled="false"`):**
  - Wide floating capsule (`max-w-[1260px]`) with `RR` Deep Orange emblem + `THE REPO RADAR` wordmark
  - 4 section pills (`เปเปอร์วิจัย AI`, `GitHub Repos`, `ข่าว AI Lab`, `คั่นหน้า`) with `aria-current="page"` on active tab and compact Deep Orange `+N` new-item badge
  - Full inline search pill + morning notification bell
- **Scrolled Compact State (`scrollY > 40`, `data-scrolled="true"`):**
  - Smoothly shrinks horizontally and vertically (`max-w-[880px]`, `280ms cubic-bezier(0.16, 1, 0.3, 1)`): tucks the wordmark into the `RR` monogram, compacts tab height (`36px → 32px`), increases glass frost depth, and collapses search into a quick-expand icon button (`เปิดช่องค้นหา`) that re-expands on click.
  - Automatically expands back to full width when scrolling back near the top (`scrollY <= 40`).

### 5.2 Asymmetric Magazine Front Page & Editorial News Blog Card Anatomy
Every card uses `<article>` with 4 clean, aligned regions:
1. **16:10 Media Cover Zone** (for Papers & Google News; structured velocity header for GitHub Repos):
   - Image with subtle hover zoom (`scale-[1.03]`, `250ms` ease-out, disabled under `prefers-reduced-motion`)
   - Top-left overlay: Category chip + **`● ใหม่วันนี้`** Deep Orange gradient pill (when newly synced & unread)
   - Top-right overlay: Accessible Bookmark toggle button (`min 36×36px`)
   - Fallback editorial cover with Deep Orange diagonal accent & category typography when thumbnail is absent or errors out
2. **Editorial Byline Strip:** Source / Organization, `published_date`, and explicit **"เพิ่งดึงเข้าวันนี้"** tag whenever `fetched_date !== published_date`
3. **Headline & Excerpt:** Bold crisp white headline (transitions to `#FB923C` on hover) + original title subtitle + 2–3 line Thai excerpt
4. **Card Footer:** Reading time, Code / Streak / Upvote signal, and `อ่านบทความ →` affordance

### 5.3 Instant Floating Reader Dock (ArticleReader)
Solves scroll-back friction completely:
- **Sticky Bottom-Center Floating Capsule** (always visible during reading, clears safe-area inset):
  - **Primary Left Action:** `← ย้อนกลับ` (Deep Orange gradient pill, `min-h-[44px]`, returns immediately & restores feed scroll position)
  - **Live Reading Progress Bar** along top edge of dock + % indicator
  - **Quick Controls:** Font scale (`ก / ก+ / ก++`), **คัดลอกโพสต์ FB** (one-click Facebook post copy), Bookmark toggle, and Back-to-top micro-button
- **Keyboard & Browser History Support:** Pressing `Escape` or browser Back (`popstate`) closes the reader cleanly and returns to the exact feed scroll position.

### 5.4 Freshness & Sync Verification System
- **Live Sync Status Banner** in the top masthead:
  - Displays exact Thai timestamp of the last pipeline run (`ซิงก์ล่าสุด: ... น.`)
  - Displays exact new item counts (`ใหม่วันนี้: +X เปเปอร์ · +Y Repos · +Z ข่าว Google`)
  - Shows Telegram push delivery status (`ส่งแจ้งเตือน Telegram แล้ว` or setup hint)
- **Filter Pill:** `เฉพาะของใหม่วันนี้` lets readers isolate strictly newly discovered items with one click.

---

## 6. Accessibility & Pre-Delivery Verification Checklist (`ui-ux-pro-max`)

- [x] **Contrast ≥ 4.5:1:** Pure White `#FFFFFF` (19.6:1) & `#E4E4E7` (15.4:1) on `#09090B`; `#A1A1AA` (7.3:1) on `#131317`; `#FB923C` (9.1:1) on `#09090B`.
- [x] **SVG Icons Only:** Exclusively `lucide-react` vector icons; decorative icons carry `aria-hidden="true"`.
- [x] **Touch Targets:** Interactive pills & floating dock actions maintain `≥ 36px–44px` hit areas with `≥ 8px` spacing.
- [x] **Keyboard & Screen Readers:** Visible `#F97316` `:focus-visible` outline (`2px`, `2px` offset), `aria-current="page"` on active nav, `aria-pressed` on filter pills, `aria-expanded` on collapsible capsule navbar, `role="status"` live region outside copy buttons.
- [x] **Motion Hygiene:** Respects `prefers-reduced-motion: reduce`; smooth `150–250ms` transitions without layout-shifting hover transforms.
- [x] **Responsive Coverage:** Verified across `375px` (mobile), `768px` (tablet), `1024px`, and `1440px` desktop widths with zero horizontal overflow.
