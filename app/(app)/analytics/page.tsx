import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startOfUTCDay } from "@/lib/date";
import { AppShell } from "../_components/app-shell";
import { EMOTION_FALLBACK, EMOTION_UI } from "../logs/log-card-utils";
import { calculateStreak } from "../streak";
import { countByEmotion } from "./count-by-emotion";
import { EmotionBreakdown } from "./emotion-breakdown";
import { parsePeriod } from "./period";
import { PeriodTabs } from "./period-tabs";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ // awaitを案つよ
  searchParams, 
}: {
  // Next 16 では searchParams は Promise（await してから読む）
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  // 集計対象の期間（今日を含む直近N日）。URL の ?period= から決める
  const periodDays = parsePeriod((await searchParams).period);
  const today = startOfUTCDay(new Date());
  const periodStart = new Date(today);
  periodStart.setUTCDate(periodStart.getUTCDate() - (periodDays - 1));

  const [periodLogs, allDates] = await Promise.all([
    // 期間内のログ（感情の内訳と記録日数に使う）
    prisma.log.findMany({
      where: { userId, loggedDate: { gte: periodStart } },
      select: { emotion: { select: { code: true, label: true } } },
    }),
    // 連続記録は期間に関係なく「今日から遡って」数えるので全件の日付が要る
    prisma.log.findMany({
      where: { userId },
      select: { loggedDate: true },
      orderBy: { loggedDate: "desc" },
    }),
  ]);

  const counts = countByEmotion(
    periodLogs.map((log) => ({
      emotionCode: log.emotion?.code ?? null,
      emotionLabel: log.emotion?.label ?? null,
    })),
  );
  const streak = calculateStreak(allDates.map((d) => d.loggedDate));

  // 件数の多い順に並んでいるので、先頭が「多い感情」
  const topEmotion = counts[0];
  const topEmotionUI = (topEmotion && EMOTION_UI[topEmotion.code]) || EMOTION_FALLBACK;

  return (
    <AppShell
      header={
        <header className="px-6 pt-6 pb-4">
          <h1 className="font-heading text-xl font-bold text-foreground">感情ログ</h1>
          <p className="mt-1 text-xs text-muted-foreground">直近{periodDays}日間</p>
        </header>
      }
    >
      <div className="flex flex-col gap-5 px-6 py-5">
        <PeriodTabs current={periodDays} />

        {/* 記録日数 / 多い感情 / 連続記録 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted px-3 py-4">
            <p className="font-accent text-2xl font-bold text-foreground">{periodLogs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">記録日数</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted px-3 py-4">
            {topEmotion ? (
              <topEmotionUI.icon className="size-6" style={{ color: topEmotionUI.color }} />
            ) : (
              <span className="text-2xl text-muted-foreground">—</span>
            )}
            <p className="mt-1 text-xs text-muted-foreground">多い感情</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted px-3 py-4">
            <p className="font-accent text-2xl font-bold text-foreground">{streak}</p>
            <p className="mt-1 text-xs text-muted-foreground">連続記録</p>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">感情の内訳</h2>
          <EmotionBreakdown counts={counts} />
        </section>

        {/* AIインサイト（プレースホルダー：未実装） */}
        <section className="rounded-2xl border border-dashed border-border px-4 py-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Sparkles className="size-4 text-primary" />
            AIインサイト
          </p>
          <p className="mt-1 text-xs text-muted-foreground">準備中です</p>
        </section>
      </div>
    </AppShell>
  );
}
