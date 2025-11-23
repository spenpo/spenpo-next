import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tag = searchParams.get('tag')

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag parameter is required' },
        { status: 400 }
      )
    }

    revalidateTag(tag)
    return NextResponse.json({ revalidated: true, tag })
  } catch (error) {
    return NextResponse.json({ error: 'Error revalidating tag' }, { status: 500 })
  }
}
