// Import the generated Prisma client

import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import { initPinecone } from "@/utils/pinecone-client"
import { createClient } from "@supabase/supabase-js"
import axios from "axios"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PineconeStore } from "langchain/vectorstores/pinecone"
import { createPrisma } from "@/lib/prisma"
import {PINECONE_NAME_SPACE} from "@/config/pinecone";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";

import credentials from "@/utils/credentials";

export async function POST(request: Request) {
  const body = await request.json()
  const prisma = createPrisma()
  const supabase = createClient(credentials.supabaseUrl, credentials.supabaseKey)

  const data = await prisma.documents.create({
    data: {
      url: body?.url,
      // @ts-ignore
      name: body?.name,
    },
  })
  const {
    data: { publicUrl },
  }: any = supabase.storage.from(credentials.supabaseBucket).getPublicUrl(body.url)
  const res = await axios.get(publicUrl, { responseType: "arraybuffer" })

  // Write the PDF to a temporary file. This is necessary because the PDFLoader
  fs.writeFileSync(`/tmp/${data.id}.pdf`, res.data)
  const loader = new PDFLoader(`/tmp/${data.id}.pdf`)

  const rawDocs = await loader.load()
  /* Split text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1536,
    chunkOverlap: 200,
  })

  const docs = await textSplitter.splitDocuments(rawDocs)

  console.log(`creating vector store for ${body.name}...`)
  /*create and store the embeddings in the vectorStore*/
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: credentials.openaiApiKey,
    stripNewLines: true,
    verbose: true,
    timeout: 60000,
    maxConcurrency: 5,
  })
  await uploadToSupabase(docs, embeddings)
  // await uploadEmbeddingsToPinecone(docs, embeddings, data)
  return NextResponse.json({ data })
}

async function uploadToSupabase(docs, embeddings: OpenAIEmbeddings) {
  const supabase = createClient(credentials.supabaseUrl, credentials.supabaseKey)

  const vectorstore = await SupabaseVectorStore.fromDocuments(
    docs,
    embeddings,
    {
      client: supabase,
      tableName: "documents",
      queryName: "match_documents",
    }
  );
  return vectorstore
}

async function uploadEmbeddingsToPinecone(docs, embeddings, data) {
  const pinecone = await initPinecone()

  const checkStatus = async () => {
    const {status} = await pinecone.describeIndex({
      indexName: credentials.pineconeIndex,
    })
    if (status?.ready) {
      return status
    } else {
      return new Promise((resolve) => {
        setTimeout(() => resolve(checkStatus()), 5000)
      })
    }
  }

  await checkStatus()
  const index = pinecone.Index(credentials.pineconeIndex) //change to your own index name
  // pinecone_name_space is the id of the document
  //embed the PDF documents
  try {
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: data.id,
      textKey: "text",
    })
  } catch (err) {
    console.log(err)
  }
}
export async function GET(request: NextRequest) {
  // refactor this
  const prisma = createPrisma();
    const data = await prisma.documents.findMany({
        orderBy: {
            created_at: 'desc'
        }
    })
    return NextResponse.json({ data });
  }
