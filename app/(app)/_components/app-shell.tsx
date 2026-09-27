import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PageTabs } from "./page-tabs";
import { SidebarNav } from "./sidebar-nav";

// ナビのあるページ共通の外枠（ホーム・記録する・一覧・分析で使う）。
// base(SP): 白いページヘッダー → 上部ヘッダーナビ → cream の本文 を画面いっぱいに縦積み
// md: 左にアイコンだけのサイドナビ（68px）、上部ヘッダーナビは消える
// lg: サイドナビがラベル付き（236px）に広がる
// ヘッダーナビはページヘッダーと本文の間に挟むので、header と children を分けて受け取る。
//
// paneLayout: 一覧/詳細のように、lg以上ではペインごとに自前のヘッダーを持つページ用。
//             true のとき共通ヘッダーは lg 未満だけに出す
export function AppShell({
  header,
  paneLayout = false,
  children,
}: {
  header: ReactNode;
  paneLayout?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen w-full bg-background md:flex xl:max-w-360">
      <SidebarNav />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "border-b border-line bg-card px-5 py-4 lg:px-8 lg:py-5",
            paneLayout && "lg:hidden",
          )}
        >
          {header}
        </header>

        {/* サイドナビが出る md 以上では上部ヘッダーナビは不要 */}
        <div className="md:hidden">
          <PageTabs />
        </div>

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

// ページヘッダーのタイトル。SP は 14.5px/700、PC は 20px/800
export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-heading text-[14.5px] font-bold text-foreground lg:text-xl lg:font-extrabold">
      {children}
    </h1>
  );
}

// 本文内のセクションラベル（「直近7日間」「感情の内訳」など）
export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="mb-1.75 text-[11px] font-bold text-ink-soft lg:mb-2.25 lg:text-xs">{children}</h2>;
}
