"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { formatGeneratedAt, readAiErrorMessage, remainingUsesMessage } from "@/lib/ai/messages";
import type { PeriodDays } from "./period";

// 分析画面の「インサイト（AI）」。保存済みの傾向文を出し、ボタンで作る/作り直す。
// AI由来は ✨ + accent 配色（design.md 6節）
export function InsightCard({
  periodDays,
  insight,
  remaining,
  hasLogs,
}: {
  periodDays: PeriodDays;
  insight: { content: string; generatedAt: Date } | null;
  // 今日あと何回AI生成できるか（ログの分析・ブログ下書きと合計）
  remaining: number;
  // 期間内に記録があるか。無ければ材料が無いので作れない
  hasLogs: boolean;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const disabled = isGenerating || remaining <= 0 || !hasLogs;

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: periodDays }),
      });
      if (!res.ok) {
        toast.error(await readAiErrorMessage(res, "傾向のまとめに失敗しました"));
        return;
      }
      toast.success("期間の傾向をまとめました");
      router.refresh();
    } catch {
      toast.error("通信に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="rounded-[11px] border border-accent-border bg-accent p-2.75 lg:rounded-[14px] lg:p-4">
      <div className="flex gap-2.25">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-foreground" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          {insight ? (
            <>
              <p className="text-[12.5px] leading-[1.75] whitespace-pre-wrap text-foreground lg:text-[13.5px]">
                {insight.content}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                ✨ AI が直近{periodDays}日間の傾向をまとめました · {formatGeneratedAt(insight.generatedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[12.5px] leading-normal text-foreground lg:text-[13.5px]">
                {hasLogs ? "まだまとめていません" : "この期間の記録がまだありません"}
              </p>
              <p className="mt-0.75 text-[10px] text-muted-foreground">✨ AI が期間の傾向をまとめます</p>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={disabled}
        className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#F0C7B4] bg-card text-[12px] font-medium text-accent-foreground transition-colors duration-150 hover:bg-[#FDF6F2] disabled:opacity-60"
      >
        <Sparkles className="size-3.5" strokeWidth={1.8} />
        {isGenerating ? "まとめています…" : insight ? "もう一度まとめる" : "傾向をまとめる"}
      </button>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">{remainingUsesMessage(remaining)}</p>
    </div>
  );
}
