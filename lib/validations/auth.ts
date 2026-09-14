import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "正しいメールアドレスを入力してください" }),
  password: z.string().nonempty({ message: "パスワードを入力してください" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
