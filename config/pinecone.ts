/**
 * Change the namespace to the namespace on Pinecone you'd like to store your embeddings.
 */

if (!process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME) {
  // throw new Error('Missing Pinecone index name in .env file');
}

const NEXT_PUBLIC_PINECONE_INDEX_NAME = process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME ?? '';

const PINECONE_NAME_SPACE = 'pdf-test'; //namespace is optional for your vectors

export { NEXT_PUBLIC_PINECONE_INDEX_NAME, PINECONE_NAME_SPACE };
