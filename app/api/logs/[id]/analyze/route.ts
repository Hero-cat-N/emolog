import { NextResponse } from "next/server";
import { ApiError } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { analyzeLog } from "@/lib/ai/analyze-log";

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

  try {
    const analysis = await analyzeLog({
      loggedDate: log.loggedDate,
      emotionLabel: log.emotion?.label ?? null,
      didToday: log.didToday,
      goodThing: log.goodThing,
      badThing: log.badThing,
      tomorrowPlan: log.tomorrowPlan,
      tags: log.tags.map((logTag) => logTag.tag.name),
    });

    // 初回は作成、再分析なら上書き(logId が @unique なので upsert できる)。
    // ブログ下書きは別ボタンで作るので、再分析では触らない
    const summary = await prisma.aiSummary.upsert({
      where: { logId },
      create: { logId, ...analysis, generatedAt: new Date() },
      update: { ...analysis, generatedAt: new Date() },
    });

    return NextResponse.json(toJsonSafe(summary), { status: 200 });
  } catch (error) {
    // 無料枠の上限(429)や Gemini 側の混雑(503)は、ユーザーに「時間をおいて」と伝えたいので区別して返す
    if (error instanceof ApiError && (error.status === 429 || error.status === 503)) {
      return NextResponse.json({ error: "ai busy" }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to analyze log" }, { status: 500 });
  }
}
