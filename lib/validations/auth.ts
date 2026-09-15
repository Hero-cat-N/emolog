import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ message: "正しいメールアドレスを入力してください" }),
  password: z.string().nonempty({ message: "パスワードを入力してください" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ログインは「登録済みのパスワードと一致するか」だけを見ればいいので nonempty で十分だが、
// サインアップは「これから作るパスワードが安全な強度か」をここで決めて弾く必要がある
export const signupSchema = z.object({
  email: z.email({ message: "正しいメールアドレスを入力してください" }),
  password: z
    .string()
    // TODO(human): パスワードの強度ルールをここに追加する(.min() や .regex() をチェーンする)
    //   参考: node_modules/next/dist/docs/01-app/02-guides/authentication.md の SignupFormSchema
    //   (8文字以上 / 英字を含む / 数字を含む / 記号を含む、など)
    .nonempty({ message: "パスワードを入力してください" })
    .min(8, "8文字以上で入力してください")
    .regex(/[a-z]/, { message: "小文字を1文字以上含めてください" })
    .regex(/[A-Z]/, { message: "大文字を1文字以上含めてください" })

});

export type SignupInput = z.infer<typeof signupSchema>;
