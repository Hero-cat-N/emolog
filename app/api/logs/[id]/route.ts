import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";
import { replaceLogTags } from "@/lib/tags";

async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function PATCH(request: Request, context: RouteContext<"/api/logs/[id]">) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const { today, good, tomorrow, bad, mood, tags } = parsed.data;
  const { id } = await context.params;
  try {
    const emotion = await prisma.emotion.findUnique({ where: { code: mood } });

    // loggedDate（記録日）はこの画面のUIに存在しないので、更新データに含めず元の値のまま残す
    // ログの更新とタグの付け替えを1つのトランザクションにまとめる
    const log = await prisma.$transaction(async (tx) => {
      // id だけだと他人のログも更新できてしまうので、userId もセットで絞り込む
      const updated = await tx.log.update({
        where: { id: BigInt(id), userId },
        data: {
          didToday: today,
          goodThing: good,
          tomorrowPlan: tomorrow,
          badThing: bad,
          emotionId: emotion?.id,
        },
      });
      await replaceLogTags(tx, userId, updated.id, tags);
      return updated;
    });

    return NextResponse.json(toJsonSafe(log), { status: 200 });
  } catch (error) {
    // 条件に合う行が無い = 存在しないか他人のログ。どちらかは区別せず「見つからない」で返す
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to update log" }, { status: 500 });
  }
}

// DELETE /api/logs/[id]：ログを1件削除する（タグの紐づけ・AI分析は onDelete: Cascade で一緒に消える）
export async function DELETE(_request: Request, context: RouteContext<"/api/logs/[id]">) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // id だけだと他人のログも消せてしまうので、userId もセットで絞り込む
    await prisma.log.delete({ where: { id: BigInt(id), userId } });

    return NextResponse.json({ message: `Log ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: "failed to delete logs" }, { status: 500 });
  }
}
