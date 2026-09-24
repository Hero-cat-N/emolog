// サーバ / クライアント両方から使える純粋なヘルパー。
// log-card.tsx は "use client" なので、そこに置いた関数は Server Component から呼べない。
// Server Component（例: logs/[id]/page.tsx）でも使うものはここに置く。

import { notFound } from "next/navigation";
import { Angry, Frown, Laugh, Meh, type LucideIcon } from "lucide-react";

// URLの id 部分（文字列）を BigInt に変換する。失敗したら 404 扱い。
// logs/[id]/page.tsx と logs/[id]/edit/page.tsx の両方が使うのでここに集約
export function parseId(id: string): bigint {
  try {
    return BigInt(id);
  } catch {
    notFound();
  }
}

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
// icon はlucideの線画アイコン（他のUI部品と統一するため絵文字から変更）。
// tint はカード上部の感情バッジ用の背景色。ベタ塗りせず感情色のティントにする（design.md 7節）。
export const EMOTION_UI: Record<string, { icon: LucideIcon; tint: string }> = {
  fun: { icon: Laugh, tint: "#E3F3EA" },
  normal: { icon: Meh, tint: "#EFEBE4" },
  sad: { icon: Frown, tint: "#E6ECF7" },
  frustrate: { icon: Angry, tint: "#FBEEE7" },
  // lucideに「疲れ」にぴったりの表情アイコンが無いため、一旦 Meh を流用
  tired: { icon: Meh, tint: "#EEEAF6" },
};
export const EMOTION_FALLBACK = { icon: Meh, tint: "#EFEBE4" };

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
