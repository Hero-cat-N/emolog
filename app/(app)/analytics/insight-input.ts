// 期間内のログから、AI インサイトに渡す集計（InsightInput）を作る。
// DBにもブラウザにも依存しない純粋関数（count-by-emotion.ts と同じ立ち位置）。
// /api/insights とデモデータ投入スクリプト(prisma/seed-demo.ts)の両方で使う
import type { InsightInput } from "@/lib/ai/insight";
import { countByEmotion } from "./count-by-emotion";
import { EMOTION_SCORE } from "./score-series";

// 入力：Prisma で emotion・tags.tag・aiSummary を include して、日付の古い順に取ったログ
export type InsightSourceLog = {
  loggedDate: Date;
  emotion: { code: string; label: string } | null;
  tags: { tag: { name: string } }[];
  aiSummary: { summary: string; keywords: string[] } | null;
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// 数字の集計はコードでやる（AI には計算させない）
export function buildInsightInput(logs: InsightSourceLog[], periodDays: number): InsightInput {
  const scores = logs
    .map((log) => (log.emotion ? EMOTION_SCORE[log.emotion.code] : undefined))
    .filter((score): score is number => score !== undefined);
  const half = Math.ceil(scores.length / 2);

  const tagCounts = new Map<string, number>();
  for (const log of logs) {
    for (const { tag } of log.tags) tagCounts.set(tag.name, (tagCounts.get(tag.name) ?? 0) + 1);
  }

  return {
    periodDays,
    recordedDays: logs.length,
    emotionCounts: countByEmotion(
      logs.map((log) => ({
        emotionCode: log.emotion?.code ?? null,
        emotionLabel: log.emotion?.label ?? null,
      })),
    ),
    averageScore: average(scores),
    firstHalfAverage: average(scores.slice(0, half)),
    secondHalfAverage: average(scores.slice(half)),
    topTags: [...tagCounts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    summaries: logs.flatMap((log) =>
      log.aiSummary
        ? [
            {
              date: log.loggedDate.toISOString().slice(0, 10),
              summary: log.aiSummary.summary,
              keywords: log.aiSummary.keywords,
            },
          ]
        : [],
    ),
  };
}
