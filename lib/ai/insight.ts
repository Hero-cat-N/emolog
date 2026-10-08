// 分析画面の「インサイト（AI）」：期間内のログの傾向を短い文章にまとめる。
// 件数やスコアなどの数字はコード側で計算して渡し、AI には「その数字から何が言えるか」だけを書かせる
// (AI は数を数えるのが苦手なので、正確さが要る部分は任せない)。
// 日記の本文は送らず、ログごとの「ひとこと要約」を材料にして、送る量を小さく保つ
import { generateText } from "./gemini";

export type InsightInput = {
  periodDays: number;
  recordedDays: number;
  emotionCounts: { label: string; count: number }[];
  // 感情スコア(1〜5)の平均。期間の前半と後半に分けて、上向き/下向きを見られるようにする
  averageScore: number | null;
  firstHalfAverage: number | null;
  secondHalfAverage: number | null;
  topTags: { name: string; count: number }[];
  // AI分析済みのログだけ。日付の古い順
  summaries: { date: string; summary: string; keywords: string[] }[];
};

// 感情スコア(楽しい5 / 普通3 / 疲れ2 / 悲しい・イライラ1)の平均を、気分の言葉に置き換える。
// 数字のまま渡すと AI が「平均3.2」のようにそのまま書いてしまうので、言葉だけを渡す
export function describeMood(score: number | null): string {
  if (score === null) return "記録なし";
  if (score >= 3.5) return "楽しい寄りの気分";
  if (score >= 2.0) return "落ち着いた（ふつう寄りの）気分";
  return "疲れ・モヤモヤ寄りの気分";
}

function buildInsightPrompt(input: InsightInput): string {
  const emotions =
    input.emotionCounts.map((e) => `${e.label} ${e.count}回`).join("、") || "記録なし";
  const tags = input.topTags.map((t) => `${t.name}(${t.count}回)`).join("、") || "なし";
  const summaries =
    input.summaries
      .map((s) => `- ${s.date}: ${s.summary}（${s.keywords.join("、")}）`)
      .join("\n") || "なし";

  return `以下はゲームプレイ日記アプリの、直近${input.periodDays}日間の集計です。
この期間の気分や感情の傾向を、本人に語りかけるように2〜3文（120〜180字）でまとめてください。

# 書き方
- 下の集計と要約に書かれていることだけを根拠にする。新しく計算したりしない
- 気分は「楽しい寄りの気分」などの言葉で表し、スコアの数字は文章に出さない
- 良かった点だけでなく、モヤっていた点や気分の変化にも触れる
- 最後の1文は、次の期間に向けた前向きなひとことにする
- 見出しや箇条書きは使わない

# 集計
記録日数: ${input.recordedDays}日 / ${input.periodDays}日
感情の内訳: ${emotions}
期間全体の気分: ${describeMood(input.averageScore)}
気分の変化: 前半は${describeMood(input.firstHalfAverage)} → 後半は${describeMood(input.secondHalfAverage)}
よく付けたタグ: ${tags}

# 各日のひとこと要約（AI分析済みの日のみ）
${summaries}`;
}

export async function generateInsight(input: InsightInput): Promise<string> {
  const text = await generateText(buildInsightPrompt(input));
  return text.trim();
}
