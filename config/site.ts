export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Document Chat",
  description:
    "Chat with any pdf file, powered by Langchain, Pinecone, Supabase and OpenAI",
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
  },
}
