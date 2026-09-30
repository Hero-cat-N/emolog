"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_TABS, isActiveTab } from "./nav-tabs";

// md以上で出す縦のサイドナビ。画面の左端に全高で張り付く。
// md: アイコンだけの細い帯（68px） / lg: ワードマーク＋ラベル付き（236px）
// 中身(NAV_TABS)はPageTabsと共通
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-17 shrink-0 flex-col border-r border-line bg-card md:flex lg:w-59">
      {/* ロゴ。幅の狭いmdではアイコン単体、lgではワードマーク */}
      <Link href="/" className="flex justify-center px-3 pt-5.5 pb-4.5 lg:justify-start lg:px-5">
        <Image src="/emolog-icon-light.svg" alt="エモログ" width={36} height={36} className="lg:hidden" />
        <Image
          src="/emolog-wordmark.svg"
          alt="エモログ"
          width={78}
          height={26}
          className="hidden h-6.5 w-auto lg:block"
        />
      </Link>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_TABS.map((tab) => {
          const isActive = isActiveTab(pathname, tab.href);
          // md はタップ領域44pxを確保、lg はラベル付きで横並び
          const base =
            "flex h-11 items-center justify-center gap-2.5 rounded-[10px] text-[13px] lg:h-auto lg:justify-start lg:px-3 lg:py-2.75";

          if (tab.disabled) {
            return (
              <span key={tab.href} className={cn(base, "text-muted-foreground/50")}>
                <tab.icon className="size-4.25" strokeWidth={1.8} />
                <span className="sr-only lg:not-sr-only">{tab.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              title={tab.label}
              className={cn(
                base,
                "transition-colors duration-150",
                isActive
                  ? "bg-accent font-bold text-accent-foreground"
                  : "text-ink-soft hover:bg-muted hover:text-foreground",
              )}
            >
              <tab.icon className="size-4.25" strokeWidth={1.8} />
              {/* md ではラベルを隠す（読み上げ用には残す） */}
              <span className="sr-only lg:not-sr-only">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
