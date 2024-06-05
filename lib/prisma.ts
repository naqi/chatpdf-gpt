import { PrismaClient } from "@prisma/client"
import credentials from "@/utils/credentials";

export const createPrisma = () => {
  const opts  ={
    datasources: {
      db: {
        url : credentials.supabaseDatabaseUrl,
      },
    },
  }
    const prisma = new PrismaClient(opts)
    return prisma
}
