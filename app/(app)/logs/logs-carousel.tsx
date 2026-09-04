"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { LogCard, LogCardPanel } from "./log-card";
import {
  EMOTION_FALLBACK,
  EMOTION_UI,
  formatLoggedDate,
  type LogView,
} from "./log-card-utils";

// logs は「古い→新しい」の順で渡ってくる前提（page.tsx で loggedDate 昇順に取得）
export function LogsCarousel({ logs }: { logs: LogView[] }) {
  // 何枚目を表示しているか。最初は一番新しい記録（＝配列の末尾）を出す
  const [index, setIndex] = useState(logs.length - 1);
  const safeIndex = Math.min(index, logs.length - 1);

  const older = logs[index - 1]; // 1つ古い記録（左ボタンで戻る）。無ければ undefined
  const newer = logs[index + 1]; // 1つ新しい記録（右ボタンで進む）。無ければ undefined

  return (
    <div>
      {/* ① 窓：はみ出したカードを隠す */}
      <div className="overflow-hidden">
        {/* ② トラック：カードを横一列に並べ、index に応じてまとめて左へずらす。
            transition-transform が付いているので translateX が変わると勝手にスライドする */}
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {logs.map((log) => (
            // ③ 1枚の幅を親いっぱい(w-full)に固定して横に積む。shrink-0 で縮ませない
            <div key={log.id} className="w-full shrink-0">
              <LogCard log={log} />
            </div>
          ))}
        </div>
      </div>

      {/* スライドしない固定パネル（AI分析 + アクション） */}
      <div className="mt-3">
        <LogCardPanel logId={logs[safeIndex].id} />
      </div>

      {/* 最下部の前へ／次へ */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <NavButton side="older" log={older} onClick={() => setIndex((i) => i - 1)} />
        <NavButton side="newer" log={newer} onClick={() => setIndex((i) => i + 1)} />
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {safeIndex + 1} / {logs.length}
      </p>
    </div>
  );
}

function NavButton({
  side,
  log,
  onClick,
}: {
  side: "older" | "newer";
  log: LogView | undefined;
  onClick: () => void;
}) {
  const emotion = (log?.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;
  const isNewer = side === "newer";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!log}
      aria-label={isNewer ? "新しい記録へ" : "古い記録へ"}
      className={`flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40 ${
        isNewer ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      {isNewer ? (
        <ChevronRight className="size-4 shrink-0 text-[#6E5847]" />
      ) : (
        <ChevronLeft className="size-4 shrink-0 text-[#6E5847]" />
      )}
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">
          {log ? formatLoggedDate(log.loggedDate).short : "これ以上ありません"}
        </span>
        <span className="block truncate text-sm text-foreground">
          {log ? `${emotion.emoji} ${log.emotionLabel ?? "未設定"}` : "—"}
        </span>
      </span>
    </button>
  );
}
