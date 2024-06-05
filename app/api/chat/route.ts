import { NextRequest, NextResponse } from "next/server"
import { getChatTitle } from "@/utils/chat"
import { Prisma } from "@prisma/client"

import { getChain } from "@/lib/langchain/chain"
import { ModelHandler } from "@/lib/langchain/model"
import { createPrisma } from "@/lib/prisma"
import credentials from "@/utils/credentials";
import {getSupabaseStore} from "@/lib/langchain/vectorstores/supabase";

export async function POST(request: NextRequest) {
  console.log("\n\n INCOMING_REQUEST", request, "\n\n")
  const body = await request.json()
  // Get credentials from ENV

  const { prompt, chatId } = body

  //Get history from supabase against child id
  const prisma = createPrisma()
  const historyFromDB = await prisma.chatHistory.findFirst({
    where: {
      id: chatId,
    },
  })

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

    // const vectorStore = await getPineconeStore(credentials)
    const supabaseStore = await getSupabaseStore()
    const modelHandler = new ModelHandler(writer)
    const model = modelHandler.getModel(credentials.openaiApiKey)

    const response = getChain(
      model,
      supabaseStore,
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

        console.log("Before Prisman Query - Message History Update")
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
            console.log(res, "Update Response - Message History Update")
          })
          .catch((err) => {
            console.log(err, "Error in Update - Message History Update")
          })
        console.log("After Prisma Query - Message History Update")
        if (isNormalChat && isFirstMessage) {
          //Create Dynamic Chat Title for Normal Chat
          const dynamicChatTitle = getChatTitle(messageHistory)
          Promise.resolve(dynamicChatTitle)
            .then((res) => {
              console.log("Before Prisman Query - Chat Title Update")
              //Update message history array in table against chatId
              const updateResponse = prisma.chatHistory.update({
                where: {
                  id: chatId,
                },
                data: {
                  title: res.replace(/^"(.*)"$/, "$1"),
                },
              })
              Promise.resolve(updateResponse)
                .then((res) => {
                  console.log(res, "Update Response - Chat Title Update")
                })
                .catch((err) => {
                  console.log(err, "Error in Update - Chat Title Update")
                })
              console.log("After Prisma Query - Chat Title Update")
            })
            .catch((err) => {
              console.log(err, "Error in Title")
            })
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
