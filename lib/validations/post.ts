import { z } from "zod";

export const postSchema = z.object({
  today: z.string().nonempty({ message: "今日やったことを入力してください" }),
  good: z.string().nonempty({ message: "よかったことを入力してください" }),
  tomorrow: z.string().nonempty({ message: "明日やることを入力してください" }),
  bad: z.string().optional(),
  mood: z.enum(["fun", "normal", "sad", "frustrate"]),
  // タグ名の配列（例: ["FF14", "零式"]）。新しい名前ならサーバー側で tags に作る
  tags: z
    .array(z.string().trim().min(1).max(20, { message: "タグは20文字以内にしてください" }))
    .max(10, { message: "タグは10個までです" }),
});

export type PostInput = z.infer<typeof postSchema>;
