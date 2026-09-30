import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { AppShell } from "../../_components/app-shell";
import { LogDetailHeader } from "../log-card";
import { parseId, type LogView } from "../log-card-utils";
import { LogsBrowser } from "../logs-browser";

export const dynamic = "force-dynamic";

// SP: 詳細だけを表示（ヘッダーナビは「一覧」がアクティブ）
// lg: /logs と同じ2ペインで、右ペインにこのログを表示（URL で詳細に直リンクできる）
export default async function LogDetailPage(props: PageProps<"/logs/[id]">) {
  const { id } = await props.params;
  const currentId = parseId(id);

  // 一覧ペインと前後の日への移動用に全件を取る（件数が少ない個人アプリ想定）
  const logs = await prisma.log.findMany({
    orderBy: [{ loggedDate: "asc" }, { id: "asc" }],
    // タグは中間テーブル(log_tags)越しなので、その先の tag まで include する
    include: { emotion: true, tags: { include: { tag: true } } },
  });

  const views: LogView[] = logs.map((log) => ({
    id: log.id.toString(),
    loggedDate: log.loggedDate,
    emotionCode: log.emotion?.code ?? null,
    emotionLabel: log.emotion?.label ?? null,
    didToday: log.didToday,
    goodThing: log.goodThing,
    badThing: log.badThing,
    tomorrowPlan: log.tomorrowPlan,
    tags: log.tags.map((logTag) => logTag.tag.name),
  }));

  const current = views.find((log) => log.id === currentId.toString());
  if (!current) notFound();

  return (
    <AppShell header={<LogDetailHeader log={current} />} paneLayout>
      {/* key: 前日/翌日で別IDに移ったとき、選択日などの state を作り直させる
          （同じページ間の移動だと Next.js はコンポーネントを使い回すため） */}
      <LogsBrowser key={current.id} logs={views} currentId={current.id} />
    </AppShell>
  );
}
