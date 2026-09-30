// ナビの項目一覧。PageTabs（SPの上部ヘッダーナビ）と SidebarNav（md以上の縦サイドナビ）の
// 両方から使う共通データ。4項目・同じ順序を両方で保つ（Handoff 最重要ルール2）
// disabled は「未実装のページをグレーアウトして押せなくする」ための任意フラグ
// icon はサイドナビでだけ表示する（ヘッダーナビは幅が狭いので文字だけ）
import { AlignLeft, ChartNoAxesColumn, House, PenLine, type LucideIcon } from "lucide-react";

type NavTab = { href: string; label: string; icon: LucideIcon; disabled?: boolean };

export const NAV_TABS: NavTab[] = [
  { href: "/", label: "ホーム", icon: House },
  { href: "/post", label: "記録する", icon: PenLine },
  { href: "/logs", label: "一覧", icon: AlignLeft },
  { href: "/analytics", label: "分析", icon: ChartNoAxesColumn },
];

// いまのURLがそのタブの配下か。/logs/123 や /logs/123/edit でも「一覧」をアクティブにする。
// "/" は全URLの先頭に付くので、完全一致のときだけアクティブにする
export function isActiveTab(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
