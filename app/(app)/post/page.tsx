import { Suspense } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "./post-form";

export const dynamic = "force-dynamic";

// サーバー側の係：ログイン中のユーザーのタグ一覧を DB から取って、フォームに候補として渡す
export default async function PostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tags = await prisma.tag.findMany({
    where: { userId: user.id },
    select: { name: true },
    orderBy: { createdAt: "asc" },
  });

  // PostForm は useSearchParams() を使うので Suspense で包む必要がある
  // (ビルド時にNext.jsがこのページをCSR側にフォールバックできるようにするため)
  return (
    <Suspense fallback={null}>
      <PostForm tagOptions={tags.map((t) => t.name)} />
    </Suspense>
  );
}
