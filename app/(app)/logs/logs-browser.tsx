"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { LogDetailBody, LogDetailHeader } from "./log-card";
import { EMOTION_FALLBACK, EMOTION_UI, findNeighbors, type LogView } from "./log-card-utils";

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

// 一覧ペインのヘッダー。SP では AppShell のページヘッダーに、lg では一覧ペインの上端に置く
export function LogsListHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-heading text-[14.5px] font-bold text-foreground lg:text-[15px]">ログ一覧</h1>
      {/* 検索（形だけ・未実装） */}
      <span
        aria-label="検索"
        className="flex size-8.5 items-center justify-center rounded-[10px] bg-muted text-ink-soft opacity-50"
      >
        <Search className="size-4" strokeWidth={1.8} />
      </span>
    </div>
  );
}

// /logs と /logs/[id] の両方が使う「一覧ペイン + 詳細ペイン」。
// currentId なし（/logs）      : SP は一覧だけ。lg は一覧 + 選んだ日の詳細
// currentId あり（/logs/[id]） : SP は詳細だけ。lg は一覧（その日を選択済み）+ 詳細
export function LogsBrowser({
  logs,
  currentId,
  aiRemaining,
}: {
  logs: LogView[];
  currentId?: string;
  // 今日あと何回AI生成できるか（詳細のAI列に出す）
  aiRemaining: number;
}) {
  const now = new Date();
  const current = currentId ? logs.find((log) => log.id === currentId) : undefined;
  // 最初に選ぶ日：詳細を開いているならそのログの日（UTCで読んでローカル日付に直す）、無ければ今日
  const initial = current
    ? new Date(
        new Date(current.loggedDate).getUTCFullYear(),
        new Date(current.loggedDate).getUTCMonth(),
        new Date(current.loggedDate).getUTCDate(),
      )
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [mode, setMode] = useState<Mode>("day");
  const [visible, setVisible] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const [selected, setSelected] = useState(initial);

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
  const selLabel = `${selected.getMonth() + 1}/${selected.getDate()}（${WEEKDAYS[selected.getDay()]}）`;
  // selected はローカルの暦日から作った Date なので、URLに渡す文字列もローカルの getter で組み立てる
  const selectedDateParam = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;

  // 詳細ペインに出すログ：開いているIDが選択日にあればそれ、無ければ選択日の1件目
  const detailLog = selectedLogs.find((log) => log.id === currentId) ?? selectedLogs[0] ?? null;
  const neighbors = detailLog ? findNeighbors(logs, detailLog.id) : null;

  const shiftMonth = (delta: number) =>
    setVisible((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  // 記録が無い日の「追加する」ボタン。ホームの「今日はまだ記録がありません」と同じく発光させて気づかせる
  // (animate-glow は globals.css。動きを減らす設定の端末では止まる)
  const addLink = (
    <Link
      href={`/post?date=${selectedDateParam}`}
      className="flex animate-glow items-center justify-center rounded-xl border border-primary bg-card px-4 py-4 text-[13px] font-semibold text-accent-foreground transition-colors duration-150 hover:bg-accent"
    >
      この日の記録を追加する
    </Link>
  );

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* ── 一覧ペイン（lg では 360px 固定） ── */}
      <section
        className={cn(
          "flex-col lg:flex lg:w-90 lg:shrink-0 lg:border-r lg:border-line lg:bg-card",
          currentId ? "hidden" : "flex",
        )}
      >
        <div className="hidden border-b border-line px-5 py-4 lg:block">
          <LogsListHeader />
        </div>

        {/* 表示モード切り替え（形だけ） */}
        <div className="px-5 pt-4 lg:pt-3.5">
          <div className="flex gap-0.5 rounded-[10px] bg-muted p-0.75">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex-1 rounded-lg px-0.5 py-1.75 text-[11.5px] transition-colors duration-150",
                  mode === m.value ? "bg-card font-bold text-foreground shadow-card" : "text-muted-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* lg では cream の面に切り替えて、白いカードを浮かせる */}
        <div className="flex flex-1 flex-col gap-3.5 px-5 py-4 lg:mt-3.5 lg:border-t lg:border-line lg:bg-background">
          {mode !== "day" ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-[13px] text-muted-foreground">
              {mode === "month" ? "月ごと" : "週ごと"}の表示は準備中です
            </div>
          ) : (
            <div>
              {/* 月ナビ */}
              <div className="mb-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="前の月"
                  className="rounded-lg p-1 text-ink-soft hover:bg-muted"
                >
                  <ChevronLeft className="size-4" strokeWidth={1.8} />
                </button>
                <span className="text-[13.5px] font-bold text-foreground">
                  {visible.year}年 {visible.month + 1}月
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="次の月"
                  className="rounded-lg p-1 text-ink-soft hover:bg-muted"
                >
                  <ChevronRight className="size-4" strokeWidth={1.8} />
                </button>
              </div>

              {/* 曜日見出し + 日付グリッド */}
              <div className="grid grid-cols-7 gap-0.75 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-0.75 text-[10px] text-muted-foreground">
                    {w}
                  </div>
                ))}
                {weeks.flat().map((day) => {
                  const inMonth = day.getMonth() === visible.month;
                  const key = cellKey(day);
                  const dayLogs = logsByDay.get(key) ?? [];
                  const codes = [
                    ...new Set(dayLogs.map((l) => l.emotionCode).filter(Boolean)),
                  ].slice(0, 3) as string[];
                  const isSelected = key === selectedKey;
                  const isToday = key === todayKey;
                  // 記録がある日は、その日の気分（1件目）のティント背景 + 感情色の数字で塗る（design.md 7節）
                  const dayEmotion = codes[0] ? EMOTION_UI[codes[0]] : undefined;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelected(new Date(day.getFullYear(), day.getMonth(), day.getDate()))
                      }
                      style={
                        dayEmotion && inMonth
                          ? { backgroundColor: dayEmotion.tint, color: dayEmotion.color }
                          : undefined
                      }
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg py-1.25 text-[11.5px] transition-colors duration-150 hover:bg-muted",
                        !inMonth && "text-[#D8CDBD]",
                        dayEmotion && inMonth && "font-semibold",
                        isToday && !isSelected && "font-bold text-accent-foreground",
                        isSelected && "bg-accent font-bold text-accent-foreground ring-[1.5px] ring-brand",
                      )}
                    >
                      {day.getDate()}
                      <span className="flex h-1.25 items-center gap-0.5">
                        {codes.map((c) => (
                          <span
                            key={c}
                            className="size-1.25 rounded-full"
                            style={{ backgroundColor: EMOTION_COLOR[c] ?? "#8F8578" }}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 凡例 */}
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
                {EMOTION_LEGEND.map((e) => (
                  <span key={e.code} className="flex items-center gap-1">
                    <span className="size-1.75 rounded-full" style={{ backgroundColor: e.color }} />
                    {e.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* 選択した日のログ */}
          <h2 className="text-xs font-medium text-ink-soft">{selLabel}のログ</h2>
          {selectedLogs.length === 0 ? (
            addLink
          ) : (
            <div className="flex flex-col gap-2.5">
              {selectedLogs.map((log) => (
                <DayLogCard key={log.id} log={log} isOpen={log.id === detailLog?.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 詳細ペイン（lg では残り幅すべて） ── */}
      <section
        className={cn("min-w-0 flex-1 flex-col bg-card lg:flex", currentId ? "flex" : "hidden")}
      >
        {detailLog && neighbors ? (
          <>
            <div className="hidden border-b border-line px-7 py-4 lg:block">
              <LogDetailHeader log={detailLog} />
            </div>
            <LogDetailBody
              log={detailLog}
              older={neighbors.older}
              newer={neighbors.newer}
              aiRemaining={aiRemaining}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
            <p className="text-[13px] text-muted-foreground">{selLabel}の記録はありません</p>
            <div className="w-64">{addLink}</div>
          </div>
        )}
      </section>
    </div>
  );
}

// 選択日のログカード。lg で詳細ペインに出しているカードはブランド色の枠で強調する
function DayLogCard({ log, isOpen }: { log: LogView; isOpen: boolean }) {
  const emotion = (log.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;
  const date = new Date(log.loggedDate);
  const label = `${date.getUTCMonth() + 1}/${date.getUTCDate()}（${WEEKDAYS[date.getUTCDay()]}）`;

  return (
    <Link
      href={`/logs/${log.id}`}
      className={cn(
        "block rounded-xl border bg-card p-3 transition-colors duration-150 hover:bg-accent/40",
        isOpen && "lg:border-[1.5px] lg:border-brand",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: emotion.tint }}
        >
          <emotion.icon className="size-4.5" strokeWidth={1.8} style={{ color: emotion.color }} />
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-foreground">{log.didToday}</p>
      {log.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {log.tags.map((name) => (
            <span key={name} className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] text-accent-foreground">
              {name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
