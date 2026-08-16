/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from '@prisma/client'
import {
  ProjectEnvVariableInput,
  VercelProjectInput,
} from '@/app/context/shoppingCart'
import {
  cloneRepo,
  createBlob,
  createCommit,
  createTree,
  getMainTree,
  pushCommit,
} from '@/app/services/github'
import {
  addDomainToProject,
  createProject,
  getProjectDeployments,
  purchaseDomain,
  redeployProject,
} from '@/app/services/vercel'
import prisma from '@/app/utils/prisma'
import Stripe from 'stripe'
import redis from '@/app/utils/redis'
import { JsonObject } from '@prisma/client/runtime/library'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  sendFirstPaymentMethodEmail,
  sendInvoiceEventEmail,
} from '@/app/utils/billingEmails'
import {
  reconcileDraftInvoiceBankDiscount,
  reconcileSubscriptionBankDiscount,
} from '@/app/utils/billing'
import { stripeProduct } from '@/app/utils/stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

const gitRepository = (projectName: string) => {
  return {
    repo: projectName,
    type: 'github',
  }
}

const framework = 'nextjs'

export async function POST(req: NextRequest) {
  const sig = headers().get('stripe-signature')
  // Request Body.
  const rawBody = await req.text()

  let event

  try {
    if (sig)
      event = stripeProduct.webhooks.constructEvent(rawBody, sig, endpointSecret)
  } catch (err: any) {
    return NextResponse.json({
      status: 400,
      message: `Webhook Error: ${err.message}`,
    })
  }

  switch (event?.type) {
    case 'payment_intent.succeeded':
      console.log(
        'payment intent succeeded',
        (event.data.object as Stripe.PaymentIntent).id
      )
      break
    case 'invoice.created': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(event.type, invoice.id)
      try {
        await reconcileDraftInvoiceBankDiscount(invoice.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('billing invoice bank discount error', message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      try {
        await sendInvoiceEventEmail(event.type, invoice)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('billing invoice email error', message)
      }
      break
    }
    case 'invoice.finalized':
    case 'invoice.overdue':
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log(event.type, invoice.id)
      try {
        await sendInvoiceEventEmail(event.type, invoice)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('billing invoice email error', message)
      }
      break
    }
    case 'invoice.voided':
      console.log(event.type, (event.data.object as Stripe.Invoice).id)
      break
    case 'payment_method.attached': {
      const method = event.data.object as Stripe.PaymentMethod
      console.log(event.type, method.id)
      try {
        await sendFirstPaymentMethodEmail(method)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('billing first-method email error', message)
      }
      break
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      console.log(event.type, subscription.id)
      try {
        await reconcileSubscriptionBankDiscount(subscription.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('billing subscription bank discount error', message)
        return NextResponse.json({ error: message }, { status: 500 })
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log(event.type, (event.data.object as Stripe.Subscription).id)
      break
    case 'charge.succeeded':
      const CHARGE_SUCCEEDED = event.data.object

      const orderId = CHARGE_SUCCEEDED.metadata.orderId

      const order = await prisma.order.findFirst({
        where: { id: orderId },
      })

      const METADATA = order?.metadata as Prisma.JsonObject

      const EXTENSION = String(METADATA?.headshotExtension)
      const CLIENT_NAME = String(METADATA?.clientName)
      const PROJECT_NAME = String(METADATA?.projectName)
      const DOMAIN_NAME = String(METADATA?.domainName)
      const DOMAIN_PRICE = Number(METADATA?.price) / 100
      const DOMAIN_RENEW = Boolean(METADATA?.renew)
      const ENVIRONMENT_VARIABLES =
        METADATA?.environmentVariables as Prisma.JsonArray as unknown as ProjectEnvVariableInput[]

      let vercelApp: string = PROJECT_NAME
      let githubProject: string = PROJECT_NAME

      const IS_DOMAIN_PURCHASE = !DOMAIN_NAME.endsWith('.vercel.app')

      // 1. purchase domain
      if (IS_DOMAIN_PURCHASE) {
        try {
          await purchaseDomain(DOMAIN_NAME, DOMAIN_PRICE, DOMAIN_RENEW)
        } catch (err: any) {
          console.log(1, 'catch', err.error)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                clientName: CLIENT_NAME,
              },
              error: {
                step: 1,
                ...err.error,
              },
            },
          })
          break
        }
      }

      const assignDomain = async (metadata: JsonObject) => {
        // add www domain
        try {
          await addDomainToProject(vercelApp, `www.${DOMAIN_NAME}`)
        } catch (err: any) {
          console.log(4, 'catch', err.error)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata,
              error: {
                step: 4,
                ...err.error,
              },
            },
          })
          return false
        }

        // add domain redirect
        try {
          await addDomainToProject(vercelApp, DOMAIN_NAME, `www.${DOMAIN_NAME}`, 308)
          return true
        } catch (err: any) {
          console.log(4, 'catch', err.error)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata,
              error: {
                step: 4,
                ...err.error,
              },
            },
          })
          return false
        }
      }

      if (order?.productId === 'landing-page') {
        // 2. clone landing repo
        let attempts = 0

        const clone = async (): Promise<any> => {
          try {
            return await cloneRepo(
              `${PROJECT_NAME}${attempts > 0 ? `-${attempts}` : ''}`,
              CLIENT_NAME
            )
          } catch (err: any) {
            console.log(2, 'catch', err.response.data)
            if (err.status === 422) {
              attempts += 1
              return await clone()
            } else return err
          }
        }
        let cloneRes

        try {
          cloneRes = await clone()
        } catch (err: any) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                clientName: CLIENT_NAME,
              },
              error: {
                step: 2,
                ...err.response.data,
                body: err.request.body,
              },
            },
          })
          break
        }

        // 3. create new vercel project
        let createProjectRes
        githubProject = cloneRes.data.name

        const project: VercelProjectInput = {
          name: cloneRes.data.name,
          framework,
          gitRepository: gitRepository(cloneRes.data.full_name),
          environmentVariables: [
            ...ENVIRONMENT_VARIABLES,
            ...['GH_TOKEN', 'VERCEL_TOKEN', 'VERCEL_TEAM'].map((v) => {
              return {
                key: v,
                target: ['production', 'preview', 'development'],
                type: 'encrypted',
                value: process.env[v],
              }
            }),
            {
              key: 'NEXT_PUBLIC_PROJECT_NAME',
              target: ['production', 'preview', 'development'],
              type: 'encrypted',
              value: cloneRes.data.name,
            },
          ],
        }

        try {
          createProjectRes = await createProject(project)
        } catch (err: any) {
          console.log(3, 'catch', err.error)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 3,
                ...err.error,
              },
            },
          })
          break
        }

        const projectData = await createProjectRes.json()
        vercelApp = projectData.name

        // 4. add domain to project
        if (IS_DOMAIN_PURCHASE) {
          const assign = await assignDomain({
            ...(project as unknown as Prisma.JsonObject),
            projectName: { vercelApp, githubProject },
            clientName: CLIENT_NAME,
          })
          if (!assign) break
        }

        // fetch headshot
        const cache = await redis.hgetall(order?.userId || '')
        const headshotBase64 = cache.HEADSHOT_FILE

        // 5. create blob of headshot
        let blobShaRes

        try {
          blobShaRes = await createBlob(githubProject, headshotBase64)
        } catch (err: any) {
          console.log(5, 'catch', err.response.data)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 5,
                ...err.response.data,
                body: err.request.body,
              },
            },
          })
          break
        }

        // 6. get main tree sha
        const main = async (): Promise<any> => {
          try {
            return await getMainTree(githubProject)
          } catch (err: any) {
            console.log(6, 'catch', err.response.data)
            if (err.status === 404) {
              return await main()
            } else return err
          }
        }

        let mainTreeShaRes

        try {
          mainTreeShaRes = await main()
        } catch (err: any) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 6,
                ...err.response.data,
              },
            },
          })
          break
        }

        // 7. create tree with headshot file
        let newTreeShaRes

        try {
          newTreeShaRes = await createTree(
            githubProject,
            mainTreeShaRes.data.commit.sha,
            `headshot.${EXTENSION}`,
            blobShaRes.data.sha
          )
        } catch (err: any) {
          console.log(7, 'catch', err.response.data)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 7,
                ...err.response.data,
                body: err.request.body,
              },
            },
          })
          break
        }

        // 8. create commit to new repo
        let newCommitShaRes

        try {
          newCommitShaRes = await createCommit(
            githubProject,
            mainTreeShaRes.data.commit.sha,
            newTreeShaRes.data.sha
          )
        } catch (err: any) {
          console.log(8, 'catch', err.response.data)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 8,
                ...err.response.data,
                body: err.request.body,
              },
            },
          })
          break
        }

        // 9. push commit to deploy vercel project
        try {
          await pushCommit(githubProject, newCommitShaRes.data.sha)
        } catch (err: any) {
          console.log(9, 'catch', err.response.data)
          await prisma.order.update({
            where: { id: orderId },
            data: {
              metadata: {
                ...(project as unknown as Prisma.JsonObject),
                projectName: { vercelApp, githubProject },
                clientName: CLIENT_NAME,
              },
              error: {
                step: 9,
                ...err.response.data,
                body: err.request.body,
              },
            },
          })
          break
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            metadata: {
              ...(project as unknown as Prisma.JsonObject),
              projectName: { vercelApp, githubProject },
              clientName: CLIENT_NAME,
            },
            complete: true,
          },
        })
        break
      } else if (order?.productId === 'domain') {
        const metadata = {
          project: PROJECT_NAME,
          domain: DOMAIN_NAME,
          price: DOMAIN_PRICE,
          renew: DOMAIN_RENEW,
        }

        const assign = await assignDomain(metadata)

        if (!assign) break

        const deploymentsReq = await getProjectDeployments(PROJECT_NAME, 1)
        const deployments = await deploymentsReq.json()

        await redeployProject(deployments.deployments[0].uid, PROJECT_NAME)

        await prisma.order.update({
          where: { id: orderId },
          data: {
            metadata,
            complete: true,
          },
        })
        break
      }

    case 'payment_intent.created':
      console.log('payment intent created')

      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event?.type}`)
  }

  return NextResponse.json('event received')
}

export async function GET() {
  return NextResponse.json({ status: 400, error: 'Bad Request' })
}
