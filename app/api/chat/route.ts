import { NextRequest, NextResponse } from "next/server"
import { getChatTitle } from "@/utils/chat"
import { Prisma } from "@prisma/client"

import { getChain } from "@/lib/langchain/chain"
import { ModelHandler } from "@/lib/langchain/model"
import { getPineconeStore } from "@/lib/langchain/vectorstores/pinecone"
import { createPrisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  console.log("\n\n INCOMING_REQUEST", request, "\n\n")
  const body = await request.json()
  // Get credentials from ENV
  const credentials = {
    pineconeIndex: process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME,
    pineconeEnvironment: process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT,
    pineconeApiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseBucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET,
    supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
    supabaseDirectUrl: process.env.NEXT_PUBLIC_DIRECT_URL,
  }
  if (
    !credentials ||
    !credentials.pineconeIndex ||
    !credentials.pineconeEnvironment ||
    !credentials.pineconeApiKey
  ) {
    return NextResponse.json({ messagee: "Unauthorized" })
  }

  const {
    prompt,
    chatId,
    messages: history,
    isNormalChat,
    isFirstMessage,
  } = body
  let messageHistory = []
  const prisma = createPrisma({ url: credentials.supabaseDatabaseUrl })
  if (chatId) {
    //Get history from supabase against child id
    const historyFromDB = await prisma.chatHistory.findFirst({
      where: {
        id: chatId,
      },
    })

    //Construct an array of message history to send it to model
    const chatMessages = historyFromDB.messages as Prisma.JsonArray
    chatMessages.map((message) => {
      messageHistory.push(message)
    })
  } else {
    messageHistory = history
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = `${prompt.trim().replaceAll("\n", " ")}`

  try {
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    const vectorStore = await getPineconeStore(credentials)

    const modelHandler = new ModelHandler(writer)
    const model = modelHandler.getModel(credentials.openaiApiKey)

    const response = getChain(
      model,
      vectorStore,
      sanitizedQuestion,
      messageHistory
    )
    if (chatId) {
      // Push current prompt to message history array
      messageHistory.push({
        name: "human",
        text: prompt,
      })

      //Resolve the promise returned by langchain
      Promise.resolve(response).then((res) => {
        console.log("Promise Resolved")
        //Push response to message history array
        messageHistory.push({
          name: "ai",
          text: res.response,
        })

        if (isNormalChat && isFirstMessage) {
          //Create Dynamic Chat Title for Normal Chat
          const dynamicChatTitle = getChatTitle(messageHistory)
          Promise.resolve(dynamicChatTitle)
            .then((res) => {
              console.log("Before Prisman Query")
              //Update message history array in table against chatId
              const updateResponse = prisma.chatHistory.update({
                where: {
                  id: chatId,
                },
                data: {
                  title: res.replace(/^"(.*)"$/, "$1"),
                  messages: messageHistory,
                  updated_at: new Date(),
                },
              })
              Promise.resolve(updateResponse)
                .then((res) => {
                  console.log(res, "Update Response")
                })
                .catch((err) => {
                  console.log(err, "Error in Update")
                })
              console.log("After Prisma Query")
            })
            .catch((err) => {
              console.log(err, "Error in Title")
            })
        } else {
          console.log("Before Prisman Query")
          //Update message history array in table against chatId
          const updateResponse = prisma.chatHistory.update({
            where: {
              id: chatId,
            },
            data: {
              messages: messageHistory,
              updated_at: new Date(),
            },
          })
          Promise.resolve(updateResponse)
            .then((res) => {
              console.log(res, "Update Response")
            })
            .catch((err) => {
              console.log(err, "Error in Update")
            })
          console.log("After Prisma Query")
        }
      })
    }
    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    })
  } catch (error: any) {
    console.log("\n\nCHAT_API_ERROR_BACKEND\n\n", error, `\n\n`)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
