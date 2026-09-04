// template は layout と違い、遷移のたびに再マウントされる。
// そのため中の enter アニメーション（globals.css の app-page-enter）が毎回再生され、
// /post ⇔ /logs の切り替えがフェード＋スライドで「アプリっぽく」なる。
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}
