import type { Metadata } from "next";
import { Geist_Mono, M_PLUS_Rounded_1c, Noto_Sans_JP, Quicksand } from "next/font/google";
import "./globals.css";

// note: 日本語フォント(M PLUS Rounded 1c / Noto Sans JP)にはsubsetsの"japanese"という
// 選択肢が無い(CJKフォントは欧文フォントと違う配信方式のため)。指定せずデフォルトのまま使う
const mplusRounded = M_PLUS_Rounded_1c({
  weight: ["700", "800"],
  variable: "--font-heading",
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

// note: Quicksandは日本語グリフを持たないため、欧文・数字表示のみに限定して使う想定
const quicksand = Quicksand({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-accent",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "emolog",
  description: "今日の記録をつける、感情日記アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${mplusRounded.variable} ${notoSansJP.variable} ${quicksand.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
