"use client";

import { useRouter } from "next/navigation";

import { LogForm } from "@/components/log-form";
import type { PostInput } from "@/lib/validations/post";

type EditableLog = {
  id: string;
  didToday: string;
  goodThing: string;
  badThing: string | null;
  tomorrowPlan: string;
  emotionCode: string | null;
};

export function EditLogForm({ log }: { log: EditableLog }) {
  const router = useRouter();

  // log.emotionCode は string | null なので、postSchema の mood(enum) と型上は一致しない。
  // DB上は必ず4択のどれかである前提で、ここでは安全と分かった上でキャストする
  const defaultValues: PostInput = {
      today: log.didToday,
      good: log.goodThing,
      tomorrow: log.tomorrowPlan,
      mood: (log.emotionCode ?? "normal") as PostInput["mood"],
      bad: log.badThing ?? "",
  }

  return (
    <LogForm 
        defaultValues={defaultValues}
        onSubmit={
          async (data) => {
          const res = await fetch(`/api/logs/${log.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) return "更新に失敗しました";

          return router.push(`/logs/${log.id}`);
        }}
        submitLabel="更新する"
        submittingLabel="更新中…"
    />
  )
}
