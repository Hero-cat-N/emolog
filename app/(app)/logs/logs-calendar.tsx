"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { EMOTION_FALLBACK, EMOTION_UI, type LogView } from "./log-card";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 表示モード（切り替えは形だけ。月ごと/週ごとの中身は未実装）
const MODES = [
  { value: "month", label: "月ごと" },
  { value: "week", label: "週ごと" },
  { value: "day", label: "日/カレンダー" },
] as const;
type Mode = (typeof MODES)[number]["value"];

// カレンダーのドット / 凡例の色。globals.css の --emotion-* と対応
const EMOTION_LEGEND = [
  { code: "fun", label: "楽しい", color: "#2E9E6B" },
  { code: "normal", label: "普通", color: "#8F8578" },
  { code: "sad", label: "悲しい", color: "#5B7FC7" },
  { code: "frustrate", label: "イライラ", color: "#D85528" },
  { code: "tired", label: "疲れ", color: "#8B78C8" },
];
const EMOTION_COLOR: Record<string, string> = Object.fromEntries(
  EMOTION_LEGEND.map((e) => [e.code, e.color]),
);

// new Date(y, m, d) で作ったローカル日付のキー
const cellKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
// DB の Date（UTC 0時）のキー。日付ズレ防止に UTC で読む（log-card.formatLoggedDate と同じ方針）
const logKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;

// その月を含む週（日曜始まり）の配列を作る
function buildWeeks(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cursor = new Date(year, month, 1 - first.getDay()); // 週頭(日曜)まで戻す
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (week.some((d) => d.getMonth() === month && d.getDate() === daysInMonth)) break;
  }
  return weeks;
}

export function LogsCalendar({ logs }: { logs: LogView[] }) {
  const now = new Date();
  const [mode, setMode] = useState<Mode>("day");
  const [visible, setVisible] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  // 日付キー → その日のログ配列
  const logsByDay = useMemo(() => {
    const map = new Map<string, LogView[]>();
    for (const log of logs) {
      const k = logKey(new Date(log.loggedDate));
      const arr = map.get(k);
      if (arr) arr.push(log);
      else map.set(k, [log]);
    }
    return map;
  }, [logs]);

  const weeks = useMemo(
    () => buildWeeks(visible.year, visible.month),
    [visible.year, visible.month],
  );

  const todayKey = cellKey(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const selectedKey = cellKey(selected);
  const selectedLogs = logsByDay.get(selectedKey) ?? [];
  const selHeading = `${selected.getMonth() + 1}/${selected.getDate()}（${WEEKDAYS[selected.getDay()]}）のログ`;

  const shiftMonth = (delta: number) =>
    setVisible((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  return (
    <div>
      {/* 表示モード切り替え（形だけ） */}
      <div className="flex rounded-xl bg-muted p-1 text-sm">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 transition-colors",
              mode === m.value
                ? "bg-card font-medium text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode !== "day" ? (
        <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {mode === "month" ? "月ごと" : "週ごと"}の表示は準備中です
        </div>
      ) : (
        <>
          {/* 月ナビ */}
          <div className="mt-4 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="前の月"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="font-heading text-base font-bold">
              {visible.year}年 {visible.month + 1}月
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="次の月"
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* 曜日見出し */}
          <div className="mt-3 grid grid-cols-7 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 text-center text-sm">
            {weeks.flat().map((day) => {
              const inMonth = day.getMonth() === visible.month;
              const key = cellKey(day);
              const dayLogs = logsByDay.get(key) ?? [];
              const codes = [
                ...new Set(dayLogs.map((l) => l.emotionCode).filter(Boolean)),
              ].slice(0, 3) as string[];
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelected(new Date(day.getFullYear(), day.getMonth(), day.getDate()))
                  }
                  className="flex flex-col items-center gap-1 py-1.5"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      !inMonth && "text-muted-foreground/40",
                      isToday && !isSelected && "font-bold text-primary",
                      isSelected && "bg-accent font-bold text-accent-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {codes.map((c) => (
                      <span
                        key={c}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: EMOTION_COLOR[c] ?? "#8F8578" }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-muted-foreground">
            {EMOTION_LEGEND.map((e) => (
              <span key={e.code} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: e.color }} />
                {e.label}
              </span>
            ))}
          </div>
        </>
      )}

      <Separator className="my-5" />

      {/* 選択した日のログ */}
      <h2 className="mb-3 px-1 font-heading text-base font-bold">{selHeading}</h2>
      {selectedLogs.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">この日の記録はありません。</p>
      ) : (
        <div className="flex flex-col gap-3">
          {selectedLogs.map((log) => (
            <DayLogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayLogCard({ log }: { log: LogView }) {
  const emotion = (log.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;
  const date = new Date(log.loggedDate);
  const label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}（${WEEKDAYS[date.getUTCDay()]}）`;

  return (
    <Link
      href={`/logs/${log.id}`}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs text-accent-foreground">{label}</p>
        <span className="text-xl leading-none">{emotion.emoji}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{log.didToday}</p>
      {/* タグ（プレースホルダー：タグ機能は未実装。見た目確認用の固定値） */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">FF14</span>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">零式</span>
      </div>
    </Link>
  );
}
