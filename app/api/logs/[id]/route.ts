import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize";
import { createClient } from "@/lib/supabase/server";

// TODO(human): PATCH ハンドラ（更新用）
// app/api/logs/route.ts の POST とほぼ同じ形。違いは create ではなく update ということ。
// 1. request.json() でbodyを受け取り、postSchema.safeParse で検証する（POSTと同じ）
// 2. mood(code) から Emotion を検索する（POSTと同じ: prisma.emotion.findUnique）
// 3. prisma.log.update({ where: { id: BigInt(id) }, data: { ... } }) で更新する
//    didToday/goodThing/badThing/tomorrowPlan/emotionId を更新すること。
//    loggedDate（記録日）はこの画面のUIに存在しないので、更新データに含めず元の値のまま残すこと
// 4. 成功したら toJsonSafe(log) を 200 で返す。失敗したら 500
//
// 判断が分かれるところ: POST は requireUserId() でログイン確認していますが、
// 今の DELETE ハンドラ（このファイルの下）には無く、統一されていません。
// PATCH にも requireUserId() を入れるかどうかは、あなたの判断でOKです
// （このアプリは個人利用前提なので今は無くても動きますが、入れておくと安全です）

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
    // 2. mood(code) から Emotion を検索する（POSTと同じ: prisma.emotion.findUnique）
    const emotion = await prisma.emotion.findUnique({ where: { code: mood } });

    // 3. prisma.log.update({ where: { id: BigInt(id) }, data: { ... } }) で更新する
    //    didToday/goodThing/badThing/tomorrowPlan/emotionId を更新すること。
    //    loggedDate（記録日）はこの画面のUIに存在しないので、更新データに含めず元の値のまま残すこと
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
