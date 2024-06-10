import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

import { getChain } from "@/lib/langchain/chain"
import { ModelHandler } from "@/lib/langchain/model"
import { createPrisma } from "@/lib/prisma"
import credentials from "@/utils/credentials";
import {getSupabaseStore} from "@/lib/langchain/vectorstores/supabase";
import {getPineconeStore} from "@/lib/langchain/vectorstores/pinecone";

// export const runtime = "edge"

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Get credentials from ENV

  const { prompt, chatId, id: documentId } = body

  //Get history from supabase against child id
  const prisma = createPrisma()
  const historyFromDB = await prisma.chatHistory.findFirst({
    where: {
      id: chatId,
    },
  })

  //Construct an array of message history to send it to model
  let messageHistory = []
  if (historyFromDB) {
    const chatMessages = historyFromDB.messages as Prisma.JsonArray
    chatMessages.map((message) => {
      messageHistory.push(message)
    })
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = `${prompt.trim().replaceAll("\n", " ")}`

  try {
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    const vectorStore = await getPineconeStore(credentials, documentId)
    // const supabaseStore = await getSupabaseStore()
    const modelHandler = new ModelHandler(writer)
    const model = modelHandler.getModel(credentials.openaiApiKey)

    const response = getChain(
      model,
      vectorStore,
      sanitizedQuestion,
      messageHistory
    )

    // Push current prompt to message history array
    messageHistory.push({
      name: "human",
      text: prompt,
    })

    //Resolve the promise returned by langchain
    Promise.resolve(response).then(async (res) => {
      //Push response to message history array
      messageHistory.push({
        name: "ai",
        text: res.text,
      })

      //Update message history array in table against chatId
      await prisma.chatHistory.update({
        where: {
          id: chatId,
        },
        data: {
          messages: messageHistory,
        },
      })
    })

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    })
  } catch (error: any) {
    console.log("error", error)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
