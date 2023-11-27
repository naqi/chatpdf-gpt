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

export const initialChatMessage = {
  name: "system",
  text: "Act as an expert. Reply to questions about given data. Following is some of my child's information and you need to answer all my questions considering this context, ",
}

export const getChatTitle = async (messageHistory) => {
  const model = new ChatOpenAI({
    openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    modelName: "gpt-4",
    temperature: 0.3,
    maxTokens: 1000,
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

  const questionForTitle =
    "Please create an appropriate short chat title based on above message history"
  const sanitizedQuestionForTitle = `${questionForTitle
    .trim()
    .replaceAll("\n", " ")}`

  const response = await chain.call({
    input: sanitizedQuestionForTitle,
  })
  return response.response
}
