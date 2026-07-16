import prisma from '@/app/utils/prisma'
import redis from '@/app/utils/redis'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cachedWords = await redis.get('mandarin')
    if (cachedWords) return NextResponse.json(JSON.parse(cachedWords))
  } catch {
    // Cache miss / Redis unavailable — fall through to Prisma
  }

  const data = await prisma.mandarin.findMany()

  try {
    await redis.setex('mandarin', 60 * 60, JSON.stringify(data))
  } catch {
    // Ignore cache write failures
  }

  return NextResponse.json(data)
}
