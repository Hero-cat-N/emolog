// 「今日から何日連続で記録があるか」を計算する専用ファイル。
// ダッシュボード(page.tsx)から呼ばれる純粋関数（DBにもブラウザにも依存しない）

// 2つの日付が「UTCで何日離れているか」を返す。
// loggedDate は日付のみの列（@db.Date）なので、既存の formatLoggedDate 等と同じく UTC で比較する
function diffInUTCDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((utcA - utcB) / MS_PER_DAY);
}

// 「今日から遡って何日連続で記録があるか」を計算する。
// loggedDates は新しい順（今日に近い方が先頭）で渡ってくる前提。
export function calculateStreak(loggedDates: Date[]): number {
  if (loggedDates.length === 0) return 0;

  let streak = 1;
  for (let i = 0; i < loggedDates.length - 1; i++) {
    const diff = diffInUTCDays(loggedDates[i], loggedDates[i + 1]);
    if (diff !== 1) break;
    streak++;
  }

  return streak;
}
