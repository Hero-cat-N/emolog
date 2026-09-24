// ナビの項目一覧。PageTabs（スマホ幅の横タブ）と SidebarNav（PC幅の縦サイドバー）の
// 両方から使う共通データ（2箇所目が必要になったのでここに集約）
export const NAV_TABS = [
  { href: "/", label: "ホーム" },
  { href: "/post", label: "記録する" },
  { href: "/logs", label: "一覧" },
  { href: "/analytics", label: "分析", disabled: true },
];
