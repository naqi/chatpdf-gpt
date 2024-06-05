// langchain/pinecone.ts

import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { PINECONE_NAME_SPACE } from "@/config/pinecone"
import {SupabaseVectorStore} from "langchain/vectorstores/supabase";
import {createClient} from "@supabase/supabase-js";
import credentials from "@/utils/credentials";

export async function getSupabaseStore() {
  const { openaiApiKey, supabaseKey, supabaseUrl } = credentials
  const supabase = createClient(supabaseUrl, supabaseKey)
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: openaiApiKey,
    stripNewLines: true,
    verbose: true,
    timeout: 60000,
    maxConcurrency: 5,
  })
  /* create vectorstore*/
  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  })

  return vectorStore
}
