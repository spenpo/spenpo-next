import {
  ProjectEnvVariableInput,
  VercelProjectInput,
} from '@/app/context/shoppingCart'

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
}

const createProject = async (project: VercelProjectInput) =>
  fetch(`https://api.vercel.com/v9/projects?teamId=${process.env.VERCEL_TEAM}`, {
    body: JSON.stringify(project),
    headers,
    method: 'post',
  })

const getProject = async (name: string) =>
  fetch(
    `https://api.vercel.com/v9/projects/${name}?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
      next: { tags: [name] },
    }
  )

const getProjectDeployments = async (app: string, limit?: number) =>
  fetch(
    `https://api.vercel.com/v2/deployments?app=${app}${
      limit ? `&limit=${limit}` : ''
    }&teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
    }
  )

const getDeploymentAliases = async (deploymentId: string) =>
  fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/aliases?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
    }
  )

const redeployProject = async (deploymentId: string, name: string) =>
  fetch(`https://api.vercel.com/v13/deployments?teamId=${process.env.VERCEL_TEAM}`, {
    body: JSON.stringify({
      name,
      deploymentId,
    }),
    headers,
    method: 'post',
  })

const cancelDeployment = async (deploymentId: string) =>
  fetch(
    `https://api.vercel.com/v12/deployments/${deploymentId}/cancel?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'PATCH',
    }
  )

const addEnvironmentVariables = async (
  projectName: string,
  variables: ProjectEnvVariableInput[]
) =>
  fetch(
    `https://api.vercel.com/v10/projects/${projectName}/env?teamId=${process.env.VERCEL_TEAM}`,
    {
      body: JSON.stringify(variables),
      headers,
      method: 'post',
    }
  )

const getDeployment = async (deploymentId: string) =>
  fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
    }
  )

const getDeploymentEvents = async (deploymentId: string) =>
  fetch(
    `https://api.vercel.com/v2/deployments/${deploymentId}/events?builds=1&direction=forward&follow=1&teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
    }
  )

type RegistrarError = {
  error: { message: string; code?: string }
}

const registrarUrl = (path: string, query?: string) =>
  `https://api.vercel.com/v1/registrar/${path}?teamId=${process.env.VERCEL_TEAM}${
    query ? `&${query}` : ''
  }`

const parsePrice = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

const registrarError = (data: any, status?: number): RegistrarError => {
  const seconds = data?.retryAfter?.value
  const code = data?.error?.code ?? data?.code
  const message =
    data?.error?.message ??
    data?.message ??
    `Vercel registrar request failed${status ? ` (${status})` : ''}`
  if (status === 429 || code === 'too_many_requests') {
    return {
      error: {
        code,
        message:
          typeof seconds === 'number'
            ? `Rate limit exceeded, try again in ${Math.ceil(seconds)} seconds`
            : message,
      },
    }
  }
  return { error: { message, code } }
}

const getRegistrarContact = () => {
  const raw = process.env.DOMAIN_REGISTRANT_CONTACT
  if (!raw) {
    throw {
      error: {
        message:
          'DOMAIN_REGISTRANT_CONTACT is not configured. Add registrant WHOIS JSON to buy domains.',
      },
    }
  }
  try {
    const contact = JSON.parse(raw)
    const required = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address1',
      'city',
      'state',
      'zip',
      'country',
    ]
    const missing = required.filter((key) => !contact[key])
    if (missing.length) {
      throw {
        error: {
          message: `DOMAIN_REGISTRANT_CONTACT is missing: ${missing.join(', ')}`,
        },
      }
    }
    return contact
  } catch (err: any) {
    if (err?.error) throw err
    throw {
      error: { message: 'DOMAIN_REGISTRANT_CONTACT must be valid JSON' },
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForDomainOrder = async (orderId: string) => {
  const timeoutMs = 60_000
  const intervalMs = 2_000
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const req = await fetch(registrarUrl(`orders/${encodeURIComponent(orderId)}`), {
      headers,
      method: 'get',
      cache: 'no-store',
    })
    const data = await req.json()
    if (!req.ok) throw registrarError(data, req.status)
    if (data.status === 'completed') return data
    if (data.status === 'failed') {
      throw {
        error: data.error ?? { message: 'Domain purchase failed' },
      }
    }
    await delay(intervalMs)
  }
  throw {
    error: { message: `Domain purchase timed out (order ${orderId})` },
  }
}

const getDomainStatus = async (name: string) => {
  const req = await fetch(
    registrarUrl(`domains/${encodeURIComponent(name)}/availability`),
    {
      headers,
      method: 'get',
      next: { tags: [name] },
    }
  )
  const data = await req.json()
  if (!req.ok || data.available === undefined) return registrarError(data, req.status)
  return { available: Boolean(data.available) }
}

const getDomainsAvailability = async (
  names: string[]
): Promise<{ results: { domain: string; available: boolean }[] } | RegistrarError> => {
  if (names.length === 0) return { results: [] }
  const req = await fetch(registrarUrl('domains/availability'), {
    headers,
    method: 'post',
    body: JSON.stringify({ domains: names }),
  })
  const data = await req.json()
  if (!req.ok || !Array.isArray(data.results)) return registrarError(data, req.status)
  return {
    results: data.results as { domain: string; available: boolean }[],
  }
}

const getDomainPrice = async (
  name: string
): Promise<
  | {
      price?: number
      purchasePrice?: number
      renewalPrice?: number
      years?: number
    }
  | RegistrarError
> => {
  const req = await fetch(
    registrarUrl(`domains/${encodeURIComponent(name)}/price`, 'years=1'),
    {
      headers,
      method: 'get',
      next: { tags: [name] },
    }
  )
  const data = await req.json()
  if (!req.ok) return registrarError(data, req.status)
  const purchasePrice = parsePrice(data.purchasePrice) ?? parsePrice(data.price)
  const renewalPrice = parsePrice(data.renewalPrice)
  return {
    purchasePrice,
    renewalPrice,
    price: purchasePrice,
    years: parsePrice(data.years),
  }
}

const getDomainInfo = async (name: string) =>
  fetch(
    `https://api.vercel.com/v5/domains/${name}?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
      next: {
        tags: [name],
      },
    }
  )

const purchaseDomain = async (name: string, expectedPrice: number, renew: boolean) => {
  const existingRes = await getDomainInfo(name)
  if (existingRes.ok) {
    const existing = await existingRes.json()
    if (existing?.domain) return existingRes
  }

  const req = await fetch(registrarUrl(`domains/${encodeURIComponent(name)}/buy`), {
    body: JSON.stringify({
      autoRenew: renew,
      years: 1,
      expectedPrice,
      contactInformation: getRegistrarContact(),
    }),
    headers,
    method: 'post',
  })
  const data = await req.json()
  if (!req.ok) throw registrarError(data, req.status)
  if (data.orderId) await waitForDomainOrder(data.orderId)
  return data
}

const addDomainToProject = async (
  project: string,
  name: string,
  redirect?: string,
  redirectStatusCode?: number
) =>
  fetch(
    `https://api.vercel.com/v10/projects/${project}/domains?teamId=${process.env.VERCEL_TEAM}`,
    {
      body: JSON.stringify({
        name,
        redirect: redirect || null,
        redirectStatusCode: redirectStatusCode || null,
      }),
      headers,
      method: 'post',
    }
  )

const removeDomainFromProject = async (project: string, domain: string) =>
  fetch(
    `https://api.vercel.com/v9/projects/${project}/domains/${domain}?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'delete',
    }
  )

const getProjectDomains = async (project: string) =>
  fetch(
    `https://api.vercel.com/v9/projects/${project}/domains?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'get',
    }
  )

const updateProjectDomain = async (
  project: string,
  domain: string,
  redirect: string | null,
  redirectStatusCode: number | null
) =>
  fetch(
    `https://api.vercel.com/v9/projects/${project}/domains/${domain}?teamId=${process.env.VERCEL_TEAM}`,
    {
      headers,
      method: 'PATCH',
      body: JSON.stringify({
        redirect,
        redirectStatusCode,
      }),
    }
  )

export {
  createProject,
  getProject,
  getProjectDeployments,
  getDeploymentAliases,
  redeployProject,
  cancelDeployment,
  addEnvironmentVariables,
  getDeployment,
  getDeploymentEvents,
  getDomainStatus,
  getDomainsAvailability,
  getDomainPrice,
  getDomainInfo,
  purchaseDomain,
  addDomainToProject,
  removeDomainFromProject,
  getProjectDomains,
  updateProjectDomain,
}
