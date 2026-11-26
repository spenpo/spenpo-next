import { PrismaClient } from '@prisma/client'

// Instantiate once per Node process so Next.js hot reloads and Vercel
// serverless warm invocations reuse the same client instead of opening a
// new MySQL pool each time. Hostinger shared MySQL has a low connection
// limit; pair this singleton with connection_limit=1 on DATABASE_URL.
// https://www.prisma.io/docs/orm/more-or-less/help-and-troubleshooting/nextjs-prisma-client-dev-practices

const prismaClientSingleton = () => new PrismaClient()

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

globalThis.prisma = prisma
