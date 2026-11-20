import { z } from "zod";

export const GlossaryTermSchema = z.object({
  term: z.string(),
  meaning: z.string(),
  analogy: z.string(),
});

export const EvidenceItemSchema = z.object({
  metric: z.string(),
  value: z.string(),
  context: z.string(),
});

export const HowItWorksStepSchema = z.object({
  step: z.string(),
  detail: z.string(),
});

export const DeepReadingGuideSchema = z.object({
  pass1_triage: z.object({
    core_idea: z.string(),
    prerequisite_level: z.string(),
    worth_deep_dive: z.string(),
    context_lineage: z.string(),
  }),
  glossary: z.array(GlossaryTermSchema),
  how_it_works: z.array(HowItWorksStepSchema),
  hard_evidence: z.array(EvidenceItemSchema),
  pass3_hands_on: z.object({
    prerequisites: z.array(z.string()),
    try_it_steps: z.array(z.string()),
    next_to_learn: z.array(z.string()),
  }),
  source_depth: z
    .enum([
      "full_article",
      "arxiv_html",
      "arxiv_and_readme",
      "readme_and_issues",
      "abstract_only",
    ])
    .optional(),
});

export type DeepReadingGuide = z.infer<typeof DeepReadingGuideSchema>;

export const RepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string(),
  url: z.string(),
  stars: z.number(),
  stars_today: z.number(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
  license: z.string().nullable(),
  open_issues: z.number(),
  
  // AI Strategic Vision
  one_liner: z.string(),
  problem_solved: z.string(),
  alternative_comparison: z.string(),
  maturity_rating: z.enum(["Production-Ready", "Experimental", "PoC"]),
  maturity_reason: z.string(),
  ai_opportunity: z.object({
    monetization_idea: z.string(),
    stack_synergy: z.string(),
  }),
  
  // Real Human Vibe Check
  human_vibe_check: z.object({
    pros: z.array(z.string()).length(2),
    gotchas_and_traps: z.array(z.string()).length(2),
    hype_vs_reality: z.number().min(0).max(10),
  }),
  
  quick_start: z.string(),
  updated_at: z.string(), // ISO String
  first_seen_at: z.string().optional(), // ISO String when first discovered by RepoRadar
  deep_dive_paragraphs: z.array(z.string()).optional(), // Detailed blog-style narrative paragraphs
  reading_guide: DeepReadingGuideSchema.optional(), // 3-Pass + Scaffolding deep reading guide
  facebook_post: z.string().optional(), // Ready-to-share Thai Facebook post draft
});

export type RepositoryData = z.infer<typeof RepositorySchema>;

export interface ReposFeedData {
  today: RepositoryData[];
  yesterday: RepositoryData[];
}

export const PAPER_CATEGORIES = [
  "AI Agents & Memory",
  "LLM & Reasoning",
  "Vision, Audio & Multimodal",
  "Infra, Speed & Quantization",
  "Coding, Data & Benchmarks",
  "Applied AI & Science",
] as const;

export type PaperCategory = (typeof PAPER_CATEGORIES)[number];

export const PaperUseCaseSchema = z.object({
  title: z.string(),
  role: z.string(),
  description: z.string(),
  example: z.string(),
});

export const PaperSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  organization: z.string().nullable(),
  upvotes: z.number(),
  num_comments: z.number(),
  published_date: z.string(), // YYYY-MM-DD (daily paper date)
  updated_at: z.string(), // ISO string
  first_seen_at: z.string().optional(), // ISO string when first discovered by RepoRadar
  arxiv_url: z.string(),
  pdf_url: z.string(),
  hf_url: z.string(),
  github_url: z.string().nullable(),
  github_stars: z.number().nullable(),
  project_url: z.string().nullable(),
  thumbnail_url: z.string(),
  media_urls: z.array(z.string()),
  category: z.enum(PAPER_CATEGORIES),
  reading_time_minutes: z.number(),

  // Thai Editorial Content (เนื้อหาสรุปเจาะลึกภาษาไทย)
  hook_headline: z.string(),
  short_teaser: z.string(),
  tldr_takeaways: z.array(z.string()),
  layman_story: z.array(z.string()), // 3-5 rich blog-style paragraphs in plain Thai
  impact_comparison: z.object({
    before: z.string(),
    after: z.string(),
    why_it_matters: z.string(),
  }),
  use_cases: z.array(PaperUseCaseSchema),
  community_pulse: z.object({
    summary: z.string(),
    praises: z.array(z.string()),
    critiques: z.array(z.string()),
    hype_score: z.number().min(0).max(10),
  }),
  reading_guide: DeepReadingGuideSchema.optional(), // 3-Pass + Scaffolding deep reading guide
  facebook_post: z.string().optional(), // Ready-to-share Thai Facebook post draft
});

export type PaperData = z.infer<typeof PaperSchema>;

export interface PaperDayBatch {
  date: string; // YYYY-MM-DD
  papers: PaperData[];
}

export interface PapersFeedData {
  updated_at: string;
  days: PaperDayBatch[]; // Rolling 7 days, newest first (days[0] = today, days[1] = yesterday, etc.)
}

export const NEWS_CATEGORIES = [
  "Gemini & Models",
  "Google Research & Labs",
  "Cloud & Developer Tools",
  "AI Products & Ecosystem",
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NewsPlaybookItemSchema = z.object({
  title: z.string(),
  role: z.string(),
  description: z.string(),
  example: z.string(),
});

export const NewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  source: z.string(),
  published_date: z.string(), // YYYY-MM-DD
  published_at: z.string(), // ISO string
  updated_at: z.string(), // ISO string
  first_seen_at: z.string().optional(), // ISO string when first discovered by RepoRadar
  authors: z.array(z.string()),
  rss_categories: z.array(z.string()),
  category: z.enum(NEWS_CATEGORIES),
  thumbnail_url: z.string().nullable(),
  reading_time_minutes: z.number(),

  // Thai Editorial Content
  hook_headline: z.string(),
  short_teaser: z.string(),
  tldr_takeaways: z.array(z.string()),
  layman_story: z.array(z.string()),
  impact_comparison: z.object({
    before: z.string(),
    after: z.string(),
    why_it_matters: z.string(),
  }),
  actionable_playbook: z.array(NewsPlaybookItemSchema),
  key_highlights: z.object({
    whats_new: z.array(z.string()),
    watchouts: z.array(z.string()),
  }),
  reading_guide: DeepReadingGuideSchema.optional(), // 3-Pass + Scaffolding deep reading guide
  facebook_post: z.string().optional(), // Ready-to-share Thai Facebook post draft
});

export type NewsArticleData = z.infer<typeof NewsArticleSchema>;

export interface NewsFeedData {
  updated_at: string;
  articles: NewsArticleData[];
}

export const SyncStatusSchema = z.object({
  last_sync_at: z.string(),
  last_sync_date_ict: z.string(), // YYYY-MM-DD in Asia/Bangkok
  new_counts: z.object({
    repos: z.number(),
    papers: z.number(),
    news: z.number(),
    total: z.number(),
  }),
  total_counts: z.object({
    repos_today: z.number(),
    papers_today: z.number(),
    news_total: z.number(),
  }),
  new_ids: z.object({
    repos: z.array(z.string()),
    papers: z.array(z.string()),
    news: z.array(z.string()),
  }),
  highlights: z.object({
    top_paper: z.string().nullable().optional(),
    top_repo: z.string().nullable().optional(),
    top_news: z.string().nullable().optional(),
  }),
  telegram_sent_at: z.string().nullable().optional(),
  run_source: z.enum(["github-actions", "local"]).optional(),
});

export type SyncStatusData = z.infer<typeof SyncStatusSchema>;



