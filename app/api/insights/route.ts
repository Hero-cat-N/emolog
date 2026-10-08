import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { aiErrorStatus } from "@/lib/ai/gemini";
import { generateInsight, type InsightInput } from "@/lib/ai/insight";
import { getRemainingAiUses, type AiUsageKind } from "@/lib/ai/usage";
import { countByEmotion } from "@/app/(app)/analytics/count-by-emotion";
import { getPeriodStart, parsePeriod } from "@/app/(app)/analytics/period";
import { EMOTION_SCORE } from "@/app/(app)/analytics/score-series";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// 分析画面の「傾向をまとめる」から呼ばれる。期間内のログを集計して AI に傾向文を書かせ、insights に保存して返す
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 期間は分析画面のタブと同じ値(7/30/90)。それ以外が来たら既定値になる
  const body = await request.json().catch(() => null);
  const periodDays = parsePeriod(String(body?.period ?? ""));

  const logs = await prisma.log.findMany({
    where: { userId, loggedDate: { gte: getPeriodStart(periodDays) } },
    include: { emotion: true, tags: { include: { tag: true } }, aiSummary: true },
    orderBy: { loggedDate: "asc" },
  });
  // 材料が無いと AI が想像で書いてしまうので、記録が1件も無い期間は断る
  if (logs.length === 0) {
    return NextResponse.json({ error: "no_logs" }, { status: 409 });
  }

  // 1日の上限(分析・ブログ下書きと合計)に達していたら Gemini を呼ばずに断る
  if ((await getRemainingAiUses(userId)) <= 0) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }

  // ── 数字の集計はコードでやる(AI には計算させない) ──
  const scores = logs
    .map((log) => (log.emotion ? EMOTION_SCORE[log.emotion.code] : undefined))
    .filter((score): score is number => score !== undefined);
  const half = Math.ceil(scores.length / 2);

  const tagCounts = new Map<string, number>();
  for (const log of logs) {
    for (const { tag } of log.tags) tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
  }

  const input: InsightInput = {
    periodDays,
    recordedDays: logs.length,
    emotionCounts: countByEmotion(
      logs.map((log) => ({
        emotionCode: log.emotion?.code ?? null,
        emotionLabel: log.emotion?.label ?? null,
      })),
    ),
    averageScore: average(scores),
    firstHalfAverage: average(scores.slice(0, half)),
    secondHalfAverage: average(scores.slice(half)),
    topTags: [...tagCounts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    summaries: logs.flatMap((log) =>
      log.aiSummary
        ? [
            {
              date: log.loggedDate.toISOString().slice(0, 10),
              summary: log.aiSummary.summary,
              keywords: log.aiSummary.keywords,
            },
          ]
        : [],
    ),
  };

  try {
    const content = await generateInsight(input);

    // 同じ期間の傾向文は1つだけ持つ(作り直したら上書き)。使用回数の記録も同じトランザクションで
    const [insight] = await prisma.$transaction([
      prisma.insight.upsert({
        where: { userId_periodDays: { userId, periodDays } },
        create: { userId, periodDays, content, generatedAt: new Date() },
        update: { content, generatedAt: new Date() },
      }),
      prisma.aiUsage.create({ data: { userId, kind: "insight" satisfies AiUsageKind } }),
    ]);

    return NextResponse.json(toJsonSafe(insight), { status: 200 });
  } catch (error) {
    const status = aiErrorStatus(error);
    if (status) {
      return NextResponse.json({ error: "ai unavailable" }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to generate insight" }, { status: 500 });
  }
}
