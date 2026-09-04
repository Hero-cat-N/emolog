"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/post", label: "記録する" },
  { href: "/logs", label: "一覧" },
  { href: "/analytics", label: "分析", disabled: true },
];

export function PageTabs() {
  // 今表示している URL のパス（例: "/logs"）。ページ遷移するたびに新しい値になる
  const pathname = usePathname();

  return (
    <nav className="flex border-b text-sm">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;

        if (tab.disabled) {
          return (
            <span
              key={tab.href}
              className="flex-1 px-4 py-3 text-center text-muted-foreground/50"
            >
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
              "flex-1 px-4 py-3 text-center transition-colors",
              isActive
                ? "border-b-2 border-primary font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
