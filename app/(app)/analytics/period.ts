import { startOfUTCDay } from "@/lib/date";

// 分析画面の「集計期間」の定義。タブの表示と、URL（?period=）の読み取りの両方で使う

// 選べる期間の一覧（モックの「1週間 / 1ヶ月 / 3ヶ月」タブ）。days は今日を含む直近N日
export const PERIODS = [
  { days: 7, label: "1週間" },
  { days: 30, label: "1ヶ月" },
  { days: 90, label: "3ヶ月" },
] as const;

export type PeriodDays = (typeof PERIODS)[number]["days"];

export const DEFAULT_PERIOD: PeriodDays = 30;

// URL の ?period= の値（文字列 or 未指定）を、集計に使える日数に変換する。
// URL は誰でも手で書き換えられるので、どんな値が来ても PeriodDays を返すこと。
// 例: "90" → 90 / undefined → 30 / "abc" → ? / "7" → ?
export function parsePeriod(value: string | string[] | undefined): PeriodDays {
  const days = Number(value);
  const found = PERIODS.find((p) => p.days === days) // PERIODS

  // 見つかった
  if(found) {
    return found.days;
  } else {
    return DEFAULT_PERIOD;
  }
}

// 集計期間の初日（今日を含む直近N日の1日目）。loggedDate と比べるので UTC の暦日で作る。
// 分析画面と /api/insights の両方で同じ期間を使うためにここに置く
export function getPeriodStart(periodDays: PeriodDays, now: Date = new Date()): Date {
  const start = startOfUTCDay(now);
  start.setUTCDate(start.getUTCDate() - (periodDays - 1));
  return start;
}
