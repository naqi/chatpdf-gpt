import { PineconeClient } from '@pinecone-database/pinecone';
import credentials from "@/utils/credentials";

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
  //throw new Error('Pinecone environment or api key vars missing');
}

export async function initPinecone() {
  try {
    const pinecone = new PineconeClient();
    await pinecone.init({
      environment : credentials.pineconeEnvironment, //this is in the dashboard
      apiKey : credentials.pineconeApiKey
    });

    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}


