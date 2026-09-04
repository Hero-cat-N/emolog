// サーバ / クライアント両方から使える純粋なヘルパー。
// log-card.tsx は "use client" なので、そこに置いた関数は Server Component から呼べない。
// Server Component（例: logs/[id]/page.tsx）でも使うものはここに置く。

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
