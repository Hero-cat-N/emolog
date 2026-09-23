import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Droplet, List, ChartColumn, Pencil, Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startOfUTCDay } from "@/lib/date";
import { PageTabs } from "./_components/page-tabs";
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

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        <header className="px-6 pt-6 pb-4">
          <p className="text-sm text-muted-foreground">こんにちは</p>
        </header>

        <PageTabs />

        <div className="flex flex-col gap-4 px-6 py-5">
          {/* 連続記録 / 今月の記録 / 直近の気分 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-primary px-3 py-4 text-primary-foreground">
              <Droplet className="size-4" />
              <p className="mt-2 text-2xl font-bold">
                {streak}
                <span className="text-sm font-normal">日</span>
              </p>
              <p className="text-xs opacity-80">連続記録</p>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-4">
              <p className="text-2xl font-bold text-foreground">
                {monthCount}
                <span className="text-sm font-normal">件</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">今月の記録</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl bg-muted px-3 py-4">
              <span className="text-2xl">{recentEmotion.emoji}</span>
              <p className="mt-1 text-xs text-muted-foreground">直近の気分</p>
            </div>
          </div>

          {/* AI傾向（プレースホルダー：生成処理は未実装） */}
          <div className="rounded-2xl bg-accent px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-accent-foreground" />
              <span className="font-heading text-sm font-bold text-accent-foreground">
                直近の傾向
              </span>
            </div>
            <p className="text-xs text-muted-foreground">まだ分析されていません</p>
          </div>

          {/* 直近7日間 */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-foreground">直近7日間</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {last7Days.map((day) => {
                const isToday = day.getTime() === today.getTime();
                const hasLog = loggedDaySet.has(day.getTime());
                return (
                  <div
                    key={day.getTime()}
                    className={`flex h-10 items-center justify-center rounded-xl text-sm font-medium ${
                      isToday
                        ? "bg-foreground text-background"
                        : hasLog
                          ? "bg-[#E3F3EA] text-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day.getUTCDate()}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 今日の記録CTA */}
          <Link
            href={todayLog ? `/logs/${todayLog.id}` : "/post"}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition-colors hover:bg-muted"
          >
            <div>
              <p className="font-bold text-foreground">
                {todayLog ? "今日の記録は完了しています" : "今日はまだ記録がありません"}
              </p>
              <p className="text-xs text-muted-foreground">
                {todayLog ? "内容を見る" : "今日はどうしますか？"}
              </p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>

          {/* クイックアクション */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-foreground">クイックアクション</h3>
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/logs"
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs text-foreground transition-colors hover:bg-muted"
              >
                <List className="size-4" />
                一覧を見る
              </Link>
              <span className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs text-muted-foreground/50">
                <ChartColumn className="size-4" />
                分析を見る
              </span>
              <span className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs text-muted-foreground/50">
                <Pencil className="size-4" />
                下書き生成
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
