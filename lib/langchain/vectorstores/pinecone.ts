// langchain/pinecone.ts
import { initPinecone } from "@/utils/pinecone-client"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PINECONE_NAME_SPACE } from "@/config/pinecone"
import {SupabaseVectorStore} from "langchain/vectorstores/supabase";

export async function getPineconeStore(credentials, id = PINECONE_NAME_SPACE) {
  const { openaiApiKey, pineconeIndex } = credentials
  const pinecone = await initPinecone()
  const index = pinecone.Index(pineconeIndex)

  /* create vectorstore*/
  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ openAIApiKey: openaiApiKey, }),
    {
      pineconeIndex: index,
      textKey: "text",
      // namespace: id,
    }
  )

  return vectorStore
}
