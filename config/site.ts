export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "LLM RAG Playground",
  description:
    "Chat with any pdf file, powered by Langchain, Pinecone, Supabase, OpenAI and Groq",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Documents",
      href: "/documents",
    },
  ],
  links: {
    github: "https://github.com/EmeraldLabs/chatpdf-gpt",
  },
}
