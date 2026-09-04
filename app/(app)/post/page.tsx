"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageTabs } from "../_components/page-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { postSchema } from "@/lib/validations/post";

// note:① useForm でフォームを作る / ② テキストは register で繋ぐ / ③ ToggleGroup は Controller

// 気分の選択肢。value は postSchema の z.enum と一致させる（見た目のラベルだけ変更可）
const MOODS = [
  { value: "fun", emoji: "😄", label: "楽しい" },
  { value: "normal", emoji: "😐", label: "普通" },
  { value: "sad", emoji: "😞", label: "悲しい" },
  { value: "frustrate", emoji: "😤", label: "イライラ" },
] as const;

export default function Post() {
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { today: "", good: "", tomorrow: "", bad: "", mood: "normal" as const },
  });

  // ヘッダーの日付。SSR とクライアントで差が出ないよう mount 後にセットする
  const [dateLabel, setDateLabel] = useState("");
  useEffect(() => {
    setDateLabel(
      new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(new Date())
    );
  }, []);

  // フッターの文字数（テキスト項目の合計）
  const values = form.watch();
  const charCount =
    (values.today?.length ?? 0) +
    (values.good?.length ?? 0) +
    (values.bad?.length ?? 0) +
    (values.tomorrow?.length ?? 0);

  return (
    <div className="flex min-h-screen justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* ヘッダー */}
        <header className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-heading text-xl font-bold">今日の記録</h2>
          <span className="text-sm text-muted-foreground">{dateLabel}</span>
        </header>

        <PageTabs />

        <form
          className="px-6 py-5"
          onSubmit={form.handleSubmit(async (data) => {
            const res = await fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });

            if (!res.ok) {
              form.setError("root", { message: "保存に失敗しました" });
              return;
            }

            form.reset();
          })}
        >
          <div className="grid gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="today" className="flex items-center gap-2">
                今日やったこと
                <Badge className="bg-accent text-accent-foreground">必須</Badge>
              </Label>
              <Input {...form.register("today")} id="today" type="text" placeholder="今日やったこと" />
              {form.formState.errors.today && (
                <p className="text-sm text-destructive">{form.formState.errors.today.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="good" className="flex items-center gap-2">
                良かったこと
                <Badge className="bg-accent text-accent-foreground">必須</Badge>
              </Label>
              <Input {...form.register("good")} id="good" type="text" placeholder="良かったこと" />
              {form.formState.errors.good && (
                <p className="text-sm text-destructive">{form.formState.errors.good.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bad" className="flex items-center gap-2">
                モヤったこと
                <Badge variant="secondary">任意</Badge>
              </Label>
              <Input {...form.register("bad")} id="bad" type="text" placeholder="なし" />
              {form.formState.errors.bad && (
                <p className="text-sm text-destructive">{form.formState.errors.bad.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tomorrow" className="flex items-center gap-2">
                明日やること
                <Badge className="bg-accent text-accent-foreground">必須</Badge>
              </Label>
              <Input
                {...form.register("tomorrow")}
                id="tomorrow"
                type="text"
                placeholder="明日やること"
              />
              {form.formState.errors.tomorrow && (
                <p className="text-sm text-destructive">{form.formState.errors.tomorrow.message}</p>
              )}
            </div>
          </div>

          <Separator className="my-5" />

          <section>
            <h3 className="mb-3 font-bold">今日の気分</h3>
            <Controller
              control={form.control}
              name="mood"
              render={({ field }) => (
                <ToggleGroup
                  className="w-full justify-between gap-2"
                  variant="outline"
                  spacing={2}
                  value={[field.value]}
                  onValueChange={(val) => field.onChange(val[0])}
                >
                  {MOODS.map((mood) => (
                    <ToggleGroupItem
                      key={mood.value}
                      value={mood.value}
                      aria-label={mood.label}
                      className="flex h-auto flex-1 flex-col gap-1 rounded-xl py-3 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-xs">{mood.label}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
          </section>

          <Separator className="my-5" />

          {form.formState.errors.root?.message && (
            <p className="mb-3 text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          {/* フッター */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{charCount}文字</span>
            <Button
              type="submit"
              className="h-12 rounded-xl px-8 text-base"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "保存中…" : "保存する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
