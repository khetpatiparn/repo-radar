# RepoRadar // GitHub Trending Intelligence

An automated "Zero-Cost Stack" web application that fetches GitHub trending repositories, uses AI to analyze their strategic value and community vibe, and presents it in a modern, dark-mode dashboard.

## Tech Stack
- **Frontend:** Next.js (App Router, Static Site Generation), Tailwind CSS, Lucide Icons
- **Data Pipeline:** Node.js/TypeScript script running via GitHub Actions
- **AI Integration:** Google Gemini API (`gemini-1.5-flash`)
- **Community Data:** GitHub API, Hacker News Algolia Search API
- **Database:** Flat JSON file (`src/data/repos.json`) version-controlled via Git
- **Deployment:** Vercel / Cloudflare Pages

## Local Development

### Prerequisites
- Node.js v20+
- A Google Gemini API Key
- A GitHub Personal Access Token (classic, with `public_repo` scope)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GITHUB_TOKEN=your_github_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the Data Pipeline Locally:**
   To fetch the latest trending repositories and generate AI insights:
   ```bash
   npm run pipeline
   ```
   *Note: If API keys are missing, the pipeline gracefully skips and uses mock data.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment & Automation

This project uses **GitHub Actions** to run a daily Cron job (`0 0 * * *` / 07:00 AM ICT) that updates the trending repositories.

### Required GitHub Secrets
Go to your repository settings on GitHub: **Settings > Secrets and variables > Actions > New repository secret**.

Add the following:
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `GITHUB_TOKEN`: The default `GITHUB_TOKEN` provided by Actions is usually sufficient, but ensure **Workflow permissions** under Actions > General is set to **Read and write permissions**.
- `TELEGRAM_BOT_TOKEN` *(optional, recommended for mobile alerts)*: Bot token from `@BotFather`.
- `TELEGRAM_CHAT_ID` *(optional, recommended for mobile alerts)*: Your Telegram personal chat ID or channel/group ID.
- `SITE_URL` *(optional)*: Custom deployed URL linked inside the Telegram alert (defaults to `https://repo-radar-lyart.vercel.app`).

### Telegram Mobile Notifications (แจ้งเตือนอัปเดตเด้งเข้ามือถือทุกเช้า)

RepoRadar ส่งข้อความสรุปอัปเดตรายวันเข้า Telegram อัตโนมัติหลังซิงก์เสร็จ (07:00 น. เวลาไทย) โดยระบุจำนวนรายการใหม่วันนี้แยกชัดเจนทั้ง GitHub Repos, AI Papers และข่าว Google AI พร้อมไฮไลต์และลิงก์เปิดอ่าน:

1. **สร้าง Bot ใน Telegram:**
   - ทักแชท [`@BotFather`](https://t.me/BotFather) พิมพ์ `/newbot` ตั้งชื่อและ username จากนั้นคัดลอก **Bot Token**
   - กดเปิดแชทกับบอทที่เพิ่งสร้าง แล้วกด **Start** (ส่งข้อความอะไรก็ได้ 1 ข้อความ)
2. **หา `TELEGRAM_CHAT_ID` ของคุณ:**
   - เปิดลิงก์ `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates` ในเบราว์เซอร์ (หรือใช้ `@userinfobot`)
   - นำค่าตัวเลขจาก `message.chat.id` มาเก็บไว้
3. **เพิ่มลงใน GitHub Secrets** (`Settings > Secrets and variables > Actions`):
   - `TELEGRAM_BOT_TOKEN` = Token จาก `@BotFather`
   - `TELEGRAM_CHAT_ID` = Chat ID ของคุณ
4. **ทดสอบส่งข้อความจากเครื่องของคุณ:**
   ```bash
   # พรีวิวข้อความโดยไม่ส่งจริง
   npm run notify:telegram -- --dry-run

   # ทดสอบยิงข้อความจริงเข้า Telegram (ต้องใส่ค่าใน .env.local ก่อน)
   npm run notify:telegram -- --test
   ```

### Design System
- รายละเอียด CI Brand **Ember Noir** (Deep Orange Gradient + Obsidian Black + Pure White + Dark Charcoal Gray) อยู่ใน [`DESIGN.md`](./DESIGN.md)

### Hosting (Vercel / Cloudflare Pages)
1. Import this repository into Vercel or Cloudflare Pages.
2. The platform will automatically detect Next.js.
3. Every time the GitHub Action successfully updates `src/data/*.json` (including `src/data/sync-status.json`) and pushes to `main`, the hosting provider will automatically rebuild and deploy the statically generated site.

## Windows Notifications

RepoRadar รองรับการแจ้งเตือนบน Windows 2 รูปแบบ:

1. **Web Push / Browser Notification (Chrome / Edge / Firefox บน Windows 10 & 11)**:
   - เข้าหน้าเว็บ [RepoRadar](https://repo-radar-lyart.vercel.app/)
   - กดปุ่ม **"แจ้งเตือนฉบับเช้า"** ที่แถบเมนูด้านบน แล้วกด "Allow"
   - เมื่อมีเทรนด์ใหม่ ระบบจะเด้งเป็น Windows Toast Notification ที่มุมขวาล่างทันที และสามารถกดปุ่มเพื่อทดสอบแจ้งเตือนได้ทุกเมื่อ

2. **Windows PowerShell Native Toast (`scripts/notify-windows.ps1`)**:
   - รันแจ้งเตือนแบบ Native ทันทีโดยไม่ต้องเปิดเว็บ:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\scripts\notify-windows.ps1
     ```
   - สามารถนำไปตั้งใน **Windows Task Scheduler** เพื่อให้เด้งเตือนอัตโนมัติทุกเช้าได้


