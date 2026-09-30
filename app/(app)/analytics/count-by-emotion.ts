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
  // 空の棚を作る
  const map = new Map<string, EmotionCount>(); // これで中身が空のmapオブジェクトを作成できる

  // 1件ずつ見る
for (const entry of entries) {
  //   感情なしなら飛ばす
  if(entry.emotionCode === null ) continue;
  
  //   引き出しを開ける
  const existing = map.get(entry.emotionCode);
  
  //   あれば +1、なければ新しく作る（count: 1）
  if (existing) {
    existing.count++;
  } else {
    map.set(entry.emotionCode, {code:entry.emotionCode, label:entry.emotionLabel ?? entry.emotionCode, count: 1});
  }
}
// 中身を配列にして、多い順に並べて返す
  return [...map.values()].sort((a, b) => b.count - a.count);
}


