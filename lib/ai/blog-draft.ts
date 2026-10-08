// ログ1件(+ AI分析の結果)から、ブログ記事の下書きを作る。
// 分析(analyze-log.ts)と違って長い文章なので、JSON ではなくそのままのテキストで受け取る
import { generateText } from "./gemini";
import type { AnalyzeLogInput, LogAnalysis } from "./analyze-log";

// 長い文章を書かせるので、分析(25秒)より長めに待つ
const BLOG_TIMEOUT_MS = 45_000;

function buildBlogPrompt(log: AnalyzeLogInput, analysis: LogAnalysis): string {
  const date = log.loggedDate.toISOString().slice(0, 10);

  return `以下のゲームプレイ日記をもとに、ブログ記事の下書きを書いてください。

# 書き方
- 1行目に記事のタイトル、そのあとに本文
- 本文は400〜600字。「今日やったこと」「良かったこと」「モヤったこと」「明日やること」の流れで書く
- 一人称は「私」、です・ます調で、読んだ人がその日のプレイを想像できるように書く
- 日記に書かれていない出来事は付け足さない
- 見出しや箇条書きの記号(#, -, * など)は使わず、普通の文章で書く

# 日記（${date}）
気分: ${log.emotionLabel ?? "未選択"}
タグ: ${log.tags.length > 0 ? log.tags.join("、") : "なし"}
やったこと: ${log.didToday}
良かったこと: ${log.goodThing}
モヤったこと: ${log.badThing ?? "なし"}
明日やること: ${log.tomorrowPlan}

# AIによる分析
感情キーワード: ${analysis.keywords.join("、")}
ひとこと要約: ${analysis.summary}`;
}

export async function generateBlogDraft(
  log: AnalyzeLogInput,
  analysis: LogAnalysis,
): Promise<string> {
  const text = await generateText(buildBlogPrompt(log, analysis), { timeoutMs: BLOG_TIMEOUT_MS });
  return text.trim();
}
