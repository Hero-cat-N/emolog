"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { NAV_TABS } from "./nav-tabs";

// PC幅(lg以上)だけで出す縦のサイドナビ。中身(NAV_TABS)はPageTabsと共通
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden h-fit w-56 shrink-0 flex-col gap-1 rounded-3xl border bg-card p-3 shadow-sm lg:flex">
      {NAV_TABS.map((tab) => {
        const isActive = pathname === tab.href;

        if (tab.disabled) {
          return (
            <span
              key={tab.href}
              className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground/50"
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
              "rounded-xl px-4 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      <div className="mt-2 border-t border-border pt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}
