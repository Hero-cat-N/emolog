import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Ellipsis, SquarePen } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { LogCard, LogCardPanel } from "../log-card";
import {
  EMOTION_FALLBACK,
  EMOTION_UI,
  formatLoggedDate,
  type LogView,
} from "../log-card-utils";

export const dynamic = "force-dynamic";

function parseId(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    notFound();
  }
}

export default async function LogDetailPage(props: PageProps<"/logs/[id]">) {
  const { id } = await props.params;
  const currentId = parseId(id);

  // 前後の日への移動用に全件を取り、その中から現在のログを探す（件数が少ない個人アプリ想定）
  const logs = await prisma.log.findMany({
    orderBy: [{ loggedDate: "asc" }, { id: "asc" }],
    include: { emotion: true },
  });

  const index = logs.findIndex((log) => log.id === currentId);
  if (index === -1) notFound();

  const toView = (log: (typeof logs)[number]): LogView => ({
    id: log.id.toString(),
    loggedDate: log.loggedDate,
    emotionCode: log.emotion?.code ?? null,
    emotionLabel: log.emotion?.label ?? null,
    didToday: log.didToday,
    goodThing: log.goodThing,
    badThing: log.badThing,
    tomorrowPlan: log.tomorrowPlan,
  });

  const current = toView(logs[index]);
  const older = logs[index - 1] ? toView(logs[index - 1]) : null;
  const newer = logs[index + 1] ? toView(logs[index + 1]) : null;

  const { ymd, weekday } = formatLoggedDate(current.loggedDate);

  return (
    <main className="mx-auto w-full max-w-115 px-4 py-4">
      {/* 上部バー：一覧へ戻る / 日付 / 操作 */}
      <div className="flex items-center justify-between">
        <Link
          href="/logs"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> 一覧
        </Link>
        <div className="text-center">
          <p className="font-accent text-base leading-none font-bold text-foreground">{ymd}</p>
          <p className="mt-1 text-xs text-muted-foreground">{weekday}</p>
        </div>
        <div className="flex items-center gap-1 text-[#6E5847]">
          <Button variant="ghost" size="icon-sm" aria-label="編集" disabled>
            <SquarePen />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="メニュー" disabled>
            <Ellipsis />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <LogCard log={current} hideHeader />
      </div>
      <div className="mt-3">
        <LogCardPanel logId={current.id} />
      </div>

      {/* 前後の日へ */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <NeighborLink side="older" log={older} />
        <NeighborLink side="newer" log={newer} />
      </div>
    </main>
  );
}

function NeighborLink({ side, log }: { side: "older" | "newer"; log: LogView | null }) {
  const isNewer = side === "newer";
  const emotion = (log?.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;
  const base = `flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors ${
    isNewer ? "flex-row-reverse text-right" : "text-left"
  }`;
  const Chevron = isNewer ? ChevronRight : ChevronLeft;

  if (!log) {
    return (
      <div className={`${base} pointer-events-none opacity-40`}>
        <Chevron className="size-4 shrink-0" />
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">これ以上ありません</span>
          <span className="block truncate text-sm text-foreground">—</span>
        </span>
      </div>
    );
  }

  return (
    <Link href={`/logs/${log.id}`} className={`${base} hover:bg-muted`}>
      <Chevron className="size-4 shrink-0 text-[#6E5847]" />
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">
          {formatLoggedDate(log.loggedDate).short}
        </span>
        <span className="block truncate text-sm text-foreground">
          {emotion.emoji} {log.emotionLabel ?? "未設定"}
        </span>
      </span>
    </Link>
  );
}
