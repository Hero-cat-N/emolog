import { AppShell } from "./_components/app-shell";

// (app) 配下のページを読み込んでいる間に出す仮の画面。
// (app) には layout.tsx が無く、各ページが AppShell を描いているので、
// ここでも AppShell で包まないと読み込み中にサイドナビが消えてチラつく。
// これがあると、動的ページでもここまでを Link が先読みできる（クリック直後に切り替わる）
export default function Loading() {
  return (
    <AppShell header={<div className="h-5 w-24 animate-pulse rounded-md bg-muted lg:h-7" />}>
      <div className="flex flex-col gap-4 px-5 py-4.5 lg:gap-6 lg:px-8 lg:py-7">
        {/* 上段の数字カード3枚（ホーム・分析と同じ並び） */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[14px] bg-muted lg:h-28 lg:rounded-2xl" />
          ))}
        </div>
        {/* その下のメインの塊（グラフ・一覧・フォームなど） */}
        <div className="h-40 animate-pulse rounded-[14px] bg-muted lg:h-64 lg:rounded-2xl" />
        <div className="h-24 animate-pulse rounded-[14px] bg-muted lg:h-32 lg:rounded-2xl" />
      </div>
    </AppShell>
  );
}
