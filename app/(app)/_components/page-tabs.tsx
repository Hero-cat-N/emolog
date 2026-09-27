"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_TABS, isActiveTab } from "./nav-tabs";

// SP（md未満）の上部ヘッダーナビ。4等分・文字だけ。アクティブは文字色＋下線2px
export function PageTabs() {
  // 今表示している URL のパス（例: "/logs"）。ページ遷移するたびに新しい値になる
  const pathname = usePathname();

  return (
    <nav className="flex border-b border-line bg-card">
      {NAV_TABS.map((tab) => {
        const isActive = isActiveTab(pathname, tab.href);
        const base = "-mb-px flex-1 border-b-2 px-1 py-3.25 text-center text-[12.5px]";

        if (tab.disabled) {
          return (
            <span key={tab.href} className={cn(base, "border-transparent text-muted-foreground/50")}>
              {tab.label}
            </span>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              base,
              "transition-colors duration-150",
              isActive
                ? "border-brand font-bold text-accent-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
