import { z } from "zod";

export const postSchema = z.object({
  today: z.string().nonempty({ message: "今日やったことを入力してください" }),
  good: z.string().nonempty({ message: "よかったことを入力してください" }),
  tomorrow: z.string().nonempty({ message: "明日やることを入力してください" }),
  mood: z.enum(["fun", "normal", "sad", "frustrate"]),
});

export type PostInput = z.infer<typeof postSchema>;
