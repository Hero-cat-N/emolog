"use client";

import { useEffect, useState } from "react";

import { PageTabs } from "../_components/page-tabs";
import { LogForm } from "@/components/log-form";
import type { PostInput } from "@/lib/validations/post";

export default function Post() {
  // ヘッダーの日付。SSR とクライアントで差が出ないよう mount 後にセットする
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(
      new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(new Date())
    );
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold">今日の記録</h2>
          <span className="text-sm text-muted-foreground">{dateLabel}</span>
        </header>

        <PageTabs />

        <LogForm
          defaultValues={{ today: "", good: "", tomorrow: "", bad: "", mood: "normal" }}
          submitLabel="保存する"
          submittingLabel="保存中…"
          onSubmit={async (data: PostInput) => {
            const res = await fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!res.ok) return "保存に失敗しました";
          }}
        />
      </div>
    </div>
  );
}
