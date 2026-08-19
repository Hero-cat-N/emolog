// JSON.stringifyはBigInt型を扱えないため、レスポンスとして返す前に文字列へ変換する
export function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? val.toString() : val))
  );
}
