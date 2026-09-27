// 分析画面の「感情スコアの推移」グラフ用に、ログを「1日1点」の配列に変換する集計専用ファイル。
// DBにもブラウザにも依存しない純粋関数（count-by-emotion.ts と同じ立ち位置）

// 感情コード → スコア（1〜5点。高いほどポジティブ）。
// note: Handoff では emotions テーブルの score 列に持つ設計。いまはDBに列が無いのでコード側で持つ
export const EMOTION_SCORE: Record<string, number> = {
  fun: 5,
  normal: 3,
  tired: 2,
  sad: 1,
  frustrate: 1,
};

// 変換の入力：ログ1件ぶん（page.tsx で必要な項目だけに詰め替えて渡す）
export type ScoreEntry = {
  loggedDate: Date;
  emotionCode: string | null;
  emotionLabel: string | null;
};

// 変換の出力：グラフの点1つぶん
export type ScorePoint = {
  date: string; // 横軸のラベル（例: "6/10"）
  score: number; // 縦軸の値
  code: string; // 点の色を決めるための感情コード
  label: string; // ツールチップ表示用の感情名
};

// 日付の古い順に並んだログを、グラフの点の配列にする。
// 感情が未設定・スコア表に無い感情のログは点にできないので飛ばす
export function toScoreSeries(entries: ScoreEntry[]): ScorePoint[] {
  const points: ScorePoint[] = [];

  for (const entry of entries) {
    if (entry.emotionCode === null) continue;
    const score = EMOTION_SCORE[entry.emotionCode];
    if (score === undefined) continue;

    // loggedDate は日付のみの列なので UTC で読む（formatLoggedDate と同じ方針）
    const d = entry.loggedDate;
    points.push({
      date: `${d.getUTCMonth() + 1}/${d.getUTCDate()}`,
      score,
      code: entry.emotionCode,
      label: entry.emotionLabel ?? entry.emotionCode,
    });
  }

  return points;
}
