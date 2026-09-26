// ナビの項目一覧。PageTabs（スマホ幅の横タブ）と SidebarNav（PC幅の縦サイドバー）の
// 両方から使う共通データ（2箇所目が必要になったのでここに集約）
// disabled は「未実装のページをグレーアウトして押せなくする」ための任意フラグ
type NavTab = { href: string; label: string; disabled?: boolean };

export const NAV_TABS: NavTab[] = [
  { href: "/", label: "ホーム" },
  { href: "/post", label: "記録する" },
  { href: "/logs", label: "一覧" },
  { href: "/analytics", label: "分析" },
];
