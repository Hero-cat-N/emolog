import { prisma } from "@/lib/prisma";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <ul>
      {logs.map((log) => (
        <Card key={log.id.toString()}>
          <CardHeader>
            <CardTitle>
              {log.emotion?.label ?? "－"}　{log.loggedDate.toLocaleDateString("ja-JP")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            <p>やったこと：{log.didToday}</p>
            <p>よかったこと：{log.goodThing}</p>
            <p>あしたやること：{log.tomorrowPlan}</p>
            {log.badThing && <p>モヤモヤ：{log.badThing}</p>}
          </CardContent>
        </Card>
      ))}
    </ul>
  );
}
