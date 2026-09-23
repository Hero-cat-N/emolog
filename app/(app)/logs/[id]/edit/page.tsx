import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { parseId } from "../../log-card-utils";
import { EditLogForm } from "./edit-log-form";

export const dynamic = "force-dynamic";

export default async function EditLogPage(props: PageProps<"/logs/[id]/edit">) {
  const { id } = await props.params;
  const currentId = parseId(id);

  const currentLog = await prisma.log.findUnique({
    where: { id: currentId },
    include: { emotion: true },
  });

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
  };

  return <EditLogForm log={editableLog} />;
}
