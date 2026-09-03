import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize"

// note: 「DELETE という名前の関数を作ると、Next.jsが [id] フォルダのURLで呼ばれたときに、この2つを自動で渡してくれる」という決まり文句
//note: 受付係の「窓口オープン」。「DELETEのお願いが来たらこの窓口ね」とNext.jsに登録してる部分
export async function DELETE(request: Request, context: RouteContext<'/api/logs/[id]'>) {
  //note: const { id } = await context.params;
  const { id } = await context.params;

  try {
    //  受付が通訳（prisma）に「idが◯番のログ、DBから消しといて」と依頼。ここで初めてDBが実際に変更される
    await prisma.log.delete({ where: {id: BigInt(id)} })
    
    return NextResponse.json(
      {message: `Log ${id} deleted successfully`},
      {status: 200}
    )

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed to delete logs" }, { status: 500 })
  }
}