import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { analyzeLog, toAnalyzeLogInput } from "@/lib/ai/analyze-log";
import { aiErrorStatus } from "@/lib/ai/gemini";
import { getRemainingAiUses, type AiUsageKind } from "@/lib/ai/usage";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// 「分析する」ボタンから呼ばれる。ログ1件を AI に分析させ、結果を ai_summaries に保存して返す
export async function POST(_request: Request, context: RouteContext<"/api/logs/[id]/analyze">) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let logId: bigint;
  try {
    logId = BigInt(id);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 他人のログを分析(= 他人の日記を AI に送信)できないよう、userId でも絞り込む
  const log = await prisma.log.findFirst({
    where: { id: logId, userId },
    include: { emotion: true, tags: { include: { tag: true } } },
  });
  if (!log) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 1日の上限に達していたら Gemini を呼ばずに断る
  if ((await getRemainingAiUses(userId)) <= 0) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }

  try {
    const analysis = await analyzeLog(toAnalyzeLogInput(log));

    // 初回は作成、再分析なら上書き(logId が @unique なので upsert できる)。
    // ブログ下書きは別ボタンで作るので、再分析では触らない。
    // 使用回数の記録も同じトランザクションにして、成功したときだけ数える
    const [summary] = await prisma.$transaction([
      prisma.aiSummary.upsert({
        where: { logId },
        create: { logId, ...analysis, generatedAt: new Date() },
        update: { ...analysis, generatedAt: new Date() },
      }),
      prisma.aiUsage.create({ data: { userId, kind: "analyze" satisfies AiUsageKind } }),
    ]);

    return NextResponse.json(toJsonSafe(summary), { status: 200 });
  } catch (error) {
    // 無料枠の上限(429)・混雑(503)・タイムアウト(504)は、ユーザーに「時間をおいて」と伝えたいので区別して返す
    const status = aiErrorStatus(error);
    if (status) {
      return NextResponse.json({ error: "ai unavailable" }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to analyze log" }, { status: 500 });
  }
}
