import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";

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

  const { today, good, tomorrow, bad, mood } = parsed.data;
  const { id } = await context.params;
  try {
    const emotion = await prisma.emotion.findUnique({ where: { code: mood } });

    // loggedDate（記録日）はこの画面のUIに存在しないので、更新データに含めず元の値のまま残す
    const log = await prisma.log.update({
      where: { id: BigInt(id) },
      data: {
        didToday: today,
        goodThing: good,
        tomorrowPlan: tomorrow,
        badThing: bad,
        emotionId: emotion?.id,
      },
    });

    return NextResponse.json(toJsonSafe(log), { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed to update log" }, { status: 500 });
  }
}

// note: 「DELETE という名前の関数を作ると、Next.jsが [id] フォルダのURLで呼ばれたときに、この2つを自動で渡してくれる」という決まり文句
//note: 受付係の「窓口オープン」。「DELETEのお願いが来たらこの窓口ね」とNext.jsに登録してる部分
export async function DELETE(request: Request, context: RouteContext<"/api/logs/[id]">) {
  //note: const { id } = await context.params;
  const { id } = await context.params;

  try {
    //  受付が通訳（prisma）に「idが◯番のログ、DBから消しといて」と依頼。ここで初めてDBが実際に変更される
    await prisma.log.delete({ where: { id: BigInt(id) } });

    return NextResponse.json({ message: `Log ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "failed to delete logs" }, { status: 500 });
  }
}
