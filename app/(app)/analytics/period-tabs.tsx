import Link from "next/link";

import { cn } from "@/lib/utils";
import { PERIODS, type PeriodDays } from "./period";

// 集計期間の切り替えタブ。選んだ期間は URL（?period=）に持たせるので、
// useState も "use client" も要らない（押すと URL が変わり、page.tsx が取り直す）
export function PeriodTabs({ current }: { current: PeriodDays }) {
  return (
    <div className="flex gap-1.5">
      {PERIODS.map((p) => {
        const isActive = p.days === current;

        return (
          <Link
            key={p.days}
            href={`/analytics?period=${p.days}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-center text-xs transition-colors",
              isActive
                ? "bg-foreground font-medium text-background"
                : "border text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
