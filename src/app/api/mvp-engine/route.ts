import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface A11yNode {
  ref: string;
  role: "heading" | "link" | "button" | "textbox" | "text";
  name: string;
  href?: string;
  level?: number;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHtmlToAccessibilityTree(html: string, baseUrl: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

  const pageTitle = titleMatch ? stripTags(titleMatch[1]) : baseUrl;
  const metaDescription = descMatch ? stripTags(descMatch[1]) : "";

  const nodes: A11yNode[] = [];
  let refCounter = 1;

  // Match headings, links, buttons, inputs in document order
  const tokenRegex =
    /<(h[1-6]|a|button|input)\b([^>]*)>([\s\S]*?)<\/\1>|<input\b([^>]*)\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null && nodes.length < 65) {
    const tag = (match[1] || "input").toLowerCase();
    const attrs = match[2] || match[4] || "";
    const inner = match[3] || "";

    if (tag.startsWith("h")) {
      const text = stripTags(inner);
      if (text.length > 1) {
        nodes.push({
          ref: `@e${refCounter++}`,
          role: "heading",
          level: parseInt(tag[1], 10),
          name: text.slice(0, 140),
        });
      }
    } else if (tag === "a") {
      const text = stripTags(inner);
      const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
      if (text.length > 1 && hrefMatch && !hrefMatch[1].startsWith("javascript:")) {
        let resolvedHref = hrefMatch[1];
        try {
          resolvedHref = new URL(hrefMatch[1], baseUrl).toString();
        } catch {
          // keep raw href
        }
        nodes.push({
          ref: `@e${refCounter++}`,
          role: "link",
          name: text.slice(0, 100),
          href: resolvedHref,
        });
      }
    } else if (tag === "button") {
      const text = stripTags(inner) || "Button";
      nodes.push({
        ref: `@e${refCounter++}`,
        role: "button",
        name: text.slice(0, 80),
      });
    } else if (tag === "input") {
      const typeMatch = attrs.match(/type=["']([^"']+)["']/i);
      const inputType = typeMatch ? typeMatch[1].toLowerCase() : "text";
      if (inputType !== "hidden") {
        const placeholderMatch =
          attrs.match(/placeholder=["']([^"']+)["']/i) ||
          attrs.match(/name=["']([^"']+)["']/i) ||
          attrs.match(/aria-label=["']([^"']+)["']/i);
        nodes.push({
          ref: `@e${refCounter++}`,
          role: inputType === "submit" || inputType === "button" ? "button" : "textbox",
          name: placeholderMatch ? placeholderMatch[1] : `${inputType} input`,
        });
      }
    }
  }

  const treeText = [
    `- document "${pageTitle}" [url="${baseUrl}"]`,
    metaDescription ? `  - meta "${metaDescription}"` : null,
    ...nodes.map((n) => {
      if (n.role === "heading") {
        return `  - heading "${n.name}" [level=${n.level}] [ref=${n.ref}]`;
      }
      if (n.role === "link") {
        return `  - link "${n.name}" [ref=${n.ref}] -> ${n.href}`;
      }
      if (n.role === "button") {
        return `  - button "${n.name}" [ref=${n.ref}]`;
      }
      return `  - textbox "${n.name}" [ref=${n.ref}]`;
    }),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: pageTitle,
    description: metaDescription,
    url: baseUrl,
    nodes,
    treeText,
    stats: {
      totalNodes: nodes.length,
      headings: nodes.filter((n) => n.role === "heading").length,
      links: nodes.filter((n) => n.role === "link").length,
      interactive: nodes.filter((n) => n.role !== "heading").length,
    },
  };
}

async function callGeminiJson(prompt: string) {
  if (!GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent(prompt);
      return JSON.parse(res.response.text());
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Live Browser Snapshot & Agent Task for vercel-labs/agent-browser
    if (action === "browser-snapshot") {
      const rawUrl = String(body.url || "https://news.ycombinator.com").trim();
      const targetUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
      const task = body.task ? String(body.task).trim() : "";

      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; VercelAgentBrowser/1.0; +https://github.com/vercel-labs/agent-browser)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      const html = await res.text();
      const snapshot = parseHtmlToAccessibilityTree(html, targetUrl);

      let agentAnalysis: {
        summary: string;
        recommendedActions: string[];
        extractedItems: string[];
      } | null = null;

      if (task) {
        const aiResult = await callGeminiJson(`
You are an AI Browser Automation Agent using vercel-labs/agent-browser.
User Mission: "${task}"
Target Page Accessibility Tree Snapshot:
${snapshot.treeText.slice(0, 4500)}

Respond in Thai (ภาษาไทย) with this exact JSON structure:
{
  "summary": "สรุปสิ่งที่พบในหน้าเว็บตามคำสั่งของผู้ใช้",
  "recommendedActions": ["คำสั่ง agent-browser ถัดไป เช่น agent-browser click @e2 (พร้อมเหตุผล)"],
  "extractedItems": ["ข้อมูลสำคัญชิ้นที่ 1", "ข้อมูลสำคัญชิ้นที่ 2", "ข้อมูลสำคัญชิ้นที่ 3"]
}`);
        if (aiResult) {
          agentAnalysis = aiResult;
        }
      }

      if (!agentAnalysis) {
        const topHeadings = snapshot.nodes
          .filter((n) => n.role === "heading")
          .slice(0, 4)
          .map((n) => `${n.ref}: ${n.name}`);
        const topLinks = snapshot.nodes
          .filter((n) => n.role === "link")
          .slice(0, 5)
          .map((n) => `${n.ref}: ${n.name} (${n.href})`);

        agentAnalysis = {
          summary: `ดึงโครงสร้าง Accessibility Tree จาก ${snapshot.title} สำเร็จ พบ Element ทั้งหมด ${snapshot.stats.totalNodes} จุด (หัวข้อ ${snapshot.stats.headings} จุด, ลิงก์และปุ่ม ${snapshot.stats.interactive} จุด)`,
          recommendedActions:
            snapshot.nodes.length > 0
              ? [
                  `agent-browser click ${snapshot.nodes.find((n) => n.role === "link")?.ref || "@e1"} # เปิดลิงก์หลักของหน้า`,
                  `agent-browser extract headings # ดึงโครงสร้างหัวข้อทั้งหมดไปวิเคราะห์ต่อ`,
                ]
              : ["agent-browser snapshot --full"],
          extractedItems: [...topHeadings, ...topLinks].slice(0, 6),
        };
      }

      return NextResponse.json({
        ok: true,
        status: res.status,
        snapshot,
        agentAnalysis,
      });
    }

    // 2. Clean-Room Reverse Engineering & App Synthesis for storytold/craft-anything
    if (action === "craft-cleanroom") {
      const targetUrl = String(body.targetUrl || "").trim();
      const customPrompt = String(body.customPrompt || "สร้างเว็บแอปเวอร์ชันใหม่ที่ทันสมัยและใช้งานได้จริง").trim();

      let inspectedContext = "";
      if (targetUrl) {
        try {
          const normalizedUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
          const res = await fetch(normalizedUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; CraftAnythingInspector/1.0)" },
          });
          const html = await res.text();
          const snap = parseHtmlToAccessibilityTree(html, normalizedUrl);
          inspectedContext = `Target Title: ${snap.title}\nDescription: ${snap.description}\nA11y Tree:\n${snap.treeText.slice(0, 2500)}`;
        } catch (e: any) {
          inspectedContext = `Target URL: ${targetUrl} (Could not fetch live HTML: ${e?.message})`;
        }
      }

      const aiCraft = await callGeminiJson(`
You are the Clean-Room Reverse Engineering Engine from storytold/craft-anything.
Study the target application and the user's customization request, produce a Clean-Room Specification, and build a working self-contained HTML5 interactive application.

Target Inspection Context:
${inspectedContext || "Custom Application Request"}

User Customization Request:
${customPrompt}

Return strictly this JSON structure (in Thai for descriptions, and complete working HTML/Tailwind/JS for html_code):
{
  "project_title": "ชื่อโปรเจกต์ที่สร้างขึ้นใหม่",
  "clean_room_spec": {
    "core_loop": "อธิบายกลไกการทำงานหลักที่ถอดรหัสได้ (ภาษาไทย)",
    "ui_architecture": ["โครงสร้างส่วนที่ 1", "โครงสร้างส่วนที่ 2", "โครงสร้างส่วนที่ 3"],
    "state_variables": ["ตัวแปรสถานะที่ 1", "ตัวแปรสถานะที่ 2"],
    "improvements": "สิ่งที่ปรับปรุงให้ดีกว่าต้นฉบับ (ภาษาไทย)"
  },
  "html_code": "<!DOCTYPE html><html lang=\\"th\\"><head><meta charset=\\"UTF-8\\"><script src=\\"https://cdn.tailwindcss.com\\"></script></head><body class=\\"bg-slate-950 text-white p-4\\">...complete interactive working app with buttons, state, and visual output...</body></html>"
}`);

      if (aiCraft && aiCraft.html_code) {
        return NextResponse.json({ ok: true, result: aiCraft });
      }

      return NextResponse.json({
        ok: false,
        error: "AI sedang busy หรือไม่มี API Key กรุณาใช้โหมด Preset Blueprints ที่เตรียมไว้ให้ได้เลยครับ",
      });
    }

    // 3. Senior Engineering Pipeline for addyosmani/agent-skills
    if (action === "agent-skills-build") {
      const idea = String(body.idea || "ระบบคำนวณและจำลองราคา Cloud & LLM API สำหรับ Startup").trim();

      const aiBuild = await callGeminiJson(`
You are a Senior Staff Engineer executing the addyosmani/agent-skills workflow (/spec -> /plan -> /build -> /test -> /review -> /ship) for this product idea:
"${idea}"

Return strictly this JSON object (all explanations in Thai, and a complete working interactive HTML/Tailwind/JS mini-app in ship_html):
{
  "title": "ชื่อโปรดักต์",
  "tagline": "คำโปรยสั้นๆ 1 ประโยค (ภาษาไทย)",
  "spec": {
    "problem": "ปัญหาหลักที่แก้ (ภาษาไทย)",
    "user_stories": ["ในฐานะ... ฉันต้องการ... เพื่อ...", "ในฐานะ... ฉันต้องการ... เพื่อ..."],
    "acceptance_criteria": ["เกณฑ์ข้อที่ 1", "เกณฑ์ข้อที่ 2", "เกณฑ์ข้อที่ 3"]
  },
  "plan": {
    "architecture": "สถาปัตยกรรมระบบที่เลือกใช้ (ภาษาไทย)",
    "components": ["Component 1", "Component 2", "Component 3"],
    "data_model": "โครงสร้างข้อมูลหลัก"
  },
  "code_snippet": "// โค้ดแกนหลักของระบบ (TypeScript / React)",
  "tests": [
    { "name": "ควรคำนวณผลลัพธ์หลักได้ถูกต้องตามเกณฑ์", "status": "PASS", "duration": "12ms" },
    { "name": "ควรจัดการค่าว่างและป้องกัน Input ผิดพลาด", "status": "PASS", "duration": "8ms" },
    { "name": "ควรส่งออกข้อมูลเป็น JSON/Clipboard ได้สำเร็จ", "status": "PASS", "duration": "15ms" }
  ],
  "review": {
    "score": 96,
    "security_notes": "ผ่านการตรวจสอบ XSS และ Input Sanitization",
    "performance_notes": "ทำงานฝั่ง Client แบบ Zero-latency ไม่บล็อก Main Thread"
  },
  "ship_html": "<!DOCTYPE html><html lang=\\"th\\"><head><meta charset=\\"UTF-8\\"><script src=\\"https://cdn.tailwindcss.com\\"></script></head><body class=\\"bg-zinc-950 text-zinc-100 p-4\\">...complete interactive working web app implementing the idea...</body></html>"
}`);

      if (aiBuild && aiBuild.ship_html) {
        return NextResponse.json({ ok: true, result: aiBuild });
      }

      return NextResponse.json({
        ok: false,
        error: "ไม่สามารถเรียก Gemini API ได้ในขณะนี้ กรุณาลองสุ่มจากคลังโปรเจกต์สำเร็จรูปด้านบน",
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
