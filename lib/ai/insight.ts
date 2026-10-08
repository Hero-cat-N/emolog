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

function formatScore(score: number | null) {
  return score === null ? "なし" : score.toFixed(1);
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
- 下の数字と要約に書かれていることだけを根拠にする。数字を言い換えたり、新しく計算したりしない
- 良かった点だけでなく、モヤっていた点や気分の変化にも触れる
- 最後の1文は、次の期間に向けた前向きなひとことにする
- 見出しや箇条書きは使わない

# 集計
記録日数: ${input.recordedDays}日 / ${input.periodDays}日
感情の内訳: ${emotions}
感情スコア(1〜5)の平均: ${formatScore(input.averageScore)}（前半 ${formatScore(input.firstHalfAverage)} → 後半 ${formatScore(input.secondHalfAverage)}）
よく付けたタグ: ${tags}

# 各日のひとこと要約（AI分析済みの日のみ）
${summaries}`;
}

export async function generateInsight(input: InsightInput): Promise<string> {
  const text = await generateText(buildInsightPrompt(input));
  return text.trim();
}
