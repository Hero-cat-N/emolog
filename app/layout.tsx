import type { Metadata } from "next";
import { Geist_Mono, M_PLUS_Rounded_1c, Noto_Sans_JP, Quicksand } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
    // ブラウザ拡張機能が <html>・<body> に属性を足すと hydration の警告が出るため、この2要素の属性の差だけ無視する。
    // 効くのはこの要素自身の属性だけで、子要素のずれは引き続き検出される
    <html
      lang="ja"
      className={`${mplusRounded.variable} ${notoSansJP.variable} ${quicksand.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        {/* toast の表示場所。layout に置くので、画面遷移しても通知が消えない。
            アプリはライトテーマのみなので light に固定（OS がダークでも黒くしない） */}
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
