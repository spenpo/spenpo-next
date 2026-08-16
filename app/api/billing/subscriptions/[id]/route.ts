import { NextRequest, NextResponse } from 'next/server'
import {
  getOwnedSubscription,
  getOwnedSubscriptionDetail,
  ownedPaymentMethod,
  setCustomerDefaultPaymentMethod,
} from '@/app/utils/billing'
import { requireBillingContext } from '@/app/utils/billingSession'
import { stripeBilling } from '@/app/utils/stripe'

const DEFAULT_DAYS_UNTIL_DUE = 30

type SubscriptionAction = 'cancel' | 'resume' | 'set_payment_method' | 'set_autopay'

type SubscriptionActionBody = {
  action?: SubscriptionAction
  paymentMethodId?: string
  enabled?: boolean
}

async function subscriptionResponse(customerId: string, subscriptionId: string) {
  const detail = await getOwnedSubscriptionDetail(customerId, subscriptionId)
  if (!detail) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }
  return NextResponse.json(detail)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const detail = await getOwnedSubscriptionDetail(context.customerId, params.id)
  if (!detail) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const context = await requireBillingContext()
  if ('error' in context) return context.error

  const subscription = await getOwnedSubscription(context.customerId, params.id)
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const body = (await req.json()) as SubscriptionActionBody
  const action = body.action

  try {
    if (action === 'cancel') {
      if (subscription.status === 'canceled') {
        return NextResponse.json(
          { error: 'This subscription is already canceled.' },
          { status: 400 }
        )
      }
      await stripeBilling.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      })
      return subscriptionResponse(context.customerId, subscription.id)
    }

    if (action === 'resume') {
      if (!subscription.cancel_at_period_end) {
        return NextResponse.json(
          { error: 'This subscription is not scheduled to cancel.' },
          { status: 400 }
        )
      }
      await stripeBilling.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      })
      return subscriptionResponse(context.customerId, subscription.id)
    }

    if (action === 'set_payment_method') {
      if (!body.paymentMethodId) {
        return NextResponse.json(
          { error: 'paymentMethodId is required' },
          { status: 400 }
        )
      }
      const method = await ownedPaymentMethod(
        context.customerId,
        body.paymentMethodId
      )
      if (!method) {
        return NextResponse.json(
          { error: 'Payment method not found' },
          { status: 404 }
        )
      }

      await Promise.all([
        stripeBilling.subscriptions.update(subscription.id, {
          default_payment_method: method.id,
        }),
        setCustomerDefaultPaymentMethod(context.customerId, method),
      ])
      return subscriptionResponse(context.customerId, subscription.id)
    }

    if (action === 'set_autopay') {
      if (typeof body.enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled is required' }, { status: 400 })
      }

      if (body.enabled) {
        const paymentMethodId =
          body.paymentMethodId ||
          (typeof subscription.default_payment_method === 'string'
            ? subscription.default_payment_method
            : subscription.default_payment_method?.id)

        if (!paymentMethodId) {
          return NextResponse.json(
            { error: 'Save a payment method before turning on autopay.' },
            { status: 400 }
          )
        }

        const method = await ownedPaymentMethod(context.customerId, paymentMethodId)
        if (!method) {
          return NextResponse.json(
            { error: 'Payment method not found' },
            { status: 404 }
          )
        }

        await Promise.all([
          stripeBilling.subscriptions.update(subscription.id, {
            collection_method: 'charge_automatically',
            default_payment_method: method.id,
            proration_behavior: 'none',
          }),
          setCustomerDefaultPaymentMethod(context.customerId, method),
        ])
        return subscriptionResponse(context.customerId, subscription.id)
      }

      await stripeBilling.subscriptions.update(subscription.id, {
        collection_method: 'send_invoice',
        days_until_due: subscription.days_until_due ?? DEFAULT_DAYS_UNTIL_DUE,
        proration_behavior: 'none',
      })
      return subscriptionResponse(context.customerId, subscription.id)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unable to update subscription'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
