import jwt from "jsonwebtoken"
import jwkToPem from "jwk-to-pem"
import jwk from "../jwks.json"
var pem = jwkToPem(jwk)

export const validateCognitoToken = (accessToken) =>{
    try {
        var decodedToken = jwt.verify(accessToken, pem, {
          algorithms: ["RS256"],
        })
        if (decodedToken && decodedToken["cognito:groups"][0] === "admin") {
            return true
        }else{
            return false
        }
    }catch{
        return false
    }
}

export const configurationValues = {
    openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    pineconeEnvironment: process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT,
    pineconeBucket: process.env.PINECONE_BUCKET_NAME,
    pineconeIndex: process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME,
    pineconeApiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    supabaseBucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET,
    supabaseDatabaseUrl: process.env.NEXT_PUBLIC_DATABASE_URL,
    supabaseDirectUrl: process.env.NEXT_PUBLIC_DIRECT_URL,
  }