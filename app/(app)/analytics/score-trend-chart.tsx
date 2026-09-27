"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EMOTION_FALLBACK, EMOTION_UI } from "../logs/log-card-utils";
import type { ScorePoint } from "./score-series";

// 線の色はブランドオレンジ（Handoff 1c: 折れ線 #D85528 2.5〜3px）
const chartConfig = {
  score: { label: "感情スコア", color: "var(--brand)" },
} satisfies ChartConfig;

// 感情スコアの推移（折れ線）。点はその日の感情色で塗る。
// Recharts はブラウザで SVG を描き、ホバーでツールチップを出すので Client Component にする
export function ScoreTrendChart({ points }: { points: ScorePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border bg-card text-[13px] text-muted-foreground lg:h-55 lg:rounded-[14px]">
        この期間の記録はまだありません
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-3 lg:rounded-[14px] lg:px-4.5 lg:py-4">
      {/* ChartContainer は既定で aspect-video（16:9）なので、高さ固定に上書きする */}
      <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full lg:h-47.5">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          {/* 横のグリッド線だけ（#F0E7D8） */}
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={48} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value, _name, item) => {
                  const point = item.payload as ScorePoint;
                  return (
                    <span className="text-foreground">
                      {point.label}
                      <span className="ml-1.5 font-accent font-bold">{value}点</span>
                    </span>
                  );
                }}
              />
            }
          />
          <Line
            dataKey="score"
            type="monotone"
            stroke="var(--color-score)"
            strokeWidth={2.5}
            // 点：その日の感情色で塗った丸（白いフチで線から浮かせる）
            dot={({ cx, cy, payload, index }) => {
              const color = (EMOTION_UI[payload.code] ?? EMOTION_FALLBACK).color;
              return <circle key={index} cx={cx} cy={cy} r={4} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />;
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
