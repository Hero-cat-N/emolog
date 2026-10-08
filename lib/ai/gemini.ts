// Gemini の呼び出しをまとめたところ。モデル名・タイムアウト・再試行はここだけで管理し、
// analyze-log.ts(キーワード・要約) と blog-draft.ts(ブログ下書き) の両方から使う
import { ApiError, GoogleGenAI, type GenerateContentConfig } from "@google/genai";

// 無料枠で使えるモデル。2.5 系は新規ユーザーに提供終了。3.8 / 3.7 / 3.6 は混雑で503や無応答が
// 続いたため、応答が安定していた 3.5 を使う(2026-10-07 時点)
const MODEL = "gemini-3.5-flash";

// GEMINI_API_KEY は .env.local に置く。NEXT_PUBLIC_ を付けないのでブラウザには渡らない
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 無料枠のモデルは混雑で 503 がよく返るので、少し待って数回だけやり直す。
// 429(上限超え)は待っても回復しないのでやり直さない
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// 混雑時は返事が何分も返ってこないことがあるので、1回あたりの待ち時間に上限をつける。
// 超えたら AbortError が投げられる(タイムアウトは再試行しても待ち時間が増えるだけなので再試行しない)
const DEFAULT_TIMEOUT_MS = 25_000;

// プロンプトを送って、返ってきたテキストを返す。空の返事は例外にする
export async function generateText(
  prompt: string,
  { config, timeoutMs = DEFAULT_TIMEOUT_MS }: { config?: GenerateContentConfig; timeoutMs?: number } = {},
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { ...config, abortSignal: AbortSignal.timeout(timeoutMs) },
      });
      if (!response.text) throw new Error("Gemini returned an empty response");
      return response.text;
    } catch (error) {
      const isBusy = error instanceof ApiError && error.status === 503;
      if (!isBusy || attempt >= MAX_ATTEMPTS) throw error;
      // 2秒 → 4秒 と、やり直すたびに待ち時間を延ばす
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
}

// API ルートの catch で使う。Gemini 側の都合で失敗したときに返すステータスコードを決める
// (429: 無料枠の上限 / 503: 混雑 / 504: タイムアウト)。Gemini 由来でなければ null
export function aiErrorStatus(error: unknown): 429 | 503 | 504 | null {
  if (error instanceof ApiError && (error.status === 429 || error.status === 503)) {
    return error.status;
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return 504;
  }
  return null;
}
