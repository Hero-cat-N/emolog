"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleGoogleSignup() {
    const supabase = createClient();
    // Googleは新規登録/ログインを区別しない(未登録メールなら自動でアカウント作成される)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <div className={cn("flex flex-col gap-6 md:grid md:grid-cols-2 md:items-center md:gap-16", className)} {...props}>
      {/* PC版のみ表示するブランディングパネル */}
      <div className="hidden md:flex md:flex-col md:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl">
            <Image src="/emolog-icon.svg" alt="emolog" width={64} height={64} />
          </div>
          <div>
            <p className="font-heading text-lg font-bold leading-tight">エモログ</p>
            <p className="text-xs text-muted-foreground tracking-widest">EMOLOG</p>
          </div>
        </div>
        <p className="text-lg font-medium">今日のプレイを、3秒で記録する。</p>
        <p className="text-sm text-muted-foreground leading-relaxed">やったこと・良かったこと・モヤったこと・明日やること。4項目を書くだけで、AIが気分の傾向をまとめます。</p>
      </div>

      <Card className="ring-0 shadow-none md:ring-1 md:ring-foreground/10 md:shadow-sm">
        <CardHeader className="grid place-items-center md:justify-start md:text-left">
          {/* SP版のみ表示するロゴ+タイトル */}
          <div className="md:hidden grid place-items-center gap-1">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl mb-2">
              <Image src="/emolog-icon.svg" alt="emolog" width={64} height={64} />
            </div>
            <CardTitle>エモログ</CardTitle>
            <CardDescription>アカウントを作成する</CardDescription>
          </div>
          {/* PC版のみ表示するシンプルな見出し */}
          <CardTitle className="hidden md:block text-xl">新規登録</CardTitle>
        </CardHeader>
        <CardContent>
          {needsEmailConfirmation ? (
            <p className="text-sm text-center py-8">
              確認メールを送信しました。メール内のリンクを開いて登録を完了してください。
            </p>
          ) : (
            <form
              onSubmit={form.handleSubmit(async (data) => {
                const res = await fetch("/api/auth/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });

                if (!res.ok) {
                  const body = await res.json().catch(() => null);
                  form.setError("root", {
                    message: body?.error ?? "登録に失敗しました",
                  });
                  return;
                }

                const body: { needsEmailConfirmation: boolean } = await res.json();

                if (body.needsEmailConfirmation) {
                  setNeedsEmailConfirmation(true);
                  return;
                }

                router.push("/post");
                router.refresh();
              })}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
                  <Input {...form.register("email")} className="p-4 py-6" id="email" type="email" placeholder="you@example.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">パスワード</FieldLabel>
                  <Input {...form.register("password")} className="p-4 py-6" id="password" type="password" placeholder="●●●●●●" />
                  {form.formState.errors.password && (
                    <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </Field>
                <Field>
                  {form.formState.errors.root?.message && (
                    <p className="text-sm text-destructive text-center">{form.formState.errors.root.message}</p>
                  )}
                  <Button className="py-6" type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "登録中…" : "登録する"}
                  </Button>
                  <div className="flex items-center gap-2 py-2 w-full">
                    <div className="flex h-px bg-gray-300 flex-1"></div>
                    <span className="flex text-">または</span>
                    <div className="flex h-px bg-gray-300 flex-1"></div>
                  </div>
                  <Button className="py-6" variant="outline" type="button" onClick={handleGoogleSignup}>
                    Google で 登録
                  </Button>
                  <FieldDescription className="text-center">
                    すでにアカウントをお持ちの方は{" "}
                    <Link href="/login" className="font-medium text-primary">
                      ログイン
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
