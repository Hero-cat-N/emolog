// loggedDate（日付のみの列）まわりで複数箇所から使う、共通の日付ヘルパー。
// サーバのタイムゾーンで日付がずれないよう、常に UTC の暦日として扱う

export function startOfUTCDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
