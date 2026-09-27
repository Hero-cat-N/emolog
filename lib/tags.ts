import type { Prisma } from "@/lib/generated/prisma/client";

// ログに付いているタグを、names の内容に「まるごと置き換える」。
// 新規投稿(POST)でも編集(PATCH)でも同じ処理で済むように、差分ではなく全置き換えにしている。
// tx はトランザクション（ログの保存とタグの紐づけを「全部成功 or 全部なかったこと」にする）
export async function replaceLogTags(tx: Prisma.TransactionClient, userId: string, logId: bigint, names: string[]) {
  // 前後の空白を除き、重複を1つにまとめる（["FF14", " FF14 "] → ["FF14"]）
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];

  // 1. このログの今の紐づけを全部消す（0件でもエラーにならないので、新規投稿でもそのまま使える）
  await tx.logTag.deleteMany({ where: { logId } });

  // 2. 各タグ名について「無ければ作る・あれば取る」。
  //    upsert はタグ1個用なので、map で名前の数だけ呼び、Promise.all でまとめて待つ
  const tags = await Promise.all(
    uniqueNames.map((name) =>
      tx.tag.upsert({
        where: { userId_name: { userId: userId, name: name}},
        create: { userId: userId, name: name },
        update: {},
      }),
    ),
  )

  // 3. 取れたタグの id で、このログと紐づける（画面では名前、中間テーブルでは id で持つ）
  await tx.logTag.createMany({
  data: tags.map((tag) => ({ logId: logId, tagId: tag.id })),
  })
}
