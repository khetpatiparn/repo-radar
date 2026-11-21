import type {
  DeepReadingGuide,
  NewsArticleData,
  PaperData,
  RepositoryData,
} from "../types";

function nonEmpty(items: Array<string | null | undefined>, max: number): string[] {
  return items
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, max);
}

function inferNewsPrerequisite(category: NewsArticleData["category"]): string {
  switch (category) {
    case "Gemini & Models":
      return "พื้นฐานการใช้งาน LLM API, Prompting และแนวคิด Context Window / Benchmark";
    case "Google Research & Labs":
      return "ความเข้าใจพื้นฐานด้าน AI/ML และสถาปัตยกรรมโมเดลยุคใหม่";
    case "Cloud & Developer Tools":
      return "พื้นฐานการพัฒนาซอฟต์แวร์, Cloud API และ Developer Workflow";
    default:
      return "พื้นฐานการใช้งานเครื่องมือ AI และระบบนิเวศ Google ทั่วไป";
  }
}

function inferPaperPrerequisite(category: PaperData["category"]): string {
  switch (category) {
    case "Infra, Speed & Quantization":
      return "พื้นฐานระบบ Inference, GPU Memory (VRAM) และสถาปัตยกรรม Transformer";
    case "AI Agents & Memory":
      return "พื้นฐาน LLM Tool Use, Agent Loop และระบบจัดการบริบท/หน่วยความจำ";
    case "Vision, Audio & Multimodal":
      return "พื้นฐานโมเดลประมวลผลภาพ/เสียง (VLM / Diffusion / Multimodal)";
    case "Coding, Data & Benchmarks":
      return "พื้นฐานการประเมินผลโมเดล (Evaluation/Benchmark) และ Data Pipeline";
    case "Applied AI & Science":
      return "พื้นฐาน Machine Learning และการประยุกต์ใช้งานในโดเมนเฉพาะทาง";
    default:
      return "พื้นฐาน LLM, Training/Fine-tuning และแนวคิด Reasoning เบื้องต้น";
  }
}

/**
 * Return the article's real AI-generated 3-Pass reading_guide if present,
 * otherwise honestly adapt existing legacy summary fields into 3-Pass layout
 * without inventing benchmarks, numbers, or fake glossary definitions.
 */
export function resolveNewsReadingGuide(news: NewsArticleData): DeepReadingGuide {
  if (news.reading_guide) {
    return news.reading_guide;
  }

  const lineageTags = news.rss_categories.slice(0, 3).join(" · ");
  const howItWorks: DeepReadingGuide["how_it_works"] = [];

  if (news.impact_comparison.after?.trim()) {
    howItWorks.push({
      step: "จุดเปลี่ยนหลักจากการอัปเดตนี้",
      detail: news.impact_comparison.after.trim(),
    });
  }

  for (const [idx, highlight] of news.key_highlights.whats_new.slice(0, 3).entries()) {
    if (highlight.trim()) {
      howItWorks.push({
        step: `สิ่งใหม่ที่สำคัญ #${idx + 1}`,
        detail: highlight.trim(),
      });
    }
  }

  const hardEvidence: DeepReadingGuide["hard_evidence"] = [
    {
      metric: "แหล่งประกาศต้นฉบับ",
      value: news.source,
      context: `หมวด ${news.category}`,
    },
    {
      metric: "วันที่เผยแพร่",
      value: news.published_date,
      context:
        news.authors.length > 0
          ? `ผู้เขียน: ${news.authors.slice(0, 2).join(", ")}`
          : "ประกาศทางการจาก Google Official Blog",
    },
  ];

  const tryItSteps = news.actionable_playbook
    .slice(0, 3)
    .map((item) => {
      const ex = item.example?.trim() ? ` (ตัวอย่าง: ${item.example.trim()})` : "";
      return `${item.title} — ${item.description}${ex}`;
    });

  const prerequisites = nonEmpty(
    [
      "ตรวจสอบประกาศต้นฉบับเพื่อเช็ก Model ID, ราคา และสิทธิ์การเข้าถึงล่าสุด",
      ...news.key_highlights.watchouts,
    ],
    4
  );

  const nextToLearn = nonEmpty(
    [
      `ติดตามเอกสารและสเปกเพิ่มเติมในหมวด ${news.category}`,
      ...news.rss_categories.slice(0, 2).map((tag) => `ค้นคว้าหัวข้อที่เกี่ยวข้อง: ${tag}`),
    ],
    3
  );

  return {
    pass1_triage: {
      core_idea: news.short_teaser || news.tldr_takeaways[0] || news.hook_headline,
      prerequisite_level: inferNewsPrerequisite(news.category),
      worth_deep_dive:
        news.impact_comparison.why_it_matters ||
        "อ่าน Pass 1–2 เพื่ออัปเดตทิศทางเครื่องมือใหม่ และเช็กประกาศต้นฉบับเมื่อพร้อมนำไปใช้",
      context_lineage: lineageTags
        ? `${news.source} · ${news.category} (${lineageTags})`
        : `${news.source} · ${news.category}`,
    },
    glossary: [],
    how_it_works: howItWorks.slice(0, 4),
    hard_evidence: hardEvidence,
    pass3_hands_on: {
      prerequisites,
      try_it_steps: tryItSteps,
      next_to_learn: nextToLearn,
    },
    source_depth: "legacy_adapted",
  };
}

/**
 * Return the paper's real AI-generated 3-Pass reading_guide if present,
 * otherwise honestly adapt existing legacy summary fields into 3-Pass layout.
 */
export function resolvePaperReadingGuide(paper: PaperData): DeepReadingGuide {
  if (paper.reading_guide) {
    return paper.reading_guide;
  }

  const howItWorks: DeepReadingGuide["how_it_works"] = [];
  if (paper.impact_comparison.before?.trim()) {
    howItWorks.push({
      step: "คอขวดและข้อจำกัดของวิธีเดิม",
      detail: paper.impact_comparison.before.trim(),
    });
  }
  if (paper.impact_comparison.after?.trim()) {
    howItWorks.push({
      step: "แนวทางใหม่ที่เปเปอร์นี้นำเสนอ",
      detail: paper.impact_comparison.after.trim(),
    });
  }
  for (const [idx, praise] of paper.community_pulse.praises.slice(0, 2).entries()) {
    if (praise.trim()) {
      howItWorks.push({
        step: `จุดเด่นเชิงเทคนิค #${idx + 1}`,
        detail: praise.trim(),
      });
    }
  }

  const hardEvidence: DeepReadingGuide["hard_evidence"] = [
    {
      metric: "รหัสงานวิจัย (arXiv)",
      value: paper.id,
      context: paper.organization
        ? `ทีม/สถาบัน: ${paper.organization} (${paper.published_date})`
        : `เผยแพร่เมื่อ ${paper.published_date}`,
    },
    {
      metric: "ความสนใจชุมชน (HF)",
      value: `${paper.upvotes} Upvotes`,
      context: `คะแนนความน่าจับตา ${paper.community_pulse.hype_score}/10`,
    },
    {
      metric: "ซอร์สโค้ด (GitHub)",
      value: paper.github_url
        ? paper.github_stars
          ? `${paper.github_stars.toLocaleString()} Stars`
          : "เปิดโค้ดบน GitHub"
        : "ต้นฉบับไม่ระบุลิงก์โค้ด",
      context: paper.github_url
        ? "สามารถคลิกเปิด Repository ด้านล่างเพื่อดูโค้ดจริง"
        : "ศึกษาสมการและตารางทดลองจากเอกสาร PDF ต้นฉบับ",
    },
  ];

  const tryItSteps = paper.use_cases.slice(0, 3).map((uc) => {
    const ex = uc.example?.trim() ? ` — ตัวอย่าง: ${uc.example.trim()}` : "";
    return `${uc.title} (${uc.role}): ${uc.description}${ex}`;
  });

  const prerequisites = nonEmpty(
    [
      paper.github_url
        ? "ตรวจสอบ README และความต้องการ GPU/Dependencies ใน GitHub Repository"
        : "เปิดเอกสาร PDF ต้นฉบับบน arXiv เพื่อดูรายละเอียดการทดลองและ Hyperparameters",
      ...paper.community_pulse.critiques,
    ],
    4
  );

  const nextToLearn = nonEmpty(
    [
      `ศึกษาเปเปอร์ต้นฉบับ arXiv:${paper.id} ในหัวข้อ Method และ Experiments`,
      `ค้นคว้างานวิจัยต่อเนื่องในกลุ่ม ${paper.category}`,
    ],
    3
  );

  return {
    pass1_triage: {
      core_idea: paper.short_teaser || paper.tldr_takeaways[0] || paper.hook_headline,
      prerequisite_level: inferPaperPrerequisite(paper.category),
      worth_deep_dive:
        paper.impact_comparison.why_it_matters ||
        paper.community_pulse.summary ||
        "อ่าน Pass 1–2 เพื่อเข้าใจคอนเซปต์หลัก และเปิด PDF ต้นฉบับเมื่อต้องนำไปต่อยอด",
      context_lineage: paper.organization
        ? `งานวิจัยจาก ${paper.organization} ในกลุ่ม ${paper.category}`
        : `งานวิจัยในกลุ่ม ${paper.category} (arXiv:${paper.id})`,
    },
    glossary: [],
    how_it_works: howItWorks.slice(0, 4),
    hard_evidence: hardEvidence,
    pass3_hands_on: {
      prerequisites,
      try_it_steps: tryItSteps,
      next_to_learn: nextToLearn,
    },
    source_depth: "legacy_adapted",
  };
}

/**
 * Return the repo's real AI-generated 3-Pass reading_guide if present,
 * otherwise honestly adapt existing legacy summary fields into 3-Pass layout.
 */
export function resolveRepoReadingGuide(repo: RepositoryData): DeepReadingGuide {
  if (repo.reading_guide) {
    return repo.reading_guide;
  }

  const howItWorks: DeepReadingGuide["how_it_works"] = [
    {
      step: "ปัญหาและกลไกหลักที่เข้ามาแก้",
      detail: repo.problem_solved,
    },
    ...repo.human_vibe_check.pros.slice(0, 2).map((pro, idx) => ({
      step: `จุดเด่นสำคัญ #${idx + 1}`,
      detail: pro,
    })),
  ];

  const hardEvidence: DeepReadingGuide["hard_evidence"] = [
    {
      metric: "GitHub Stars",
      value: `${repo.stars.toLocaleString()} (+${repo.stars_today.toLocaleString()} วันนี้)`,
      context: `Vibe Check ${repo.human_vibe_check.hype_vs_reality}/10`,
    },
    {
      metric: "ภาษาหลัก / สัญญาอนุญาต",
      value: `${repo.language || "ไม่ระบุ"} · ${repo.license || "ไม่ระบุ"}`,
      context: `Open Issues ${repo.open_issues} รายการ · ระดับ ${repo.maturity_rating}`,
    },
  ];

  const tryItSteps = nonEmpty(
    [
      repo.quick_start
        ? `ทดลองรันผ่านคำสั่ง Quick Start: ${repo.quick_start}`
        : undefined,
      repo.ai_opportunity.monetization_idea,
    ],
    3
  );

  const nextToLearn = nonEmpty(
    [
      repo.ai_opportunity.stack_synergy
        ? `เทคโนโลยีที่เข้าคู่: ${repo.ai_opportunity.stack_synergy}`
        : undefined,
      `ตรวจสอบโครงสร้างโค้ดและ Issues บน ${repo.owner}/${repo.name}`,
    ],
    3
  );

  return {
    pass1_triage: {
      core_idea: repo.one_liner,
      prerequisite_level: `พื้นฐาน ${repo.language || "การพัฒนาซอฟต์แวร์"} และการใช้งาน Git / CLI`,
      worth_deep_dive: `ความพร้อมระดับ ${repo.maturity_rating} — ${repo.maturity_reason}`,
      context_lineage:
        repo.topics.length > 0
          ? `${repo.owner}/${repo.name} · หัวข้อ: ${repo.topics.slice(0, 4).join(", ")}`
          : `${repo.owner}/${repo.name} (${repo.language || "Open Source"})`,
    },
    glossary: [],
    how_it_works: howItWorks.slice(0, 4),
    hard_evidence: hardEvidence,
    pass3_hands_on: {
      prerequisites: nonEmpty(repo.human_vibe_check.gotchas_and_traps, 4),
      try_it_steps: tryItSteps,
      next_to_learn: nextToLearn,
    },
    source_depth: "legacy_adapted",
  };
}
