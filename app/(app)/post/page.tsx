"use client";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// note: ③ ToggleGroup(独自コンポーネント)はControllerを使う
import { Controller } from "react-hook-form";

import { z } from "zod";

const postSchema = z.object({
  today: z.string().nonempty({ message: "今日やったことを入力してください" }),
  good: z.string().nonempty({ message: "よかったことを入力してください" }),
  tomorrow: z.string().nonempty({ message: "明日やることを入力してください" }),
  mood: z.enum(["fun", "normal", "sad", "frustrate"]),
}); // 4つの値のどれかじゃないとだめ

export default function Post() {

  // note:① useFormでフォームを作る(useState(form)の代わり)
  // note: まず、変数form と
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { today: "", good: "", tomorrow: "", mood: "normal" as const },
  });

  // note: ② テキスト入力はregisterで繋ぐ
  // note: <Input {...form.register("today")} id="today" type="text" placeholder="今日やったこと" />
  return (
    <div className="max-w-7xl px-4 py-8">
      <h2 className="text-2xl mb-8 font-bold">今日の記録</h2>
      <form onSubmit={form.handleSubmit((data) => {
        // note: 今までの記録を読みだす ノートを開いて、今まで書いてある内容を取り出す
        const saved = localStorage.getItem("emolog_logs");
        // note: ノートに何か書いてあれば、読める形(配列)に戻す。何も無ければ、空っぽのリスト[]からスタートする
        const existing = saved ? JSON.parse(saved) : [];

        // note: 今まであった日記のリスト(existing)に、今回書いた新しい1件を追加した、新しいリストを作る
        const newLogs = [...existing, { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
        localStorage.setItem("emolog_logs", JSON.stringify(newLogs));
      })}>
        <div className="grid gap-8 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="today">今日やったこと</Label>
            {/* ヒント: onChange={inputChange} を渡して today を更新する */}
            <Input {...form.register("today")} id="today" type="text" placeholder="今日やったこと" />
            {form.formState.errors.today && <p className="text-sm text-red-500">{form.formState.errors.today.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="good">よかったこと</Label>
            {/* ヒント: onChange={inputChange} を渡して good を更新する */}
            <Input {...form.register("good")} id="good" type="text" placeholder="よかったこと" />
            {form.formState.errors.good && <p className="text-sm text-red-500">{form.formState.errors.good.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tomorrow">あしたやること</Label>
            {/* ヒント: onChange={inputChange} を渡して tomorrow を更新する */}
            <Input {...form.register("tomorrow")} id="tomorrow" type="text" placeholder="あしたやること" />
            {form.formState.errors.tomorrow && <p className="text-sm text-red-500">{form.formState.errors.tomorrow.message}</p>}
          </div>
        </div>
        <Separator />
        <section className="py-4">
          <h3 className="mb-4 font-bold">今日の気分</h3>
          {/* ヒント: mood 選択用の onValueChange ハンドラを作って渡す（ToggleGroup は string[] を返すので注意） */}

          <Controller
            control={form.control}
            name="mood"
            render={({ field }) => (
              <ToggleGroup className="pb-4 justify-between" size="sm" value={[field.value]} variant="outline" spacing={4} onValueChange={(v) => field.onChange(v[0])}>
                <ToggleGroupItem className="p-4" value="fun" aria-label="Toggle fun">
                  😄楽しい
                </ToggleGroupItem>
                <ToggleGroupItem className="p-4" value="normal" aria-label="Toggle normal">
                  😐普通
                </ToggleGroupItem>
                <ToggleGroupItem className="p-4" value="sad" aria-label="Toggle sad">
                  😞悲しい
                </ToggleGroupItem>
                <ToggleGroupItem className="p-4" value="frustrate" aria-label="Toggle frustrate">
                  😤モヤモヤ
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          ></Controller>

          <Separator />
          <div className="flex justify-end py-4">
            <Button type="submit" className="p-4">
              保存する
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
