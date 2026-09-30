"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Ellipsis, Share2, SquarePen, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

// 純粋なヘルパー（LogView 型 / EMOTION_UI / formatLoggedDate 等）は log-card-utils.ts にある。
// Server Component から使うものを "use client" のこのファイルに置くと呼び出せなくなるため分離した。
import {
  EMOTION_FALLBACK,
  EMOTION_UI,
  formatLoggedDate,
  type LogView,
} from "./log-card-utils";

// ヘッダー右側の四角いアイコンボタン（34×34）
const iconButton =
  "flex size-8.5 items-center justify-center rounded-[10px] bg-muted text-ink-soft transition-colors duration-150 hover:bg-accent";

// ── 詳細のヘッダー：日付 + 編集/メニュー ──
// SP では AppShell のページヘッダーに、lg では詳細ペインの上端に置く（中身は同じ）
export function LogDetailHeader({ log }: { log: LogView }) {
  const { ymd, weekday } = formatLoggedDate(log.loggedDate);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-heading text-[14.5px] leading-tight font-bold text-foreground lg:text-[15px]">
          {ymd}
        </p>
        <p className="text-[11px] text-muted-foreground">{weekday}</p>
      </div>
      <div className="flex gap-1.5">
        <Link href={`/logs/${log.id}/edit`} aria-label="編集" className={iconButton}>
          <SquarePen className="size-4" strokeWidth={1.8} />
        </Link>
        {/* メニューは未実装 */}
        <span aria-label="メニュー" className={cn(iconButton, "opacity-50")}>
          <Ellipsis className="size-4" strokeWidth={1.8} />
        </span>
      </div>
    </div>
  );
}

// ── 詳細の本体 ──
// SP: 本文 → AI列 → 前日/翌日 の縦積み
// lg: 左に「本文 + 前日/翌日」、右に AI列(300px) を全高で。
//     HTML の順番は SP のまま、grid の row/col 指定だけで位置を入れ替える
export function LogDetailBody({
  log,
  older,
  newer,
}: {
  log: LogView;
  older: LogView | null;
  newer: LogView | null;
}) {
  return (
    <div className="grid flex-1 bg-card lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[1fr_auto]">
      <div className="lg:col-start-1 lg:row-start-1 lg:border-r lg:border-line">
        <EmotionBanner log={log} />

        {/* タグ。「＋タグを追加」は編集画面のタグ欄へ */}
        <div className="flex flex-wrap gap-1.75 border-b border-line px-5 py-3.25 lg:px-7">
          {log.tags.map((name) => (
            <span key={name} className="rounded-full bg-muted px-3 py-1 text-xs text-ink-soft">
              {name}
            </span>
          ))}
          <Link
            href={`/logs/${log.id}/edit`}
            className="rounded-full border border-dashed border-[#D8CDBD] bg-card px-3 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-accent"
          >
            ＋タグを追加
          </Link>
        </div>

        {/* 本文4項目 */}
        <LogSection label="今日やったこと" value={log.didToday} />
        <LogSection label="良かったこと" value={log.goodThing} />
        <LogSection label="モヤったこと" value={log.badThing} />
        <LogSection label="明日やること" value={log.tomorrowPlan} />
      </div>

      <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <LogAiPanel logId={log.id} />
      </aside>

      {/* 前日 / 翌日 */}
      <nav className="flex border-t border-line lg:col-start-1 lg:row-start-2 lg:border-r">
        <NeighborLink side="older" log={older} />
        <div className="w-px bg-border" />
        <NeighborLink side="newer" log={newer} />
      </nav>
    </div>
  );
}

// 感情バナー：ティントの丸 + 感情名
function EmotionBanner({ log }: { log: LogView }) {
  const emotion = (log.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;

  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-4.5 lg:px-7">
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full lg:size-12.5"
        style={{ backgroundColor: emotion.tint }}
      >
        <emotion.icon className="size-6" style={{ color: emotion.color }} />
      </span>
      <div>
        <p className="text-[15px] font-bold text-foreground">{log.emotionLabel ?? "未設定"}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          自動判定 · <span className="text-accent-foreground">手動で変更する</span>
        </p>
      </div>
    </div>
  );
}

// 本文4項目の1ブロック。値が空なら「記録なし」を薄く出す
function LogSection({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-line px-5 py-3.75 lg:px-7">
      <p className="mb-1.5 text-[10.5px] font-bold text-muted-foreground">{label}</p>
      {value ? (
        <p className="text-[13px] leading-[1.8] text-foreground lg:text-[13.5px]">{value}</p>
      ) : (
        <p className="text-[13px] text-muted-foreground italic lg:text-[13.5px]">記録なし</p>
      )}
    </div>
  );
}

// ── AI列（AI分析 + アクション） ──
// note: いまは中身が全ログ共通のプレースホルダー。AI分析に実データを入れる段階で log を受け取る想定
export function LogAiPanel({ logId }: { logId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("このログを削除しますか?")) return;
    await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    router.push("/logs");
  }

  const outlineButton =
    "flex h-11 items-center justify-center gap-1.5 rounded-[10px] border bg-card text-[12.5px] text-ink-soft transition-colors duration-150 lg:h-10";

  return (
    <div>
      {/* AI分析（プレースホルダー：生成処理は未実装）。
          AI由来ブロックは常に accent 配色 + ✨ でラベリングする（design.md 6節） */}
      <div className="border-b border-line bg-accent px-5 py-4.5">
        <div className="mb-3 flex items-center gap-1.75">
          <span className="text-[13px] font-bold text-foreground">✨ AI 分析</span>
          <span className="rounded-full border border-[#F0C7B4] bg-card px-2 py-0.5 text-[9.5px] font-semibold text-accent-foreground">
            自動生成
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-[10px] bg-card px-3.25 py-2.75">
            <p className="mb-1.5 text-[10px] text-muted-foreground">感情キーワード</p>
            <p className="text-xs text-muted-foreground">まだ分析されていません</p>
          </div>
          <div className="rounded-[10px] bg-card px-3.25 py-2.75">
            <p className="mb-1.25 text-[10px] text-muted-foreground">ひとこと要約</p>
            <p className="text-xs text-muted-foreground">まだ生成されていません</p>
          </div>
          <div className="rounded-[10px] bg-card px-3.25 py-2.75">
            <p className="mb-1.25 text-[10px] text-muted-foreground">ブログ下書き</p>
            <p className="text-[12.5px] font-medium text-accent-foreground opacity-60">
              このログからブログ下書きを生成する →
            </p>
          </div>
        </div>
      </div>

      {/* アクション（シェア・コピーは未実装） */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="grid grid-cols-2 gap-2">
          <span className={cn(outlineButton, "opacity-50")}>
            <Share2 className="size-4" strokeWidth={1.8} /> SNS にシェア
          </span>
          <span className={cn(outlineButton, "opacity-50")}>
            <Copy className="size-4" strokeWidth={1.8} /> テキストをコピー
          </span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(outlineButton, "border-[#F0BDB4] text-[#C0392B] hover:bg-[#FBEAE7]")}
        >
          <Trash2 className="size-4" strokeWidth={1.8} /> このログを削除
        </button>
      </div>
    </div>
  );
}

function NeighborLink({ side, log }: { side: "older" | "newer"; log: LogView | null }) {
  const isNewer = side === "newer";
  const Chevron = isNewer ? ChevronRight : ChevronLeft;
  const base = cn(
    "flex min-w-0 flex-1 items-center gap-2 px-5 py-3.25 lg:px-7",
    isNewer && "flex-row-reverse text-right",
  );

  if (!log) {
    return (
      <div className={cn(base, "text-muted-foreground")}>
        <Chevron className="size-4 shrink-0 opacity-40" />
        <div>
          <p className="text-[10px]">{isNewer ? "翌日" : "前日"}</p>
          <p className="text-xs">記録なし</p>
        </div>
      </div>
    );
  }

  const emotion = (log.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;

  return (
    <Link href={`/logs/${log.id}`} className={cn(base, "transition-colors duration-150 hover:bg-muted")}>
      <Chevron className="size-4 shrink-0 text-ink-soft" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{formatLoggedDate(log.loggedDate).short}</p>
        <p className={cn("flex items-center gap-1 truncate text-xs text-foreground", isNewer && "justify-end")}>
          <emotion.icon className="size-3.5 shrink-0" style={{ color: emotion.color }} />
          {log.emotionLabel ?? "未設定"}
        </p>
      </div>
    </Link>
  );
}
