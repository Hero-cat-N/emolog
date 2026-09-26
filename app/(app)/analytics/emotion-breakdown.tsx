import { EMOTION_FALLBACK, EMOTION_UI } from "../logs/log-card-utils";
import type { EmotionCount } from "./count-by-emotion";

// 感情内訳の横棒グラフ。ライブラリを使わず、div の幅(%)だけで棒を表現する
export function EmotionBreakdown({ counts }: { counts: EmotionCount[] }) {
  const total = counts.reduce((sum, c) => sum + c.count, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">この期間の記録はまだありません</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {counts.map((c) => {
        const emotion = EMOTION_UI[c.code] || EMOTION_FALLBACK;
        const percent = Math.round((c.count / total) * 100);

        return (
          <li key={c.code} className="flex items-center gap-3">
            <span className="flex w-20 shrink-0 items-center gap-1.5 text-sm text-foreground">
              <emotion.icon className="size-4" style={{ color: emotion.color }} />
              {c.label}
            </span>
            {/* 棒の土台（全幅）の中に、割合ぶんの幅だけ色を塗った棒を置く */}
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: emotion.color }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-accent text-sm text-muted-foreground">
              {c.count}件
            </span>
          </li>
        );
      })}
    </ul>
  );
}
