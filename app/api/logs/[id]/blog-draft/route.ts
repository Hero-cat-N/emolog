import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { toAnalyzeLogInput } from "@/lib/ai/analyze-log";
import { generateBlogDraft } from "@/lib/ai/blog-draft";
import { aiErrorStatus } from "@/lib/ai/gemini";
import { getRemainingAiUses, type AiUsageKind } from "@/lib/ai/usage";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// 「ブログ下書きを生成する」から呼ばれる。ログと AI 分析の結果からブログ下書きを作り、ai_summaries に保存して返す
export async function POST(_request: Request, context: RouteContext<"/api/logs/[id]/blog-draft">) {
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

  // 他人のログの下書きを作れないよう、userId でも絞り込む
  const log = await prisma.log.findFirst({
    where: { id: logId, userId },
    include: { emotion: true, tags: { include: { tag: true } }, aiSummary: true },
  });
  if (!log) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 下書きは分析結果(キーワード・要約)も材料にするので、先に分析してもらう。
  // ai_summaries の行は分析で作られるので、ここで新しく作ることはしない
  if (!log.aiSummary) {
    return NextResponse.json({ error: "not analyzed" }, { status: 409 });
  }

  // 1日の上限に達していたら Gemini を呼ばずに断る
  if ((await getRemainingAiUses(userId)) <= 0) {
    return NextResponse.json({ error: "daily_limit" }, { status: 429 });
  }

  try {
    const blogDraft = await generateBlogDraft(toAnalyzeLogInput(log), {
      keywords: log.aiSummary.keywords,
      summary: log.aiSummary.summary,
    });

    // 使用回数の記録も同じトランザクションにして、成功したときだけ数える
    const [summary] = await prisma.$transaction([
      prisma.aiSummary.update({ where: { logId }, data: { blogDraft } }),
      prisma.aiUsage.create({ data: { userId, kind: "blog_draft" satisfies AiUsageKind } }),
    ]);

    return NextResponse.json(toJsonSafe(summary), { status: 200 });
  } catch (error) {
    const status = aiErrorStatus(error);
    if (status) {
      return NextResponse.json({ error: "ai unavailable" }, { status });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to generate blog draft" }, { status: 500 });
  }
}
