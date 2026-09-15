import { NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // メール未登録かパスワード不一致かは区別せず、常に同じメッセージを返す(アカウント存在の推測を防ぐ)
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
  }

  // 初回ログイン時などまだ public.users に行が無ければ作る
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {},
    create: { id: data.user.id },
  });

  return NextResponse.json({ ok: true });
}
