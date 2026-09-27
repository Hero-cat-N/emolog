import Link from "next/link";

import { cn } from "@/lib/utils";
import { PERIODS, type PeriodDays } from "./period";

// 集計期間の切り替えタブ。選んだ期間は URL（?period=）に持たせるので、
// useState も "use client" も要らない（押すと URL が変わり、page.tsx が取り直す）。
// 見た目はモックに合わせたセグメント型（薄い土台の上で、選択中だけ白く浮かせる）。
// ホームと分析の両方で使うので、リンク先のパスは basePath で受け取る
export function PeriodTabs({ current, basePath }: { current: PeriodDays; basePath: string }) {
  return (
    // PC では幅360pxで止める（SP は全幅）
    <div className="flex gap-0.5 rounded-[10px] bg-muted p-0.75 lg:w-90">
      {PERIODS.map((p) => {
        const isActive = p.days === current;

        return (
          <Link
            key={p.days}
            href={`${basePath}?period=${p.days}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 rounded-lg px-0.5 py-1.75 text-center text-[11.5px] transition-colors duration-150 lg:py-2 lg:text-xs",
              isActive
                ? "bg-card font-bold text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
