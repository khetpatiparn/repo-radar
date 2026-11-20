import { DeepReadingGuideSchema, type DeepReadingGuide } from "../../src/types";

export function hasRefreshLatestFlag(): boolean {
  return (
    process.argv.includes("--refresh-latest") ||
    process.env.REFRESH_LATEST === "true"
  );
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * Extract clean, readable article/paper prose from raw HTML while preserving
 * headings, lists, and benchmark numbers (stripping nav/header/footer/scripts).
 */
export function extractReadableTextFromHtml(
  html: string,
  maxChars = 7500
): string {
  if (!html) return "";

  // Prefer <article> or <main> container when present
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let body = articleMatch?.[1] || mainMatch?.[1] || html;

  // Strip noisy non-content elements
  body = body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, " ")
    // Preserve structural line breaks for paragraphs, headings, list items, table rows
    .replace(/<\/(p|h1|h2|h3|h4|li|tr|div|section|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const cleaned = decodeHtmlEntities(body)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 25)
    // Remove common boilerplate lines
    .filter(
      (line) =>
        !/^(share|copy link|posted in|related stories|subscribe|sign up|cookie|privacy policy)/i.test(
          line
        )
    )
    .join("\n\n");

  return cleaned.slice(0, maxChars).trim();
}

/**
 * Extract key sections from an arXiv HTML paper (Introduction, Method, Experiments/Results, Conclusion)
 * keeping the prompt payload focused on real mechanisms & quantitative benchmarks.
 */
export function extractArxivHtmlHighlights(
  html: string,
  maxChars = 6500
): string {
  if (!html) return "";

  // Strip references/bibliography to avoid wasting budget on citations
  const withoutRefs = html.split(/<section[^>]*class="[^"]*ltx_bibliography/i)[0] || html;
  const fullText = extractReadableTextFromHtml(withoutRefs, 18000);
  if (fullText.length <= maxChars) return fullText;

  // Take opening (Abstract + Intro + Method) + closing (Results + Conclusion)
  const headBudget = Math.floor(maxChars * 0.65);
  const tailBudget = maxChars - headBudget - 40;
  return `${fullText.slice(0, headBudget).trim()}\n\n[...]\n\n${fullText
    .slice(-tailBudget)
    .trim()}`;
}

export const DEEP_READING_JSON_SPEC = `
  "reading_guide": {
    "pass1_triage": {
      "core_idea": "แก่นของเรื่องนี้ใน 1-2 ประโยคตรงไปตรงมา ไม่อ้อมค้อม (ภาษาไทย)",
      "prerequisite_level": "พื้นฐานที่ควรมีก่อนอ่าน เช่น 'เข้าใจพื้นฐาน Python + LLM API ทั่วไป' หรือ 'ต้องเข้าใจ Transformer / Attention บ้าง' (ภาษาไทย)",
      "worth_deep_dive": "คำตัดสินตรงไปตรงมาว่าคุ้มเวลาเจาะลึกแค่ไหน เช่น 'คุ้มค่ามาก — ลองรันในเครื่องได้เลย' หรือ 'รู้แค่คอนเซปต์ Pass 1-2 พอ ยังไม่ต้องลงโค้ด' (ภาษาไทย)",
      "context_lineage": "งานนี้ต่อยอดมาจากแนวคิด/เครื่องมืออะไร และอยู่ตรงจุดไหนของสายงาน AI (ภาษาไทย)"
    },
    "glossary": [
      {
        "term": "ศัพท์เทคนิคสำคัญที่โผล่ในบทความ (ภาษาอังกฤษ)",
        "meaning": "คำอธิบายภาษาคนธรรมดาแบบเข้าใจทันที 1-2 ประโยค (ภาษาไทย)",
        "analogy": "เปรียบเทียบกับของในชีวิตจริงหรือสิ่งที่ Dev คุ้นเคย 1 ประโยคสั้นๆ (ภาษาไทย)"
      }
    ],
    "how_it_works": [
      {
        "step": "ชื่อขั้นที่ 1 สั้นกระชับ (ภาษาไทย)",
        "detail": "อธิบายกลไกการทำงานจริงในขั้นนี้แบบจับต้องได้ ไม่ใช้คำกว้างๆ (ภาษาไทย)"
      },
      {
        "step": "ชื่อขั้นที่ 2 สั้นกระชับ (ภาษาไทย)",
        "detail": "อธิบายกลไกการทำงานจริงในขั้นนี้ (ภาษาไทย)"
      },
      {
        "step": "ชื่อขั้นที่ 3 สั้นกระชับ (ภาษาไทย)",
        "detail": "อธิบายกลไกการทำงานจริงในขั้นนี้ (ภาษาไทย)"
      }
    ],
    "hard_evidence": [
      {
        "metric": "ชื่อตัวชี้วัด / สเปก / ผลทดสอบที่ปรากฏในต้นฉบับ (เช่น Benchmark, VRAM, Latency, Model ID, ราคา, จำนวนข้อมูล)",
        "value": "ตัวเลขหรือข้อเท็จจริงเป๊ะๆ จากต้นฉบับเท่านั้น — หากต้นฉบับไม่ระบุตัวเลขให้เขียนว่า 'ต้นฉบับไม่ระบุตัวเลข'",
        "context": "เทียบกับ Baseline อะไร หรือเงื่อนไขการทดสอบคืออะไร (ภาษาไทย)"
      }
    ],
    "pass3_hands_on": {
      "prerequisites": [
        "สิ่งที่ต้องเตรียมหรือรู้ก่อนลอง เช่น 'Python 3.10+ / API Key / GPU VRAM >= 16GB' (ระบุตามจริงจากต้นฉบับ)"
      ],
      "try_it_steps": [
        "ขั้นตอนลองจับของจริงใน 5-10 นาที ขั้นที่ 1 พร้อมอธิบายสั้นๆ ว่าทำไมต้องทำขั้นนี้ (ภาษาไทย)",
        "ขั้นตอนลองจับของจริง ขั้นที่ 2 (ภาษาไทย)",
        "ขั้นตอนลองจับของจริง ขั้นที่ 3 (ภาษาไทย)"
      ],
      "next_to_learn": [
        "หัวข้อหรือคีย์เวิร์ดที่ควรไปศึกษาต่อ ข้อที่ 1 พร้อมเหตุผลสั้นๆ (ภาษาไทย)",
        "หัวข้อหรือคีย์เวิร์ดที่ควรไปศึกษาต่อ ข้อที่ 2 พร้อมเหตุผลสั้นๆ (ภาษาไทย)"
      ]
    }
  }`;

export const DEEP_READING_RULES = `
CRITICAL ANTI-HALLUCINATION & 3-PASS DEEP READING RULES:
- Target reader: a solo developer reading to genuinely understand how things actually work (NOT corporate PR, NOT generic SaaS sales pitch).
- NEVER invent benchmark numbers, pricing, VRAM specs, API names, or CLI flags that do not appear in the provided source text! If a number is not in the source, explicitly write "ต้นฉบับไม่ระบุตัวเลข" instead of guessing.
- "glossary" MUST contain 3 to 5 technical terms that ACTUALLY appear in the source/article and might block a junior/mid-level developer from reaching 95% comprehension.
- "how_it_works" MUST contain 3 to 4 concrete sequential steps explaining the actual mechanism / architecture / pipeline (mental model), NOT vague marketing slogans.
- "hard_evidence" MUST contain 2 to 4 concrete facts, numbers, specs, or benchmarks pulled directly from the source text.
- "pass3_hands_on" MUST be practical and realistic for a solo developer (no fake commands; if no public code exists, explain what experiment to try in AI Studio / playground or what concrete concepts to study next).
`;

function cleanStringArray(val: unknown, max: number): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

export function sanitizeReadingGuide(
  raw: unknown,
  sourceDepth?: DeepReadingGuide["source_depth"]
): DeepReadingGuide | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;

  const p1 = (obj.pass1_triage || {}) as Record<string, unknown>;
  const p3 = (obj.pass3_hands_on || {}) as Record<string, unknown>;

  const glossary = Array.isArray(obj.glossary)
    ? obj.glossary
        .filter((g): g is Record<string, unknown> => Boolean(g && typeof g === "object"))
        .map((g) => ({
          term: String(g.term || "").trim(),
          meaning: String(g.meaning || "").trim(),
          analogy: String(g.analogy || "").trim(),
        }))
        .filter((g) => g.term.length > 0 && g.meaning.length > 0)
        .slice(0, 5)
    : [];

  const howItWorks = Array.isArray(obj.how_it_works)
    ? obj.how_it_works
        .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
        .map((s) => ({
          step: String(s.step || "").trim(),
          detail: String(s.detail || "").trim(),
        }))
        .filter((s) => s.step.length > 0 && s.detail.length > 0)
        .slice(0, 4)
    : [];

  const hardEvidence = Array.isArray(obj.hard_evidence)
    ? obj.hard_evidence
        .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === "object"))
        .map((e) => ({
          metric: String(e.metric || "").trim(),
          value: String(e.value || "").trim(),
          context: String(e.context || "").trim(),
        }))
        .filter((e) => e.metric.length > 0 && e.value.length > 0)
        .slice(0, 5)
    : [];

  const coreIdea = String(p1.core_idea || "").trim();
  if (!coreIdea && glossary.length === 0 && howItWorks.length === 0) {
    return undefined;
  }

  const candidate: DeepReadingGuide = {
    pass1_triage: {
      core_idea: coreIdea || "สรุปแก่นแนวคิดหลักจากต้นฉบับ",
      prerequisite_level:
        String(p1.prerequisite_level || "").trim() ||
        "พื้นฐานการพัฒนาซอฟต์แวร์และ AI ทั่วไป",
      worth_deep_dive:
        String(p1.worth_deep_dive || "").trim() ||
        "อ่าน Pass 1-2 เพื่อเข้าใจกลไกหลัก และเก็บไว้ใช้อ้างอิงเมื่อเจองานที่เกี่ยวข้อง",
      context_lineage:
        String(p1.context_lineage || "").trim() ||
        "ต่อยอดจากแนวทางล่าสุดในระบบนิเวศ AI และ Open Source",
    },
    glossary,
    how_it_works: howItWorks,
    hard_evidence: hardEvidence,
    pass3_hands_on: {
      prerequisites: cleanStringArray(p3.prerequisites, 5),
      try_it_steps: cleanStringArray(p3.try_it_steps, 5),
      next_to_learn: cleanStringArray(p3.next_to_learn, 4),
    },
    source_depth: sourceDepth,
  };

  const parsed = DeepReadingGuideSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}
