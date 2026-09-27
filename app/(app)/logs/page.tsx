import { prisma } from "@/lib/prisma";
import { AppShell } from "../_components/app-shell";
import { LogsBrowser, LogsListHeader } from "./logs-browser";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: [{ loggedDate: "asc" }, { id: "asc" }],
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

  // lg 以上は一覧ペインが自前のヘッダーを持つので、共通ヘッダーは SP だけ（paneLayout）
  return (
    <AppShell header={<LogsListHeader />} paneLayout>
      <LogsBrowser logs={views} />
    </AppShell>
  );
}
