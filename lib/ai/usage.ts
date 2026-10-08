// AI生成(分析・ブログ下書き)の回数制限。
// Gemini の無料枠は APIキー全体で共有なので、1人が使い切ってほかのユーザーが使えなくならないよう、
// ユーザーごとに「日本時間の今日」の成功回数を ai_usages で数えて制限する
import { prisma } from "@/lib/prisma";

// 分析・ブログ下書き・インサイトを合わせた、1ユーザー1日あたりの上限
export const DAILY_AI_LIMIT = 3;

export type AiUsageKind = "analyze" | "blog_draft" | "insight";

// 日本時間で「今日」が始まった瞬間(= 日本時間の 0:00)を Date で返す。
// サーバーは UTC で動くことが多いので、サーバーの時計の「今日」をそのまま使うと朝9時に日付が変わってしまう
export function startOfTodayInJapan(now: Date = new Date()): Date {
  // 日本は常に UTC+9(サマータイムなし)
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  // 9時間進めた時刻の「UTCの年月日」= 日本時間の年月日
  const japanNow = new Date(now.getTime() + JST_OFFSET_MS);
  const japanMidnightAsUtc = Date.UTC(
    japanNow.getUTCFullYear(),
    japanNow.getUTCMonth(),
    japanNow.getUTCDate(),
  );
  // 「日本時間の0:00」を本当の時刻に戻すため、9時間戻す
  return new Date(japanMidnightAsUtc - JST_OFFSET_MS);
}

// 今日あと何回使えるか(0 以上)
export async function getRemainingAiUses(userId: string): Promise<number> {
  const used = await prisma.aiUsage.count({
    where: { userId, createdAt: { gte: startOfTodayInJapan() } },
  });
  return Math.max(DAILY_AI_LIMIT - used, 0);
}
