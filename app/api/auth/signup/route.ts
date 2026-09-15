import { NextResponse } from "next/server";
import { z } from "zod";
import { signupSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    // メール重複かパスワード不備かは区別せず、常に同じメッセージを返す(アカウント存在の推測を防ぐ)
    return NextResponse.json({ error: "登録に失敗しました。時間をおいて再度お試しください" }, { status: 400 });
  }

  // login側(app/api/auth/login/route.ts)・callback側と同じ形で public.users に行を作る
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {},
    create: { id: data.user.id },
  });

  // Supabaseプロジェクトで「メール確認」が有効な場合、この時点ではまだ session が無い
  // (data.session === null)。その場合はログイン状態にはせず、確認メールの案内を出す
  return NextResponse.json({ ok: true, needsEmailConfirmation: data.session === null });
}
