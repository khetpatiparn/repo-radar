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

### Hosting (Vercel / Cloudflare Pages)
1. Import this repository into Vercel or Cloudflare Pages.
2. The platform will automatically detect Next.js.
3. Every time the GitHub Action successfully updates `src/data/repos.json` and pushes to `main`, the hosting provider will automatically rebuild and deploy the statically generated site.

## Windows Notifications

RepoRadar รองรับการแจ้งเตือนบน Windows 2 รูปแบบ:

1. **Web Push / Browser Notification (Chrome / Edge / Firefox บน Windows 10 & 11)**:
   - เข้าหน้าเว็บ [RepoRadar](https://repo-radar-lyart.vercel.app/)
   - กดปุ่ม **"เปิดแจ้งเตือน Windows"** ที่แถบเมนูด้านบน แล้วกด "Allow"
   - เมื่อมีเทรนด์ใหม่ ระบบจะเด้งเป็น Windows Toast Notification ที่มุมขวาล่างทันที และสามารถกดปุ่มเพื่อทดสอบแจ้งเตือนได้ทุกเมื่อ

2. **Windows PowerShell Native Toast (`scripts/notify-windows.ps1`)**:
   - รันแจ้งเตือนแบบ Native ทันทีโดยไม่ต้องเปิดเว็บ:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\scripts\notify-windows.ps1
     ```
   - สามารถนำไปตั้งใน **Windows Task Scheduler** เพื่อให้เด้งเตือนอัตโนมัติทุกเช้าได้

