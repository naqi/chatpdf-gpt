// Import the generated Prisma client

import { NextRequest, NextResponse } from "next/server"
import { initPinecone } from "@/utils/pinecone-client"
import { PrismaClient } from "@prisma/client"

import { createPrisma } from "@/lib/prisma"
import { supabaseClient } from "@/lib/supabase"
import { configurationValues, validateCognitoToken } from "@/utils/auth"

// @ts-ignore
export async function GET(request: NextRequest, { params: { id } }) {
  // Get credentials from cookies
  const credentials = configurationValues
  if (!credentials) {
    return NextResponse.json({ messagee: "Unauthorized" })
  }
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

  const authHeader = JSON.parse(request.cookies.get("auth")?.value || null)
  if (!authHeader) {
    return NextResponse.json({ data: [] })
  } else {
    const isAuthorized = validateCognitoToken(authHeader.AccessToken)
    try {
      if (isAuthorized) {
       // Get credentials from cookies
  const credentials = configurationValues
  if (!credentials) {
    return NextResponse.json({ messagee: "Unauthorized" })
  }

  const {
    supabaseDatabaseUrl,
    pineconeEnvironment,
    pineconeApiKey,
    pineconeIndex,
    supabaseUrl,
    supabaseKey,
    supabaseBucket,
  } = credentials
  const prisma = createPrisma({ url: supabaseDatabaseUrl })
  const pinecone = await initPinecone(pineconeEnvironment, pineconeApiKey)

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
  const supabase = supabaseClient(supabaseUrl, supabaseKey)
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
      } else {
        return NextResponse.json({ messagee: "Unauthorized" })
      }
    } catch (error) {
      return NextResponse.json({ messagee: "Something went wrong" })
    }
  }
  
}
