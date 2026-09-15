import { createBrowserClient } from "@supabase/ssr";

// Client Component から呼ぶ用(Google OAuthのリダイレクト開始などブラウザでしかできない処理に使う)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
