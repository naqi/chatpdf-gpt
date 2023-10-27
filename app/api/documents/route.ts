// Import the generated Prisma client

import fs from "fs"
import { NextRequest, NextResponse } from "next/server"
import { configurationValues, validateCognitoToken } from "@/utils/auth"
import { initPinecone } from "@/utils/pinecone-client"
import { createClient } from "@supabase/supabase-js"
import axios from "axios"
import { PDFLoader } from "langchain/document_loaders/fs/pdf"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { PineconeStore } from "langchain/vectorstores/pinecone"

import { PINECONE_NAME_SPACE } from "@/config/pinecone"
import { createPrisma } from "@/lib/prisma"


export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || null
  if (!authHeader) {
    return NextResponse.json({ data: [] })
  } else {
    try {
      const isAuthorized = validateCognitoToken(authHeader)

      if (isAuthorized) {
        const body = await request.json()
        const {
          openaiApiKey,
          supabaseBucket,
          pineconeEnvironment,
          supabaseUrl,
          supabaseKey,
          pineconeIndex,
          pineconeApiKey,
          supabaseDatabaseUrl,
        } = configurationValues
        const prisma = createPrisma({ url: supabaseDatabaseUrl })
        const supabase = createClient(supabaseUrl, supabaseKey)
        const pinecone = await initPinecone(pineconeEnvironment, pineconeApiKey)
        const data = await prisma.documents.create({
          data: {
            url: body?.url,
            // @ts-ignore
            name: body?.name,
          },
        })
        const {
          data: { publicUrl },
        }: any = supabase.storage.from(supabaseBucket).getPublicUrl(body.url)
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
          openAIApiKey: openaiApiKey,
          stripNewLines: true,
          verbose: true,
          timeout: 60000,
          maxConcurrency: 5,
        })
        const index = pinecone.Index(pineconeIndex) //change to your own index name
        // pinecone_name_space is the id of the document
        //embed the PDF documents
        await PineconeStore.fromDocuments(docs, embeddings, {
          pineconeIndex: index,
          namespace: data.id,
          textKey: "text",
        })

        return NextResponse.json({ data })
      } else {
        return NextResponse.json({ message: "Unauthorized" })
      }
    } catch (error) {
      return NextResponse.json({ message: "Something went wrong" })
    }
  }
}

export async function GET(request: NextRequest) {
  // Get credentials from cookies
  const credentials = configurationValues
  if (!credentials) {
    return NextResponse.json({ messagee: "Unauthorized" })
  }
  const authHeader = JSON.parse(request.cookies.get("auth")?.value || null)
  if (!authHeader) {
    return NextResponse.json({ data: [] })
  } else {
    try {
      console.log(authHeader)
      const isAuthorized = validateCognitoToken(authHeader.AccessToken)

      if (isAuthorized) {
        const { supabaseDatabaseUrl, supabaseDirectUrl } = credentials
        const prisma = createPrisma({ url: supabaseDatabaseUrl })
        const data = await prisma.documents.findMany({
          orderBy: {
            created_at: "desc",
          },
        })
        return NextResponse.json({ data })
      } else {
        return NextResponse.json({ message: "Unauthorized", data: [] })
      }
    } catch (error) {
      return NextResponse.json({ message: "Something went wrong" })
    }
  }
}
