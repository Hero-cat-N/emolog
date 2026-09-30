import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 分析画面のカード部品。見た目だけを持ち、中身のデータは知らない

// 見出し付きの大きいカード（感情の内訳、推移グラフなど）
export function Panel({
  title,
  note,
  className,
  children,
}: {
  title: ReactNode;
  note?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5", className)}>
      <h2 className="flex items-baseline gap-2 text-sm font-bold text-foreground">
        {title}
        {note && <span className="text-xs font-normal text-muted-foreground">{note}</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// 上段の数字カード（記録日数、連続記録など）
export function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-1 text-foreground">{children}</div>
    </div>
  );
}

// データがまだ無い機能（タグ・AIなど）の置き場所。枠だけ出して「準備中」と書く
export function ComingSoon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground",
        className,
      )}
    >
      準備中です
    </div>
  );
}
