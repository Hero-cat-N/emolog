"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  // 入力欄：SP は白地、md 以上はカードが白なので cream 地にする
  const inputClass =
    "h-auto rounded-[10px] bg-card px-3.5 py-3 text-sm placeholder:text-[#B8ADA0] md:bg-background md:py-3.25";

  return (
    // SP: 背景そのままに縦積み / md 以上: 中央の白カード（420px）。中身の要素と順序は同じ
    <div
      className={cn(
        "w-full px-7 pt-13 pb-8.5 md:w-105 md:rounded-[20px] md:border md:bg-card md:px-9 md:pt-11.5 md:pb-8 md:shadow-[0_12px_36px_rgba(58,26,8,0.1)]",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center text-center">
        <Image src="/emolog-icon-light.svg" alt="" width={58} height={58} className="md:size-15" />
        <Image
          src="/emolog-wordmark.svg"
          alt="エモログ"
          width={96}
          height={32}
          className="mt-3.5 h-8 w-auto md:h-8.5"
        />
        <p className="mt-2.5 text-[13px] text-muted-foreground">今日のプレイを、3秒で記録する</p>
      </div>

      <form
        className="mt-8"
        onSubmit={form.handleSubmit(async (data) => {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => null);
            form.setError("root", {
              message: body?.error ?? "ログインに失敗しました",
            });
            return;
          }

          router.push("/post");
          router.refresh();
        })}
      >
        <FieldGroup className="gap-3.5">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="email" className="text-xs font-medium text-ink-soft">
              メールアドレス
            </FieldLabel>
            <Input {...form.register("email")} className={inputClass} id="email" type="email" placeholder="you@example.com" />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="password" className="text-xs font-medium text-ink-soft">
              パスワード
            </FieldLabel>
            <Input {...form.register("password")} className={inputClass} id="password" type="password" placeholder="●●●●●●" />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </Field>

          {form.formState.errors.root?.message && (
            <p className="text-center text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          {/* 画面に1つだけの primary CTA（グラデーション） */}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-1.5 h-auto w-full rounded-xl bg-brand-gradient py-3.5 text-[15px] font-bold shadow-[0_8px_18px_rgba(216,85,40,0.35)] hover:brightness-95"
          >
            {form.formState.isSubmitting ? "ログイン中…" : "ログイン"}
          </Button>

          <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            または
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleGoogleLogin}
            className="h-auto w-full gap-2 rounded-[10px] bg-card py-3 text-[13.5px] font-medium hover:bg-accent"
          >
            <GoogleLogo />
            Google でログイン
          </Button>

          <FieldDescription className="text-center text-xs text-muted-foreground">
            アカウントをお持ちでない方は
            <Link href="/signup" className="font-medium text-accent-foreground">
              こちら
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>
    </div>
  );
}

// Google の4色ロゴ（ブランドロゴなので line icon ルールの対象外）
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
