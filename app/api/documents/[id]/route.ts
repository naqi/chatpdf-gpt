// Import the generated Prisma client

import { NextRequest, NextResponse } from "next/server"
import { initPinecone } from "@/utils/pinecone-client"
import { PrismaClient } from "@prisma/client"

import { createPrisma } from "@/lib/prisma"
import { supabaseClient } from "@/lib/supabase"
import credentials from "@/utils/credentials"

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
