import { NextRequest, NextResponse } from 'next/server'

const BUTTONDOWN_API = 'https://api.buttondown.com/v1/subscribers'

export async function POST(request: NextRequest) {
  const apiKey = process.env.BUTTONDOWN_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Newsletter subscription is not configured' },
      { status: 500 }
    )
  }

  let email: string
  let archetype: string
  const referer = request.headers.get('referer') ?? null

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    if (!body?.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    email = String(body.email).trim()
    archetype = body.archetype ? String(body.archetype).trim() : 'unknown'
  } else {
    const formData = await request.formData()
    email = formData.get('email') ? String(formData.get('email')).trim() : ''
    archetype = formData.get('archetype')
      ? String(formData.get('archetype')).trim()
      : 'unknown'
  }

  const requestOrigin = new URL(request.url).origin
  const successUrl =
    referer && new URL(referer).origin === requestOrigin ? referer : null
  const wantsJson =
    request.headers.get('accept')?.includes('application/json') ?? false

  const redirectTo = (query: string) =>
    successUrl
      ? `${successUrl}${successUrl.includes('?') ? '&' : '?'}${query}#newsletter-subscribe`
      : null

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const url = redirectTo('subscribe=invalid')
    if (wantsJson && url) return NextResponse.json({ redirect: url }, { status: 400 })
    if (url) return NextResponse.redirect(url)
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  try {
    const res = await fetch(BUTTONDOWN_API, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        metadata: {
          archetype,
        },
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[subscribe] Buttondown error', res.status, data)
      const url = redirectTo('subscribe=error')
      if (wantsJson && url) return NextResponse.json({ redirect: url }, { status: res.status })
      if (url) return NextResponse.redirect(url)
      return NextResponse.json(
        { error: data.detail ?? 'Subscription failed' },
        { status: res.status }
      )
    }

    const successRedirect = redirectTo('subscribed=1')
    if (wantsJson && successRedirect) return NextResponse.json({ redirect: successRedirect })
    if (successRedirect) return NextResponse.redirect(successRedirect)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[subscribe]', err)
    const url = redirectTo('subscribe=error')
    if (wantsJson && url) return NextResponse.json({ redirect: url }, { status: 500 })
    if (url) return NextResponse.redirect(url)
    return NextResponse.json(
      { error: 'Subscription failed' },
      { status: 500 }
    )
  }
}
