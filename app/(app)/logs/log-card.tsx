import { ArrowRight, Copy, Ellipsis, Share2, Sparkles, SquarePen, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";

// サーバ(page.tsx)からクライアントに渡すログ1件の形。
// Prisma の Log をそのまま渡すと BigInt が混ざって渡せないので、必要な項目だけの素のオブジェクトにする
export type LogView = {
  id: string;
  loggedDate: Date;
  emotionCode: string | null;
  emotionLabel: string | null;
  didToday: string;
  goodThing: string;
  badThing: string | null;
  tomorrowPlan: string;
};

// 感情コードごとの表示設定。
// emoji は「感情そのもの」を表すコンテンツなので絵文字を使う（design.md 7節）。
// tint はカード上部の感情バッジ用の背景色。ベタ塗りせず感情色のティントにする（design.md 7節）。
export const EMOTION_UI: Record<string, { emoji: string; tint: string }> = {
  fun: { emoji: "😄", tint: "#E3F3EA" },
  normal: { emoji: "😐", tint: "#EFEBE4" },
  sad: { emoji: "😞", tint: "#E6ECF7" },
  frustrate: { emoji: "😤", tint: "#FBEEE7" },
  tired: { emoji: "😴", tint: "#EEEAF6" },
};
export const EMOTION_FALLBACK = { emoji: "🙂", tint: "#EFEBE4" };

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

// logged_date は日付のみの列。サーバのタイムゾーンで日付がずれないよう UTC で読む
export function formatLoggedDate(date: Date) {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const weekday = WEEKDAY[date.getUTCDay()];
  return {
    ymd: `${date.getUTCFullYear()}/${month}/${day}`,
    weekday: `${weekday}曜日`,
    short: `${month}/${day}（${weekday}）`,
  };
}

// 本文4項目の1ブロック。値が空なら「記録なし」を薄く出す
function LogSection({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-t border-border px-5 py-4">
      <p className="mb-1 text-xs font-bold text-muted-foreground">{label}</p>
      {value ? <p className="text-sm leading-relaxed text-foreground">{value}</p> : <p className="text-sm text-muted-foreground">記録なし</p>}
    </div>
  );
}

// ── スライドする部分（日付・感情・タグ・本文4項目）。日付ごとに中身が変わる ──
export function LogCard({ log }: { log: LogView }) {
  const emotion = (log.emotionCode && EMOTION_UI[log.emotionCode]) || EMOTION_FALLBACK;
  const { ymd, weekday } = formatLoggedDate(log.loggedDate);

  return (
    <article className="overflow-hidden rounded-[22px] border border-[#F0E7D8] bg-card shadow-[0_1px_3px_rgba(58,26,8,0.10)]">
      {/* ヘッダー：日付 + 操作アイコン */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="font-accent text-lg leading-none font-bold text-foreground">{ymd}</p>
          <p className="mt-1 text-xs text-muted-foreground">{weekday}</p>
        </div>
        <div className="flex items-center gap-1 text-[#6E5847]">
          <Button variant="ghost" size="icon-sm" aria-label="編集" disabled>
            <SquarePen />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="メニュー" disabled>
            <Ellipsis />
          </Button>
        </div>
      </div>

      {/* 感情 */}
      <div className="flex items-center gap-3 border-t border-border px-5 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl" style={{ backgroundColor: emotion.tint }}>
          {emotion.emoji}
        </span>
        <div>
          <p className="font-heading text-base font-bold text-foreground">{log.emotionLabel ?? "未設定"}</p>
          <p className="text-xs text-muted-foreground">
            自動判定・<span className="text-accent-foreground">手動で変更する</span>
          </p>
        </div>
      </div>

      {/* タグ（プレースホルダー：タグ機能は未実装） */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">
        <span className="inline-flex items-center rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground">＋タグを追加</span>
      </div>

      {/* 本文4項目 */}
      <LogSection label="今日やったこと" value={log.didToday} />
      <LogSection label="良かったこと" value={log.goodThing} />
      <LogSection label="モヤったこと" value={log.badThing} />
      <LogSection label="明日やること" value={log.tomorrowPlan} />
    </article>
  );
}

// ── 固定パネル（AI分析 + アクション）。スライドせず一番下に置きっぱなしにする ──
// note: いまは中身が全ログ共通のプレースホルダーなので固定でよい。
//       AI分析に実データを入れる段階で「表示中のログ」を受け取る形に戻す想定
export function LogCardPanel({ logId }: { logId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("このログを削除しますか?")) return;
    await fetch(`/api/logs/${logId}`, { method: "DELETE" });
    router.push("/logs");
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#F0E7D8] bg-card shadow-[0_1px_3px_rgba(58,26,8,0.10)]">
      {/* AI分析（プレースホルダー：生成処理は未実装）。
          AI由来ブロックは常に accent 配色 + ✨ でラベリングする（design.md 6節） */}
      <div className="bg-accent px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-accent-foreground" />
          <span className="font-heading text-sm font-bold text-accent-foreground">AI 分析</span>
          <Badge variant="outline" className="border-accent-foreground/30 bg-transparent text-accent-foreground">
            自動生成
          </Badge>
        </div>

        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-card p-3">
            <p className="mb-1 text-xs font-bold text-muted-foreground">感情キーワード</p>
            <p className="text-xs text-muted-foreground">まだ分析されていません</p>
          </div>
          <div className="rounded-xl bg-card p-3">
            <p className="mb-1 text-xs font-bold text-muted-foreground">ひとこと要約</p>
            <p className="text-xs text-muted-foreground">まだ生成されていません</p>
          </div>
          <div className="rounded-xl bg-card p-3">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-foreground opacity-60">
              このログからブログ下書きを生成する
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </div>

      {/* アクション（プレースホルダー：処理は未実装） */}
      <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
        <div className="flex gap-2">
          <Button variant="outline" className="h-11 flex-1 rounded-xl" disabled>
            <Share2 /> SNS にシェア
          </Button>
          <Button variant="outline" className="h-11 flex-1 rounded-xl" disabled>
            <Copy /> テキストをコピー
          </Button>
        </div>
        <Button variant="destructive" className="h-11 w-full rounded-xl" onClick={handleDelete}>
          <Trash2 /> このログを削除
        </Button>
      </div>
    </div>
  );
}
