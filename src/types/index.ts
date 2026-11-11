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
