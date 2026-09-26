import type { ReactNode } from "react";

import { PageTabs } from "./page-tabs";
import { SidebarNav } from "./sidebar-nav";

// ナビのあるページ共通の外枠（ホーム・記録する・一覧・分析で使う）。
// lg未満: 縦積みの1カラム（カードの中に横タブ）。lg以上: 左にサイドバー、右に幅広メインカード。
// 横タブはヘッダーとページ本体の間に挟むので、header と children を分けて受け取る
export function AppShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md lg:flex lg:max-w-5xl lg:items-start lg:gap-6">
        <SidebarNav />

        <div className="flex-1 overflow-hidden rounded-3xl border bg-card shadow-sm">
          {header}

          {/* サイドバーが出てるlg以上では横タブは不要 */}
          <div className="lg:hidden">
            <PageTabs />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
