import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize"
import { createClient } from "@/lib/supabase/server"
import { startOfUTCDay } from "@/lib/date"

// proxy.ts の保護対象から /api は除外しているため、ここで自前にログイン確認する
async function requireUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function POST(request: Request) {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = postSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 })
  }

  const { today, good, tomorrow, bad, mood } = parsed.data

  // note:loggedDate はフォームの入力項目ではなく、カレンダーでどの日を選んだかから決まる。
  // note:未指定（/postから普通に投稿した場合）なら「今日」を使う
  let loggedDate = startOfUTCDay(new Date())
  if (typeof body.loggedDate === "string") {
    const parsedDate = new Date(body.loggedDate)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "日付の形式が正しくありません" }, { status: 400 })
    }
    loggedDate = startOfUTCDay(parsedDate)
    if (loggedDate.getTime() > startOfUTCDay(new Date()).getTime()) {
      return NextResponse.json({ error: "未来の日付には記録できません" }, { status: 400 })
    }
  }

  try {
    const emotion = await prisma.emotion.findUnique({ where: { code: mood } })

    // note: 新しくprismaを使用してログを制作する
    const log = await prisma.log.create({
      data: {
        userId,
        didToday: today,
        goodThing: good,
        tomorrowPlan: tomorrow,
        badThing: bad,
        loggedDate,
        emotionId: emotion?.id,
      },
    })

    return NextResponse.json(toJsonSafe(log), { status: 201 })
  } catch (error) {
    // @@unique([userId, loggedDate]) に違反 = その日はもう記録済み
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "その日にはすでに記録があります" }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: "failed to save log" }, { status: 500 })
  }
}

export async function GET() {
  const userId = await requireUserId()
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const logs = await prisma.log.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(toJsonSafe(logs))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed to fetch logs" }, { status: 500 })
  }
}