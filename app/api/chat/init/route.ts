import { NextRequest, NextResponse } from "next/server"
import { initialChatMessage } from "@/utils/chat"

import { createPrisma } from "@/lib/prisma"
import credentials from "@/utils/credentials";

export async function POST(request: Request) {
  const body = await request.json()
  const { childId, childContext } = body
  const childInitialContextMessage = [
    {
      name: initialChatMessage.name,
      text: `${initialChatMessage.text} ${childContext}`,
    },
  ]
  const prisma = createPrisma()
  const data = await prisma.chatHistory.create({
    data: {
      childId: childId,
      messages: childInitialContextMessage,
      title: "Chat Title" //TODO: Need to be dynamic
    },
  })

  return NextResponse.json({ data })
}

