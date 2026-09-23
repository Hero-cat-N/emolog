"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageTabs } from "../_components/page-tabs";
import { LogForm } from "@/components/log-form";
import type { PostInput } from "@/lib/validations/post";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// "2026-09-15" のような日付だけの文字列を、DBのloggedDate（UTC0時）と同じ形のDateにする
function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

// useSearchParams() を使うコンポーネントは Suspense で包む必要がある
// (ビルド時にNext.jsがこのページをCSR側にフォールバックできるようにするため)
export default function Post() {
  return (
    <Suspense fallback={null}>
      <PostForm />
    </Suspense>
  );
}

function PostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?date=2026-09-15 が付いていたら「その日の記録を追加する」画面、無ければ「今日の記録」画面
  const targetDate = useMemo(() => parseDateParam(searchParams.get("date")), [searchParams]);
  const isBackfill = targetDate !== null;

  // ヘッダーの日付。SSR とクライアントで差が出ないよう mount 後にセットする（今日の場合のみ）
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    if (isBackfill) return;
    setDateLabel(
      new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(new Date())
    );
  }, [isBackfill]);

  const backfillLabel = targetDate
    ? `${targetDate.getUTCMonth() + 1}/${targetDate.getUTCDate()}（${WEEKDAYS[targetDate.getUTCDay()]}）`
    : "";

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold">
            {isBackfill ? "記録を追加" : "今日の記録"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {isBackfill ? backfillLabel : dateLabel}
          </span>
        </header>

        <PageTabs />

        <LogForm
          defaultValues={{ today: "", good: "", tomorrow: "", bad: "", mood: "normal" }}
          submitLabel="保存する"
          submittingLabel="保存中…"
          cancelHref={isBackfill ? "/logs" : undefined}
          onSubmit={async (data: PostInput) => {
            const res = await fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                loggedDate: targetDate ? targetDate.toISOString() : undefined,
              }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => null);
              return typeof body?.error === "string" ? body.error : "保存に失敗しました";
            }

            if (isBackfill) {
              router.push("/logs");
            }
          }}
        />
      </div>
    </div>
  );
}
