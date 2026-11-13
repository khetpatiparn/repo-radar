import type { Metadata, Viewport } from "next";
import {
  Wix_Madefor_Display,
  Wix_Madefor_Text,
  Noto_Sans_Thai,
} from "next/font/google";
import "./globals.css";

const wixDisplay = Wix_Madefor_Display({
  variable: "--font-wix-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const wixText = Wix_Madefor_Text({
  variable: "--font-wix-text",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "THE REPO RADAR: วารสารวิเคราะห์งานวิจัย AI และโอเพนซอร์สรายวัน",
  description:
    "วารสารข่าวเทคโนโลยี เปเปอร์วิจัย AI มาแรงจาก Hugging Face และ GitHub Trending สรุปเจาะลึกเป็นภาษาไทย",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className={`${wixDisplay.variable} ${wixText.variable} ${notoSansThai.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
