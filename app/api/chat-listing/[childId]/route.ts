import { NextRequest, NextResponse } from "next/server"

import { createPrisma } from "@/lib/prisma"

// @ts-ignore
export async function GET(request: NextRequest, { params: { childId } }) {
  let take = 10
  let skip = 0

  const pageNumber = request.nextUrl.searchParams.get("pageNumber") as string
  const pageSize = request.nextUrl.searchParams.get("pageSize") as string
  
  if (pageNumber && pageSize) {
    skip = parseInt(pageSize) * (parseInt(pageNumber) - 1)
    take = parseInt(pageSize)
  }
  const credentials = {
    supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
  }
  const prisma = createPrisma({ url: credentials.supabaseDatabaseUrl })

  const data = await prisma.chatHistory.findMany({
    skip: skip,
    take: take,
    orderBy: {
      updated_at: 'desc'
    },
    where: {
      childId,
    },
  })

  const nextPage = data.length === take ? true: false
  return NextResponse.json({ data, nextPage })
}
