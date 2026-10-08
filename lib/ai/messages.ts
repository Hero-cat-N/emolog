// AI 生成まわりで画面に出す文言・表示のヘルパー。ログ詳細(log-card.tsx)と分析画面(insight-card.tsx)で共有する。
// "use client" のコンポーネントから読むので、サーバー専用のもの(prisma など)は import しない

// /api/logs/[id]/analyze・blog-draft・/api/insights が失敗したときに、ステータスコードからユーザー向けの文言を決める
export function analyzeErrorMessage(status: number, fallback = "分析に失敗しました"): string {
  if (status === 429) return "無料枠の上限に達しました。時間をおいて試してください";
  if (status === 503) return "AIが混み合っています。少し待ってから試してください";
  if (status === 504) return "AIの応答が遅いため中断しました。少し待ってから試してください";
  if (status === 404) return "ログが見つかりませんでした";
  if (status === 409) return "先にAIで分析してください";
  return fallback;
}

// 失敗したレスポンスから文言を決める。同じステータスでも理由が複数あるもの
// (429: エモログの1日の回数制限 / Gemini の無料枠、409: 未分析 / 期間に記録なし)は body の error で区別する
export async function readAiErrorMessage(res: Response, fallback?: string): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body?.error === "daily_limit") return "今日のAI生成の回数を使い切りました。明日また使えます";
  if (body?.error === "no_logs") return "この期間の記録がまだありません";
  return analyzeErrorMessage(res.status, fallback);
}

// 生成日時の表示。サーバー描画(UTC)とブラウザ(JST)で表示がずれないよう、タイムゾーンを固定する
export function formatGeneratedAt(date: Date) {
  return new Date(date).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 残り回数の案内文
export function remainingUsesMessage(remaining: number) {
  return remaining > 0
    ? `AI生成は今日あと${remaining}回（分析・ブログ下書き・インサイトの合計）`
    : "今日のAI生成の回数を使い切りました。明日また使えます";
}
