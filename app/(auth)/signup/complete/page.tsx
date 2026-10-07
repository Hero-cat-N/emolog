import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 確認メールのリンクを踏んだあとの戻り先（signup の emailRedirectTo）。
// メールアドレスの確認は Supabase 側で済んでいるので、ここでは結果を見せてログイン画面へ案内するだけ。
// 確認に失敗したとき（リンクの期限切れ・使用済みなど）は、Supabase が
// ?error=access_denied&error_code=otp_expired&error_description=... のように理由を付けて戻してくる
export default async function Page({
  searchParams,
}: {
  // Next 16 では searchParams は Promise（await してから読む）
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  // 成功したときは ?code=... だけが付いて戻ってくる。error がある、または code が無い
  // （URL を手で開いた等）ときは「登録できた」と言い切れないので失敗側に倒す
  const failed = Boolean(params.error) || !params.code;

  return (
    // login 画面と同じ器：SP は上から縦積み、md 以上は画面中央にカードを置く
    <div className="flex min-h-svh w-full justify-center bg-background md:items-center md:p-10">
      <div className="flex w-full flex-col items-center px-7 pt-13 pb-8.5 text-center md:w-105 md:rounded-[20px] md:border md:bg-card md:px-9 md:pt-11.5 md:pb-8 md:shadow-[0_12px_36px_rgba(58,26,8,0.1)]">
        <Image src="/emolog-icon-light.svg" alt="" width={58} height={58} className="md:size-15" />

        <h1 className="mt-6 font-heading text-xl font-extrabold text-foreground">
          {failed ? "登録を完了できませんでした" : "アカウント登録が完了しました！"}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {failed
            ? "リンクの有効期限が切れているか、すでに使われています。お手数ですが、もう一度登録してください。"
            : "登録したメールアドレスとパスワードでログインしてください。"}
        </p>

        <Link
          href={failed ? "/signup" : "/login"}
          className={cn(
            buttonVariants(),
            "mt-8 h-auto w-full rounded-xl bg-brand-gradient py-3.5 text-[15px] font-bold shadow-[0_8px_18px_rgba(216,85,40,0.35)]",
          )}
        >
          {failed ? "新規登録へ戻る" : "ログイン画面へ"}
        </Link>
      </div>
    </div>
  );
}
