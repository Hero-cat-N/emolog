"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";

export default function Post() {
  const [form, setForm] = useState({
    today: "",
    good: "",
    tomorrow: "",
    mood: "normal"
  })

  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, }
    // ヒント: e.target から id と value を取り出して、
    // setForm(prev => ({ ...prev, [id]: value })) のように既存の値を保ちつつ更新する
    setForm(e.target.value)
  }

  return (
    <div className="max-w-7xl px-4 py-8">
      <h2 className="text-2xl mb-8 font-bold">今日の記録</h2>
      <form>
        <div className="grid gap-8 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="today">今日やったこと</Label>
            {/* ヒント: onChange={inputChange} を渡して today を更新する */}
            <Input onChange={} value={form.today} id="today" type="text" placeholder="今日やったこと" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="today">よかったこと</Label>
            {/* ヒント: onChange={inputChange} を渡して good を更新する */}
            <Input onChange={} value={form.good} id="good" type="text" placeholder="よかったこと" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="today">あしたやること</Label>
            {/* ヒント: onChange={inputChange} を渡して tomorrow を更新する */}
            <Input onChange={} value={form.tomorrow} id="tomorrow" type="text" placeholder="あしたやること" required />
          </div>
        </div>
        <Separator />
        <section className="py-4">
          <h3 className="mb-4 font-bold">今日の気分</h3>
          {/* ヒント: mood 選択用の onValueChange ハンドラを作って渡す（ToggleGroup は string[] を返すので注意） */}
          <ToggleGroup className="pb-4 justify-between" size="sm" defaultValue={[form.mood]} variant="outline" spacing={4} onValueChange={}>
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
          <Separator />
          <div className="flex justify-end py-4">
            <Button className="p-4">保存する</Button>
          </div>
        </section>
      </form>
    </div>
  );
}
