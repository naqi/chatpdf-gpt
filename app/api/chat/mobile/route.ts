import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { ConversationChain } from "langchain/chains"
import { ChatOpenAI } from "langchain/chat_models/openai"
import { BufferMemory, ChatMessageHistory } from "langchain/memory"
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "langchain/prompts"
import { mapStoredMessagesToChatMessages } from "@/lib/langchain/schema"
import { getPineconeStore } from "@/lib/langchain/vectorstores/pinecone"
import { createPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

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
    return NextResponse.redirect("/credentials")
  }

  const { prompt, chatId } = body

  //Get history from supabase against child id
  const prisma = createPrisma({ url: credentials.supabaseDatabaseUrl })
  const historyFromDB = await prisma.chatHistory.findFirst({
    where: {
      id: chatId,
    },
  })

  //Construct an array of message history to send it to model
  let messageHistory = []
  const chatMessages = historyFromDB.messages as Prisma.JsonArray
  chatMessages.map((message) => {
    messageHistory.push(message)
  })
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = `${prompt.trim().replaceAll("\n", " ")}`

  try {
    const vectorStore = await getPineconeStore(credentials)

    const model = new ChatOpenAI({
      openAIApiKey: credentials.openaiApiKey,
      modelName: "gpt-4",
      temperature: 0.3,
      maxTokens: 1200,
    })

    const lcChatMessageHistory = new ChatMessageHistory(
      mapStoredMessagesToChatMessages(messageHistory)
    )
    const memory = new BufferMemory({
      chatHistory: lcChatMessageHistory,
      returnMessages: true,
      memoryKey: "history",
    })

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate("You are a friendly assistant."),
      new MessagesPlaceholder("history"),
      HumanMessagePromptTemplate.fromTemplate("{input}"),
    ])
    const chain = new ConversationChain({
      memory: memory,
      llm: model,
      prompt: chatPrompt,
    })

    const response = await chain.call({
      input: sanitizedQuestion,
    })

    // Push current prompt to message history array
    messageHistory.push({
      name: "human",
      text: prompt,
    })

    //Push response to message history array
    messageHistory.push({
      name: "ai",
      text: response.response,
    })

    //Update message history array in table against chatId
    await prisma.chatHistory.update({
      where: {
        id: chatId,
      },
      data: {
        messages: messageHistory,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ data: response.response }, { status: 200 })
  } catch (error: any) {
    console.log("\n\nCHAT_API_ERROR_BACKEND\n\n", error, `\n\n`)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
