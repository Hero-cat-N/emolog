import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { aiErrorStatus } from "@/lib/ai/gemini";
import { generateInsight } from "@/lib/ai/insight";
import { getRemainingAiUses, type AiUsageKind } from "@/lib/ai/usage";
import { buildInsightInput } from "@/app/(app)/analytics/insight-input";
import { getPeriodStart, parsePeriod } from "@/app/(app)/analytics/period";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
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

  try {
    const content = await generateInsight(buildInsightInput(logs, periodDays));

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
