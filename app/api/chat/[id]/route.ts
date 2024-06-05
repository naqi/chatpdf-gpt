import { NextRequest, NextResponse } from "next/server"

import { createPrisma } from "@/lib/prisma"
import credentials from "@/utils/credentials";

// @ts-ignore
export async function GET(request: NextRequest, { params: { id } }) {
  const prisma = createPrisma()

  const data = await prisma.chatHistory.findFirst({
    where: {
      id,
    },
  })

  return NextResponse.json({ data })
}
