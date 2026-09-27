import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startOfUTCDay } from "@/lib/date";
import { AppShell, PageHeading, SectionLabel } from "../_components/app-shell";
import { EMOTION_FALLBACK, EMOTION_UI } from "../logs/log-card-utils";
import { calculateStreak } from "../streak";
import { countByEmotion } from "./count-by-emotion";
import { EmotionBreakdown } from "./emotion-breakdown";
import { ComingSoon } from "./panel";
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

  // 上段のメトリクス1枚ぶんの見た目（記録日数 / 多い感情 / 連続記録）
  const metricCard =
    "flex flex-col items-center justify-center rounded-[11px] border bg-card p-2.5 text-center lg:rounded-[14px] lg:p-4.5";
  const metricValue =
    "font-heading text-[19px] leading-tight font-bold text-foreground lg:text-[28px] lg:leading-[1.15] lg:font-extrabold";
  const metricLabel = "mt-0.5 text-[10px] text-muted-foreground lg:mt-1 lg:text-[11.5px]";

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <PageHeading>感情ログ</PageHeading>
          <span className="text-[11.5px] text-muted-foreground lg:text-[12.5px]">直近{periodDays}日間</span>
        </div>
      }
    >
      <div className="flex flex-col gap-4 px-5 py-4 lg:gap-5.5 lg:px-8 lg:py-6">
        <PeriodTabs current={periodDays} basePath="/analytics" />

        {/* 記録日数 / 多い感情 / 連続記録 */}
        <div className="grid grid-cols-3 gap-2 lg:gap-3.5">
          <div className={metricCard}>
            <p className={metricValue}>{periodLogs.length}</p>
            <p className={metricLabel}>記録日数</p>
          </div>
          <div className={metricCard}>
            {topEmotion ? (
              <topEmotionUI.icon className="size-6 lg:size-8" style={{ color: topEmotionUI.color }} />
            ) : (
              <span className={metricValue}>—</span>
            )}
            <p className={metricLabel}>多い感情</p>
          </div>
          <div className={metricCard}>
            <p className={metricValue}>{streak}</p>
            <p className={metricLabel}>連続記録</p>
          </div>
        </div>

        {/* SP: 縦積み。lg: 左に推移・内訳、右カラム（固定幅）にコンテンツ・インサイト */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4 lg:gap-5.5">
            <section>
              <SectionLabel>感情スコアの推移</SectionLabel>
              {/* 推移グラフは未実装（Recharts で実装予定） */}
              <ComingSoon className="h-26 bg-card lg:h-55" />
            </section>

            <section>
              <SectionLabel>感情の内訳</SectionLabel>
              <EmotionBreakdown counts={counts} />
            </section>
          </div>

          <div className="h-px bg-border lg:hidden" />

          <div className="flex flex-col gap-4 lg:gap-5.5">
            <section>
              <SectionLabel>よく遊んだコンテンツ</SectionLabel>
              {/* タグ機能の実装待ち */}
              <ComingSoon className="h-12 bg-card" />
            </section>

            {/* AIインサイト（プレースホルダー：未実装）。AI由来は ✨ + accent 配色 */}
            <section>
              <SectionLabel>インサイト（AI）</SectionLabel>
              <div className="flex gap-2.25 rounded-[11px] border border-accent-border bg-accent p-2.75 lg:rounded-[14px] lg:p-4">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-foreground" strokeWidth={1.8} />
                <div>
                  <p className="text-[12.5px] leading-normal text-foreground lg:text-[13.5px]">準備中です</p>
                  <p className="mt-0.75 text-[10px] text-muted-foreground">✨ AI が期間の傾向をまとめます</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
