// Import the generated Prisma client

import { NextRequest, NextResponse } from "next/server"
import { initPinecone } from "@/utils/pinecone-client"
import { PrismaClient } from "@prisma/client"

import { createPrisma } from "@/lib/prisma"
import { supabaseClient } from "@/lib/supabase"
import credentials from "@/utils/credentials"
import axios from "axios";
import fs from "fs";
import {PDFLoader} from "langchain/document_loaders/fs/pdf";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {OpenAIEmbeddings} from "langchain/embeddings/openai";
import {PineconeStore} from "langchain/vectorstores/pinecone";

export async function POST(request: NextRequest, res: NextResponse) {
  const body = await request.json()
  const {publicUrl , id} = body
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
  const result = await axios.get(publicUrl, { responseType: "arraybuffer" })

  // Write the PDF to a temporary file. This is necessary because the PDFLoader
  fs.writeFileSync(`/tmp/${id}.pdf`, result.data)
  const loader = new PDFLoader(`/tmp/${id}.pdf`)

  const rawDocs = await loader.load()
  /* Split text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1536,
    chunkOverlap: 200,
  })

  const docs = await textSplitter.splitDocuments(rawDocs)

  console.log(`creating vector store for ${publicUrl}...`)
  /*create and store the embeddings in the vectorStore*/
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: credentials.openaiApiKey,
    stripNewLines: true,
    verbose: true,
    timeout: 60000,
    maxConcurrency: 5,
  })

  const index = pinecone.Index(credentials.pineconeIndex) //change to your own index name
  // pinecone_name_space is the id of the document
  //embed the PDF documents
  try {
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: id,
      textKey: "text",
    })
  } catch (err) {
    console.log(err)
  }

  return NextResponse.json({ message: "Document embedding created successfully." })
}
// @ts-ignore
export async function GET(request: NextRequest, { params: { id } }) {

  // refactor this
  const { supabaseDatabaseUrl } = credentials
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: supabaseDatabaseUrl,
      },
    },
  })
  const data = await prisma.documents.findFirst({
    where: {
      id,
    },
  })

  return NextResponse.json({ data })
}

// delete document and pinecone namespace for document. namespace is the same as the document id
// @ts-ignore
export async function DELETE(request: NextRequest, { params: { id } }) {

  const {
    pineconeIndex,
    supabaseBucket,
  } = credentials
  const prisma = createPrisma()
  const pinecone = await initPinecone()

  const document = await prisma.documents.delete({
    where: {
      id,
    },
  })
  console.log("document", document)
  // delete pinecone namespace
  const index = pinecone.Index(pineconeIndex)
  await index.delete1({ deleteAll: true, namespace: id })
  // delete supabase storage file
  const supabase = supabaseClient()
  const { data, error } = await supabase.storage
    .from(supabaseBucket)
    .remove([document.url])

  if (error) {
    console.log(error)
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
  return NextResponse.json({ message: "Document deleted" })
}
