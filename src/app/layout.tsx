import type { Metadata } from "next";
import {
  Noto_Serif_Thai,
  Playfair_Display,
  Sarabun,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-serif-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "THE REPO RADAR // วารสารวิเคราะห์งานวิจัย AI และโอเพนซอร์สรายวัน",
  description:
    "วารสารข่าวเทคโนโลยี เปเปอร์วิจัย AI มาแรงจาก Hugging Face และ GitHub Trending สรุปเจาะลึกเป็นภาษาไทยในรูปแบบหนังสือพิมพ์และหนังสือที่อ่านสบายตา",
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
        className={`${sarabun.variable} ${notoSerifThai.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

