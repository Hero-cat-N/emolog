import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startOfUTCDay } from "@/lib/date";
import { PageTabs } from "../_components/page-tabs";
import { SidebarNav } from "../_components/sidebar-nav";
import { EMOTION_FALLBACK, EMOTION_UI } from "../logs/log-card-utils";
import { calculateStreak } from "../streak";
import { countByEmotion } from "./count-by-emotion";
import { EmotionBreakdown } from "./emotion-breakdown";

export const dynamic = "force-dynamic";

// 集計対象の期間（今日を含む直近N日）。期間タブは未実装なので一旦固定
const PERIOD_DAYS = 30;

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const today = startOfUTCDay(new Date());
  const periodStart = new Date(today);
  periodStart.setUTCDate(periodStart.getUTCDate() - (PERIOD_DAYS - 1));

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
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md lg:flex lg:max-w-5xl lg:items-start lg:gap-6">
        <SidebarNav />

        <div className="flex-1 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <header className="px-6 pt-6 pb-4">
            <h1 className="font-heading text-xl font-bold text-foreground">感情ログ</h1>
            <p className="mt-1 text-xs text-muted-foreground">直近{PERIOD_DAYS}日間</p>
          </header>

          <div className="lg:hidden">
            <PageTabs />
          </div>

          <div className="flex flex-col gap-5 px-6 py-5">
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
        </div>
      </div>
    </div>
  );
}
