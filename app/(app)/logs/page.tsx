import { prisma } from "@/lib/prisma";
import { LogsCarousel } from "./logs-carousel";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { loggedDate: "asc" }, // 古い→新しい。カルーセルは末尾(最新)から表示する
    include: { emotion: true },
  });

  // クライアントコンポーネントには BigInt を渡せないので、必要な項目だけの
  // 素のオブジェクトに詰め替える（Date はそのまま渡せる）
  const views = logs.map((log) => ({
    id: log.id.toString(),
    loggedDate: log.loggedDate,
    emotionCode: log.emotion?.code ?? null,
    emotionLabel: log.emotion?.label ?? null,
    didToday: log.didToday,
    goodThing: log.goodThing,
    badThing: log.badThing,
    tomorrowPlan: log.tomorrowPlan,
  }));

  return (
    <main className="mx-auto w-full max-w-115 px-4 py-6">
      <h1 className="px-1 font-heading text-xl font-bold text-foreground">ログ一覧</h1>
      <p className="mt-1 mb-4 px-1 text-xs text-muted-foreground">
        ※ タグ・AI分析・シェア・削除は表示のみ（機能は準備中）
      </p>

      {views.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">まだ記録がありません。</p>
      ) : (
        <LogsCarousel logs={views} />
      )}
    </main>
  );
}
