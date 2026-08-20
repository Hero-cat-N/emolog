import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { postSchema } from "@/lib/validations/post"
import { toJsonSafe } from "@/lib/serialize"

export async function POST(request: Request) {
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
  try {
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(toJsonSafe(logs))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed to fetch logs" }, { status: 500 })
  }
}