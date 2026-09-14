import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];

// proxy.ts から呼ぶ。Supabaseのセッションをリフレッシュしつつ、
// 未ログインで保護ルートに来たら/loginへ、ログイン済みで/loginに来たら/postへ流す
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession ではなく getUser を使う(Supabaseサーバーに問い合わせてトークンを検証するため安全)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/post", request.url));
  }

  return response;
}
