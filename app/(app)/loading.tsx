import { AppShell } from "./_components/app-shell";

// (app) 配下のページを読み込んでいる間に出す仮の画面。
// (app) には layout.tsx が無く、各ページが AppShell を描いているので、
// ここでも AppShell で包まないと読み込み中にサイドナビが消えてチラつく。
// これがあると、動的ページでもここまでを Link が先読みできる（クリック直後に切り替わる）
// 速く読み込めたときにスケルトンが一瞬だけ見えるのが気になるので、本文はあえて空にしている。
// ヘッダーは AppShell 側で高さ固定なので、空でも本物と同じ高さになる
export default function Loading() {
  return <AppShell header={null}>{null}</AppShell>;
}
