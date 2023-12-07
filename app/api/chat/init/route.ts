import { NextRequest, NextResponse } from "next/server"
import { initialChatMessage } from "@/utils/chat"

import { createPrisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.json()
  const { childId, childContext, chatTitle } = body

  const credentials = {
    supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
  }

  const childInitialContextMessage = [
    {
      name: initialChatMessage.name,
      text: `${initialChatMessage.text} ${childContext}`,
    },
  ]
  const prisma = createPrisma({ url: credentials.supabaseDatabaseUrl })
  const data = await prisma.chatHistory.create({
    data: {
      childId: childId,
      messages: childInitialContextMessage,
      title: chatTitle
    },
  })

  return NextResponse.json({ data })
}

