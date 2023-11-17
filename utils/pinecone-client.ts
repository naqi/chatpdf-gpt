import { PineconeClient } from '@pinecone-database/pinecone';

if (!process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT || !process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
  //throw new Error('Pinecone environment or api key vars missing');
}

export async function initPinecone(environment: string, apiKey: string) {
  try {
    const pinecone = new PineconeClient();
    await pinecone.init({
      environment, //this is in the dashboard
      apiKey
    });

    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}


