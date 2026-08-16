export function firstSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value || undefined
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function emailsMatch(a?: string | null, b?: string | null) {
  if (!a || !b) return false
  return normalizeEmail(a) === normalizeEmail(b)
}

export function isSafeRelativePath(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
}

function pathAndSearch(path: string) {
  const url = new URL(path, 'https://spenpo.com')
  return `${url.pathname}${url.search}`
}

export function withEmailQuery(path: string, email?: string | null) {
  if (!email) return path
  const url = new URL(path, 'https://spenpo.com')
  if (!url.searchParams.get('email')) {
    url.searchParams.set('email', email)
  }
  return pathAndSearch(url.pathname + url.search)
}

export function billingSignInUrl(returnPath: string, email?: string | null) {
  const params = new URLSearchParams()
  params.set('redirect', returnPath)
  if (email) params.set('email', email)
  return `/auth/signin?${params.toString()}`
}

export function signInCallbackUrl(searchParams: {
  redirect?: string | string[]
  redisId?: string | string[]
  email?: string | string[]
}) {
  const redirectTo = firstSearchParam(searchParams.redirect)
  const redisId = firstSearchParam(searchParams.redisId)
  const email = firstSearchParam(searchParams.email)

  let path = redirectTo && isSafeRelativePath(redirectTo) ? redirectTo : '/'
  if (redisId) {
    const url = new URL(path, 'https://spenpo.com')
    url.searchParams.set('cache', redisId)
    path = pathAndSearch(url.pathname + url.search)
  }
  return withEmailQuery(path, email)
}
