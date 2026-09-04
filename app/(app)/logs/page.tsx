import { Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageTabs } from "../_components/page-tabs";
import { LogsCalendar } from "./logs-calendar";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { loggedDate: "asc" },
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
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h1 className="font-heading text-xl font-bold text-foreground">ログ一覧</h1>
          {/* 検索（形だけ・未実装） */}
          <Button
            variant="secondary"
            size="icon"
            aria-label="検索"
            className="size-10 rounded-xl"
            disabled
          >
            <Search />
          </Button>
        </div>

        <PageTabs />

        <div className="px-6 py-5">
          <LogsCalendar logs={views} />
        </div>
      </div>
    </div>
  );
}
