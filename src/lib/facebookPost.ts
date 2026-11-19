import type {
  PaperData,
  RepositoryData,
  NewsArticleData,
} from "../types";

export function buildPaperFacebookPost(paper: PaperData): string {
  if (paper.facebook_post && paper.facebook_post.trim().length >= 80) {
    return paper.facebook_post.trim();
  }

  const takeaways = paper.tldr_takeaways
    .slice(0, 3)
    .map((point) => `✅ ${point}`)
    .join("\n");

  const leadParagraph = paper.layman_story[0] || paper.short_teaser;
  const secondParagraph = paper.layman_story[1] || "";

  const topUseCases = paper.use_cases
    .slice(0, 2)
    .map((uc, idx) => `${idx + 1}. ${uc.title} (${uc.role}) — ${uc.description}`)
    .join("\n");

  const links: string[] = [];
  if (paper.github_url) links.push(`💻 โค้ด GitHub: ${paper.github_url}`);
  links.push(`📄 เปเปอร์ต้นฉบับ (arXiv): ${paper.pdf_url}`);
  links.push(`🤗 หน้าพูดคุย Hugging Face: ${paper.hf_url}`);

  const orgLine = paper.organization ? ` จากทีม ${paper.organization}` : "";

  return [
    `🔥 ${paper.hook_headline}`,
    "",
    `งานวิจัย AI มาแรงประจำวัน${orgLine} (${paper.upvotes} Upvotes บน Hugging Face) — "${paper.title}"`,
    "",
    paper.short_teaser,
    "",
    "📌 สรุปประเด็นสำคัญใน 30 วินาที:",
    takeaways,
    "",
    "🔍 เจาะลึกให้เข้าใจง่าย:",
    leadParagraph,
    ...(secondParagraph ? ["", secondParagraph] : []),
    "",
    `⚡ เปลี่ยนจากเดิมยังไง?`,
    `• แบบเดิม: ${paper.impact_comparison.before}`,
    `• แบบใหม่: ${paper.impact_comparison.after}`,
    `• ทำไมถึงสำคัญ: ${paper.impact_comparison.why_it_matters}`,
    ...(topUseCases
      ? ["", "🚀 ตัวอย่างการนำไปต่อยอดจริง:", topUseCases]
      : []),
    "",
    "💬 เพื่อนๆ คิดว่าเทคนิคนี้จะเปลี่ยนวิธีทำงานสาย AI ของเราไปแค่ไหนครับ? คอมเมนต์แลกเปลี่ยนกันได้เลย!",
    "",
    ...links,
    "",
    `#AI #Research #MachineLearning #${paper.category.replace(/[^A-Za-z0-9]/g, "")} #TheRepoRadar`,
  ].join("\n");
}

export function buildRepoFacebookPost(repo: RepositoryData): string {
  if (repo.facebook_post && repo.facebook_post.trim().length >= 80) {
    return repo.facebook_post.trim();
  }

  const pros = repo.human_vibe_check.pros.map((p) => `✅ ${p}`).join("\n");
  const gotchas = repo.human_vibe_check.gotchas_and_traps
    .map((g) => `⚠️ ${g}`)
    .join("\n");

  const deepDive =
    repo.deep_dive_paragraphs && repo.deep_dive_paragraphs.length > 0
      ? `\n\n${repo.deep_dive_paragraphs.slice(0, 2).join("\n\n")}`
      : "";

  return [
    `🚀 GitHub โอเพนซอร์สมาแรงวันนี้: ${repo.owner}/${repo.name} (+${repo.stars_today.toLocaleString()}⭐ วันนี้ | รวม ${repo.stars.toLocaleString()}⭐)`,
    "",
    `💡 ${repo.one_liner}`,
    "",
    `🔍 แก้ปัญหาอะไรให้คนทำงาน/นักพัฒนา?`,
    `${repo.problem_solved}${deepDive}`,
    "",
    `⚖️ เทียบกับทางเลือกเดิมในตลาด:`,
    repo.alternative_comparison,
    "",
    `💰 ไอเดียต่อยอดทำโปรเจกต์ / Micro-SaaS:`,
    repo.ai_opportunity.monetization_idea,
    `• Stack ที่เข้าคู่ได้ดี: ${repo.ai_opportunity.stack_synergy}`,
    "",
    `🧪 รีวิวจากการใช้งานจริง (ความพร้อม: ${repo.maturity_rating} | Vibe ${repo.human_vibe_check.hype_vs_reality}/10):`,
    pros,
    gotchas,
    "",
    `⚡ ทดลองรันด่วน:`,
    repo.quick_start,
    "",
    `💬 มีใครลองเอา ${repo.name} ไปรันในโปรเจกต์จริงแล้วบ้างครับ? แชร์ประสบการณ์กันได้!`,
    "",
    `🔗 GitHub Repository: ${repo.url}`,
    "",
    `#OpenSource #GitHubTrending #AI #DevTools #${(repo.language || "Programming").replace(/[^A-Za-z0-9]/g, "")} #TheRepoRadar`,
  ].join("\n");
}

export function buildNewsFacebookPost(news: NewsArticleData): string {
  if (news.facebook_post && news.facebook_post.trim().length >= 80) {
    return news.facebook_post.trim();
  }

  const takeaways = news.tldr_takeaways
    .slice(0, 3)
    .map((point) => `✅ ${point}`)
    .join("\n");

  const leadParagraph = news.layman_story[0] || news.short_teaser;
  const secondParagraph = news.layman_story[1] || "";

  const playbook = news.actionable_playbook
    .slice(0, 2)
    .map((item, idx) => `${idx + 1}. ${item.title} (${item.role}) — ${item.description}`)
    .join("\n");

  return [
    `📰 ${news.hook_headline}`,
    "",
    `อัปเดตล่าสุดจาก ${news.source} (${news.published_date}) — "${news.title}"`,
    "",
    news.short_teaser,
    "",
    "📌 สรุปประเด็นสำคัญ:",
    takeaways,
    "",
    "🔍 เจาะลึกรายละเอียด:",
    leadParagraph,
    ...(secondParagraph ? ["", secondParagraph] : []),
    "",
    "⚡ เปลี่ยนจากก่อนอัปเดตยังไง?",
    `• ก่อนหน้านี้: ${news.impact_comparison.before}`,
    `• อัปเดตใหม่: ${news.impact_comparison.after}`,
    `• ทำไมถึงน่าจับตา: ${news.impact_comparison.why_it_matters}`,
    ...(playbook ? ["", "💡 แนวทางเอาไปใช้ประโยชน์จริง:", playbook] : []),
    "",
    "💬 เพื่อนๆ มองว่าอัปเดตนี้จาก Google น่าลองเอาไปปรับใช้กับงานด้านไหนมากที่สุดครับ?",
    "",
    `🔗 อ่านประกาศต้นฉบับ: ${news.url}`,
    "",
    `#GoogleAI #AINews #TechUpdate #${news.category.replace(/[^A-Za-z0-9]/g, "")} #TheRepoRadar`,
  ].join("\n");
}

/**
 * Copy text to clipboard with legacy execCommand fallback when
 * navigator.clipboard is unavailable or rejects.
 */
export async function copyTextWithFallback(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy textarea copy
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
