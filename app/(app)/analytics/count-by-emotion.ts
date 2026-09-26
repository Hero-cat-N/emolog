// 分析画面の「感情内訳」を作るための集計専用ファイル。
// DBにもブラウザにも依存しない純粋関数（streak.ts と同じ立ち位置）

// 集計の入力：ログ1件ぶん（page.tsx で必要な項目だけに詰め替えて渡す）
export type EmotionEntry = {
  emotionCode: string | null;
  emotionLabel: string | null;
};

// 集計の出力：感情1種類ぶんの件数
export type EmotionCount = {
  code: string;
  label: string;
  count: number;
};

// ログの配列を「感情ごとの件数」にまとめ、件数の多い順に並べて返す。
// 例: [{fun}, {sad}, {fun}] → [{ code: "fun", label: "楽しい", count: 2 }, { code: "sad", ... count: 1 }]
export function countByEmotion(entries: EmotionEntry[]): EmotionCount[] {
  // TODO(human): entries を感情コードごとに数えて、件数の多い順の EmotionCount[] を返す
  return [];
}
