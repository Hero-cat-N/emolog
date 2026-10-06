import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseId } from "../../log-card-utils";
import { AppShell, PageHeading } from "../../../_components/app-shell";
import { EditLogForm } from "./edit-log-form";

export const dynamic = "force-dynamic";

export default async function EditLogPage(props: PageProps<"/logs/[id]/edit">) {
  const { id } = await props.params;
  const currentId = parseId(id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [currentLog, tagOptions] = await Promise.all([
    // userId もセットで絞り込み、URL の id を書き換えても他人のログは開けないようにする
    prisma.log.findUnique({
      where: { id: currentId, userId: user.id },
      include: { emotion: true, tags: { include: { tag: true } } },
    }),
    // タグ選択の候補（このユーザーが今までに作ったタグ）
    prisma.tag.findMany({
      where: { userId: user.id },
      select: { name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (currentLog === null) {
    notFound();
  }

  // note:BigInt(id) はサーバー→クライアントの境界を越えられないので、渡す前に文字列化する
  const editableLog = {
    id: currentLog.id.toString(),
    didToday: currentLog.didToday,
    goodThing: currentLog.goodThing,
    badThing: currentLog.badThing,
    tomorrowPlan: currentLog.tomorrowPlan,
    emotionCode: currentLog.emotion?.code ?? null,
    // 中間テーブル(log_tags)越しに付いているタグの名前だけ取り出す
    tags: currentLog.tags.map((logTag) => logTag.tag.name),
  };

  return (
    <AppShell header={<PageHeading>記録を編集する</PageHeading>}>
      <EditLogForm log={editableLog} tagOptions={tagOptions.map((t) => t.name)} />
    </AppShell>
  );
}
