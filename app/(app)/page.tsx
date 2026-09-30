import Link from "next/link";
import { redirect } from "next/navigation";
import { AlignLeft, ChartNoAxesColumn, ChevronRight, Flame, PenLine, Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startOfUTCDay } from "@/lib/date";
import { LogoutButton } from "@/components/logout-button";
import { cn } from "@/lib/utils";
import { AppShell, SectionLabel } from "./_components/app-shell";
import { EMOTION_FALLBACK, EMOTION_UI } from "./logs/log-card-utils";
import { calculateStreak } from "./streak";

export const dynamic = "force-dynamic";

function startOfUTCMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts が未ログインを弾いてくれているはずだが、型上 user は null もあり得るので保険
  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const today = startOfUTCDay(new Date());
  // Googleログインだと user_metadata に表示名が入っている。無ければ名前なしの挨拶にする
  const displayName: string | undefined = user.user_metadata?.full_name ?? user.user_metadata?.name;

  const [todayLog, monthCount, recentLog, allDates] = await Promise.all([
    prisma.log.findUnique({ where: { userId_loggedDate: { userId, loggedDate: today } } }),
    prisma.log.count({ where: { userId, loggedDate: { gte: startOfUTCMonth(today) } } }),
    prisma.log.findFirst({
      where: { userId },
      orderBy: { loggedDate: "desc" },
      include: { emotion: true },
    }),
    prisma.log.findMany({
      where: { userId },
      select: { loggedDate: true },
      orderBy: { loggedDate: "desc" },
    }),
  ]);

  const streak = calculateStreak(allDates.map((d) => d.loggedDate));

  // 直近7日間（6日前 → 今日、古い順）
  const loggedDaySet = new Set(allDates.map((d) => startOfUTCDay(d.loggedDate).getTime()));
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d;
  });

  const recentEmotion =
    (recentLog?.emotion?.code && EMOTION_UI[recentLog.emotion.code]) || EMOTION_FALLBACK;

  // クイックアクションの1枚ぶんの見た目（一覧を見る / 分析を見る / 下書き生成）
  const quickAction =
    "flex flex-col items-center gap-1.5 rounded-xl border bg-card px-1 py-3 text-[10.5px] text-ink-soft transition-colors duration-150 lg:gap-2 lg:rounded-[14px] lg:py-4.5 lg:text-[11.5px]";
  const quickIcon = "size-4.25 text-accent-foreground lg:size-5";

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground lg:text-[11.5px]">こんにちは</p>
            {displayName && (
              <h1 className="font-heading text-[17px] font-bold text-foreground lg:text-xl lg:font-extrabold">
                {displayName} さん
              </h1>
            )}
          </div>
          {/* ログアウトは全幅共通でヘッダー右上に置く */}
          <LogoutButton />
        </div>
      }
    >
      {/* SP: 縦積み。lg: 左に「状況を見る」列、右に「行動する」列（固定幅） */}
      <div className="grid gap-4 px-5 py-4.5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6 lg:px-8 lg:py-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4 lg:gap-6">
          {/* 連続記録 / 今月の記録 / 直近の気分 */}
          <div className="flex gap-2.25 lg:gap-3.5">
            <div className="flex-1 rounded-[14px] bg-brand-gradient px-2.5 py-3.25 text-primary-foreground lg:rounded-2xl lg:p-5 lg:shadow-[0_8px_18px_rgba(216,85,40,0.28)]">
              <Flame className="size-3.75 fill-current lg:size-4.5" strokeWidth={1.8} />
              <p className="mt-1 font-heading text-[22px] leading-tight font-extrabold lg:mt-2 lg:text-[32px] lg:leading-none">
                {streak}
                <span className="text-xs font-medium lg:text-[15px]">日</span>
              </p>
              <p className="mt-0.5 text-[10px] opacity-90 lg:mt-1.5 lg:text-xs">連続記録</p>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] bg-muted px-2.5 py-3.25 lg:rounded-2xl lg:p-5">
              <p className="font-heading text-[22px] leading-tight font-extrabold text-foreground lg:text-[32px] lg:leading-none">
                {monthCount}
                <span className="text-xs font-medium lg:text-[15px]">件</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground lg:mt-1.5 lg:text-xs">今月の記録</p>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center rounded-[14px] bg-muted px-2.5 py-3.25 lg:rounded-2xl lg:p-5">
              <recentEmotion.icon className="size-7 lg:size-8" style={{ color: recentEmotion.color }} />
              <p className="mt-0.5 text-[10px] text-muted-foreground lg:mt-1.5 lg:text-xs">直近の気分</p>
            </div>
          </div>

          {/* AI傾向（プレースホルダー：生成処理は未実装）。AI由来は ✨ + accent 配色 */}
          <div className="flex gap-2.5 rounded-[14px] border border-accent-border bg-accent p-3.25 lg:gap-3 lg:rounded-2xl lg:px-5 lg:py-4.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-foreground lg:size-4.5" strokeWidth={1.8} />
            <div>
              <span className="inline-block rounded-full border border-[#F0C7B4] bg-card px-2 py-0.5 text-[9.5px] font-bold text-accent-foreground lg:text-[10px]">
                ✨ AI
              </span>
              <p className="mt-1.5 text-[13px] leading-relaxed text-foreground lg:text-[14.5px] lg:leading-[1.7]">
                まだ分析されていません
              </p>
              <Link
                href="/analytics"
                className="mt-1.5 inline-block text-[11.5px] font-semibold text-accent-foreground hover:underline lg:mt-2 lg:text-[12.5px]"
              >
                詳しい分析を見る →
              </Link>
            </div>
          </div>

          {/* 直近7日間 */}
          <section>
            <SectionLabel>直近7日間</SectionLabel>
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
              {last7Days.map((day) => {
                const isToday = day.getTime() === today.getTime();
                const hasLog = loggedDaySet.has(day.getTime());
                return (
                  <div
                    key={day.getTime()}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-[7px] text-[10.5px] font-semibold lg:aspect-auto lg:h-16 lg:rounded-[10px] lg:text-[13px]",
                      isToday
                        ? "bg-foreground font-bold text-background"
                        : hasLog
                          ? "bg-[#E3F3EA] text-[#1E7A50]"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {day.getUTCDate()}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* SP では区切り線を挟んで下に続く。lg では右カラムになるので区切り線は不要 */}
        <div className="h-px bg-border lg:hidden" />

        <div className="flex flex-col gap-4 lg:gap-6">
          {/* 今日の記録CTA（未記録のときは発光させて気づかせる） */}
          <Link
            href={todayLog ? `/logs/${todayLog.id}` : "/post"}
            className={cn(
              "flex items-center justify-between rounded-xl border bg-card p-3.5 transition-colors duration-150 hover:bg-accent lg:rounded-2xl lg:p-5 lg:shadow-card",
              todayLog ? "border-border" : "animate-glow border-primary",
            )}
          >
            <div>
              <p className="text-[13px] font-semibold text-foreground lg:text-[15px] lg:font-bold">
                {todayLog ? "今日の記録は完了しています" : "今日はまだ記録がありません"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground lg:text-xs">
                {todayLog ? "内容を見る" : "今日はどうしますか？"}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground lg:size-4.5" />
          </Link>

          {/* クイックアクション */}
          <section>
            <SectionLabel>クイックアクション</SectionLabel>
            <div className="grid grid-cols-3 gap-2 lg:gap-2.5">
              <Link href="/logs" className={cn(quickAction, "hover:bg-accent")}>
                <AlignLeft className={quickIcon} strokeWidth={1.8} />
                一覧を見る
              </Link>
              <Link href="/analytics" className={cn(quickAction, "hover:bg-accent")}>
                <ChartNoAxesColumn className={quickIcon} strokeWidth={1.8} />
                分析を見る
              </Link>
              {/* 下書き生成はAI機能の実装待ち */}
              <span className={cn(quickAction, "opacity-50")}>
                <PenLine className={quickIcon} strokeWidth={1.8} />
                下書き生成
              </span>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
