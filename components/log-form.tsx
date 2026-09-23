"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { postSchema, type PostInput } from "@/lib/validations/post";
import Link from "next/link";

// 気分の選択肢。value は postSchema の z.enum と一致させる（見た目のラベルだけ変更可）
const MOODS = [
  { value: "fun", emoji: "😄", label: "楽しい" },
  { value: "normal", emoji: "😐", label: "普通" },
  { value: "sad", emoji: "😞", label: "悲しい" },
  { value: "frustrate", emoji: "😤", label: "イライラ" },
] as const;

// 新規投稿(/post)と編集(/logs/[id]/edit)の両方で使う本文フォーム。
// 「何を保存するか」は同じなので中身は共通、
// 「保存後どうするか」だけが呼び出し側ごとに違うので onSubmit として外から渡す
export function LogForm({
  defaultValues,
  onSubmit,
  submitLabel,
  submittingLabel,
  cancelHref,
}: {
  defaultValues: PostInput;
  onSubmit: (data: PostInput) => Promise<string | void>;
  submitLabel: string;
  submittingLabel: string;
  // 「一覧に戻る」リンク。渡された画面だけに表示する（/post では渡さないので出ない）
  cancelHref?: string;
}) {
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues,
  });

  const values = form.watch();
  const charCount = (values.today?.length ?? 0) + (values.good?.length ?? 0) + (values.bad?.length ?? 0) + (values.tomorrow?.length ?? 0);

  return (
    <form
      className="px-6 py-5"
      onSubmit={form.handleSubmit(async (data) => {
        const errorMessage = await onSubmit(data);
        if (errorMessage) {
          form.setError("root", { message: errorMessage });
          return;
        }
        // 成功時は呼び出し側がpushで画面遷移することもあるが、
        // そのままこの画面に留まるケース(/postでの通常投稿)もあるのでここでリセットしておく
        form.reset();
      })}
    >
      <div className="grid gap-5">
        <Field>
          <FieldLabel htmlFor="today">
            今日やったこと
            <Badge className="bg-accent text-accent-foreground">必須</Badge>
          </FieldLabel>
          <Input {...form.register("today")} id="today" type="text" placeholder="今日やったこと" />
          <FieldError errors={[form.formState.errors.today]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="good">
            良かったこと
            <Badge className="bg-accent text-accent-foreground">必須</Badge>
          </FieldLabel>
          <Input {...form.register("good")} id="good" type="text" placeholder="良かったこと" />
          <FieldError errors={[form.formState.errors.good]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="bad">
            モヤったこと
            <Badge variant="secondary" className="text-accent-foreground">
              任意
            </Badge>
          </FieldLabel>
          <Input {...form.register("bad")} id="bad" type="text" placeholder="なし" />
          <FieldError errors={[form.formState.errors.bad]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="tomorrow">
            明日やること
            <Badge className="bg-accent text-accent-foreground">必須</Badge>
          </FieldLabel>
          <Input {...form.register("tomorrow")} id="tomorrow" type="text" placeholder="明日やること" />
          <FieldError errors={[form.formState.errors.tomorrow]} />
        </Field>
      </div>

      <Separator className="my-5" />

      <section>
        <h3 className="mb-3 font-bold">今日の気分</h3>
        <Controller
          control={form.control}
          name="mood"
          render={({ field }) => (
            <ToggleGroup className="w-full justify-between gap-2" variant="outline" spacing={2} value={[field.value]} onValueChange={(val) => field.onChange(val[0])}>
              {MOODS.map((mood) => (
                <ToggleGroupItem key={mood.value} value={mood.value} aria-label={mood.label} className="flex h-auto flex-1 flex-col gap-1 rounded-xl py-3 aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground">
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </section>

      <Separator className="my-5" />

      {form.formState.errors.root?.message && <p className="mb-3 text-sm text-destructive">{form.formState.errors.root.message}</p>}

      <div className="flex items-center justify-between">
        {cancelHref && (
          <Link href={cancelHref} className="flex justify-center items-center rounded-xl border border-border bg-card px-4 w-32 h-12 shadow-sm transition-colors hover:bg-muted">
            一覧に戻る
          </Link>
        )}
        <span className="text-sm text-muted-foreground">{charCount}文字</span>
        <Button type="submit" className="h-12 rounded-xl px-8 text-base" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
