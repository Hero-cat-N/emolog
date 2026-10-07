// ログ1件を Gemini に渡して「感情キーワード」と「ひとこと要約」を作る。
// AI の呼び出しはこのファイルだけに閉じ込めておき、API ルートや画面からは analyzeLog() だけを使う
// (あとで Gemini 以外に乗り換えるときも、直すのはここだけで済むようにする)
import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

// 無料枠で使えるモデル。2.5 系は新規ユーザーに提供終了しているので 3.8 を使う
const MODEL = "gemini-3.8-flash";

// GEMINI_API_KEY は .env.local に置く。NEXT_PUBLIC_ を付けないのでブラウザには渡らない
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

function buildPrompt(log: AnalyzeLogInput): string {
  return `以下はゲームプレイ日記です。やったこと、良かったこと、モヤったこと、タグの内容から、「ひとこと要約」として40字以内にまとめてほしい。「感情キーワード」はまとめた内容から「達成感」などの名詞として1～5個ほど設定してほしい。良かった感情だけでなく、モヤった感情もキーワードに含めてほしい。

  気分: ${log.emotionLabel ?? "未選択"}
  やったこと: ${log.didToday}
  良かったこと: ${log.goodThing}
  モヤったこと: ${log.badThing ?? "なし"}
  タグ： ${log.tags}
  `
}

// 無料枠のモデルは混雑で 503 がよく返るので、少し待って数回だけやり直す。
// 429(1日の上限超え)は待っても回復しないのでやり直さない
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export async function analyzeLog(log: AnalyzeLogInput): Promise<LogAnalysis> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: buildPrompt(log),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(analysisSchema),
        },
      });

      // response.text が空、または JSON として壊れている / スキーマに合わない場合は例外にする
      return analysisSchema.parse(JSON.parse(response.text ?? ""));
    } catch (error) {
      const isBusy = error instanceof ApiError && error.status === 503;
      if (!isBusy || attempt >= MAX_ATTEMPTS) throw error;
      // 2秒 → 4秒 と、やり直すたびに待ち時間を延ばす
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
}
