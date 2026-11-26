import { PrismaClient } from '@prisma/client'

// Lazy singleton: do not construct PrismaClient while Next is collecting
// page data, or `next build` loads the query engine before it is needed.
// Reuse the same client across hot reloads and Vercel warm invocations.
// Pair with connection_limit=1 on DATABASE_URL for Hostinger's low cap.
// https://www.prisma.io/docs/orm/more-or-less/help-and-troubleshooting/nextjs-prisma-client-dev-practices

const prismaClientSingleton = () => new PrismaClient()

function getClient(): PrismaClient {
  const existing = globalThis.prisma
  if (existing) return existing
  const created = prismaClientSingleton()
  globalThis.prisma = created
  return created
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    // Avoid looking like a thenable during module evaluation.
    if (prop === 'then') return undefined
    const client = getClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
