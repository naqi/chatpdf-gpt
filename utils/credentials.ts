const credentials = {
  openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  pineconeEnvironment: process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT,
  pineconeIndex: process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME,
  pineconeApiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
  supabaseBucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET,
  supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
}

export default credentials;
