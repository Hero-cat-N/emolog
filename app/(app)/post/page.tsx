"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// note: ③ ToggleGroup(独自コンポーネント)はControllerを使う
import { Controller } from "react-hook-form";

import { postSchema } from "@/lib/validations/post";

export default function Post() {
  // note:① useFormでフォームを作る(useState(form)の代わり)
  // note: まず、変数form と
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { today: "", good: "", tomorrow: "", bad: "", mood: "normal" as const },
  });

  // note: ② テキスト入力はregisterで繋ぐ
  // note: <Input {...form.register("today")} id="today" type="text" placeholder="今日やったこと" />
  return (
    <div className="max-w-7xl px-4 py-8">
      <h2 className="text-2xl mb-8 font-bold">今日の記録</h2>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          // ヒント①: fetch("/api/logs", { method: "POST",
          //  headers: { "Content-Type": "application/json" },
          //  body: JSON.stringify(data) });
          //         コールバックをasyncにしたのは、fetchの完了を待つため(このasync化だけで
          //         下のisSubmittingが自動的に「送信中はtrue」になる、react-hook-formの機能)
          const res = await fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          // ヒント②: res.ok が false(=APIがエラーを返した)場合は、フォームにエラーを記録する
          //         form.setError("root", { message: "保存に失敗しました" })
          //         (fieldごとのエラーと違い、フォーム全体のエラーは "root" という特別な名前で管理する)
          if(!res.ok) {
            form.setError("root", { message: "保存に失敗しました" });
            return;
          }

          // ヒント③: 成功したら form.reset() でフォームを空の状態に戻す
          form.reset();
        })}
      >
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="bad">モヤモヤしたこと</Label>
            {/* ヒント: onChange={inputChange} を渡して bad を更新する */}
            <Input {...form.register("bad")} id="bad" type="text" placeholder="モヤモヤしたこと" />
            {form.formState.errors.bad && <p className="text-sm text-red-500">{form.formState.errors.bad.message}</p>}
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
          {/* ヒント: form.formState.errors.root?.message があれば、今までのfield単位のエラー表示と
              同じ要領で <p className="text-sm text-red-500">...</p> を出す */}
          <p className="text-sm text-red-500">{form.formState.errors.root?.message}</p>
          <div className="flex justify-end py-4">
            {/* ヒント: disabled={form.formState.isSubmitting} を付けると送信中の二重送信を防げる。
                ボタンの文字も isSubmitting ? "保存中..." : "保存する" のように出し分けられる */}
            <Button type="submit" className="p-4" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "保存中…" : "保存する"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
