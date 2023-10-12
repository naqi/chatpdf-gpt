import { NextRequest, NextResponse } from "next/server"

import { createPrisma } from "@/lib/prisma"

// @ts-ignore
export async function GET(request: NextRequest, { params: { id } }) {
  const credentials = {
    supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
  }
  const prisma = createPrisma({ url: credentials.supabaseDatabaseUrl })

  const data = await prisma.chatHistory.findFirst({
    where: {
      id,
    },
  })

  return NextResponse.json({ data })
}
