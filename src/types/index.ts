import { z } from "zod";

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
  layman_story: z.array(z.string()), // 2-3 paragraphs in plain Thai
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


