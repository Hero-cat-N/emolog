// ログ1件を Gemini に渡して「感情キーワード」と「ひとこと要約」を作る。
// API ルートや画面からは analyzeLog() だけを使う。Gemini 自体の呼び出し方は gemini.ts にまとめてある
import { z } from "zod";
import { generateText } from "./gemini";

// AI に返してほしい形。この zod スキーマを JSON Schema に変換して Gemini に渡し、
// 返ってきた JSON もこのスキーマで検証する(形が崩れた応答を DB に入れないため)
const analysisSchema = z.object({
  keywords: z.array(z.string()).min(1).max(5),
  summary: z.string().min(1),
});

export type LogAnalysis = z.infer<typeof analysisSchema>;

// AI に渡すログの中身。Prisma の Log をそのまま受け取らず、必要な項目だけにしておく
export type AnalyzeLogInput = {
  loggedDate: Date;
  emotionLabel: string | null;
  didToday: string;
  goodThing: string;
  badThing: string | null;
  tomorrowPlan: string;
  tags: string[];
};

// Prisma で emotion と tags.tag を include して取ったログを、AI に渡す形に変える。
// 分析・ブログ下書きの両方の API ルートで使う
export function toAnalyzeLogInput(log: {
  loggedDate: Date;
  emotion: { label: string } | null;
  didToday: string;
  goodThing: string;
  badThing: string | null;
  tomorrowPlan: string;
  tags: { tag: { name: string } }[];
}): AnalyzeLogInput {
  return {
    loggedDate: log.loggedDate,
    emotionLabel: log.emotion?.label ?? null,
    didToday: log.didToday,
    goodThing: log.goodThing,
    badThing: log.badThing,
    tomorrowPlan: log.tomorrowPlan,
    tags: log.tags.map((logTag) => logTag.tag.name),
  };
}

function buildPrompt(log: AnalyzeLogInput): string {
  return `以下はゲームプレイ日記です。やったこと、良かったこと、モヤったこと、タグの内容から、「ひとこと要約」として40字以内にまとめてほしい。「感情キーワード」はまとめた内容から「達成感」などの名詞として1～5個ほど設定してほしい。良かった感情だけでなく、モヤった感情もキーワードに含めてほしい。

  気分: ${log.emotionLabel ?? "未選択"}
  やったこと: ${log.didToday}
  良かったこと: ${log.goodThing}
  モヤったこと: ${log.badThing ?? "なし"}
  タグ： ${log.tags}
  `
}

export async function analyzeLog(log: AnalyzeLogInput): Promise<LogAnalysis> {
  // タイムアウト・503の再試行は generateText の中でやる
  const text = await generateText(buildPrompt(log), {
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(analysisSchema),
    },
  });

  // JSON として壊れている / スキーマに合わない場合は例外にする
  return analysisSchema.parse(JSON.parse(text));
}
