import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "failed to fetch logs" }, { status: 500 })
  }
}