import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize"
import { createClient } from "@/lib/supabase/server"

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

  try {
    const emotion = await prisma.emotion.findUnique({ where: { code: mood } })

    const log = await prisma.log.create({
      data: {
        userId,
        didToday: today,
        goodThing: good,
        tomorrowPlan: tomorrow,
        badThing: bad,
        loggedDate: new Date(),
        emotionId: emotion?.id,
      },
    })

    return NextResponse.json(toJsonSafe(log), { status: 201 })
  } catch (error) {
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