import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Source_Serif_4,
  Noto_Sans_Thai,
  Noto_Serif_Thai,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerifThai = Noto_Serif_Thai({
  variable: "--font-thai-serif",
  subsets: ["thai"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "THE REPO RADAR: วารสารวิเคราะห์งานวิจัย AI และโอเพนซอร์สรายวัน",
  description:
    "วารสารข่าวเทคโนโลยี เปเปอร์วิจัย AI มาแรงจาก Hugging Face และ GitHub Trending สรุปเจาะลึกเป็นภาษาไทยในรูปแบบสิ่งพิมพ์ร่วมสมัย",
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
        className={`${bricolage.variable} ${sourceSerif.variable} ${notoSansThai.variable} ${notoSerifThai.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
