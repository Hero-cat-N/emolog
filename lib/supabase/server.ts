import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server Components / Route Handlers から呼ぶ用。
// Server Componentからのcookie書き込みは失敗する(Next.jsの仕様)ため、
// 呼び出し側でtry/catchするか、Route Handler/Server Actionから使う。
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentから呼ばれた場合はここに来るが、
            // proxy側でセッションを更新していれば実害はない
          }
        },
      },
    }
  );
}
