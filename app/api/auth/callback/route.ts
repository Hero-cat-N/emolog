import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Google OAuthの戻り先。Supabaseがこの ?code= 付きURLへリダイレクトしてくる
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 初回ログイン時などまだ public.users に行が無ければ作る
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: { id: data.user.id },
      });
      return NextResponse.redirect(`${origin}/post`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
