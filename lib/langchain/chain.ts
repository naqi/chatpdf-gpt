// langchain/chain.ts
import { ConversationChain, VectorDBQAChain } from "langchain/chains"
import { ChatMessageHistory } from "langchain/memory"
import { mapStoredMessagesToChatMessages } from "@/lib/langchain/schema"
import { BufferMemory } from "langchain/memory"
import { BaseChatMessage, ChainValues } from "langchain/schema"
import { BaseLanguageModel } from "langchain/base_language"
import { VectorStore } from "langchain/vectorstores/base"
import { ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder, SystemMessagePromptTemplate } from "langchain/prompts"

export function getChain(model: BaseLanguageModel, vectorStore: VectorStore, sanitizedQuestion: any, history: BaseChatMessage[]) {
  const lcChatMessageHistory = new ChatMessageHistory(
    mapStoredMessagesToChatMessages(history)
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
  ]);
  const chain = new ConversationChain({
    memory: memory,
    llm: model,
    prompt: chatPrompt,
  });


  // const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
  //   returnSourceDocuments: true,
  // })

  const response: string | ChainValues = chain.call({
    input: sanitizedQuestion,
  })

  return response
}
