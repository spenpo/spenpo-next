import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripeBilling } from '@/app/utils/stripe'
import { sendInvoiceReminderEmail } from '@/app/utils/billingEmails'

export const dynamic = 'force-dynamic'

const REMINDER_MIN_AGE_DAYS = 5
const REMINDER_COOLDOWN_DAYS = 7

export async function GET() {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const minCreatedSeconds = nowSeconds - REMINDER_MIN_AGE_DAYS * 86400
  const cooldownSeconds = REMINDER_COOLDOWN_DAYS * 86400

  const remindedIds: string[] = []

  try {
    for await (const invoice of stripeBilling.invoices.list({
      status: 'open',
      limit: 100,
    })) {
      // Must be open with amount due
      if (invoice.status !== 'open' || invoice.amount_due <= 0) continue

      // Must be at least 5 days old
      if (invoice.created > minCreatedSeconds) continue

      // Skip if already overdue (handled by invoice.overdue webhook)
      if (invoice.due_date && invoice.due_date <= nowSeconds) continue

      // Check last reminder timestamp from metadata
      const lastSentStr = invoice.metadata?.reminder_sent_at
      if (lastSentStr) {
        const lastSent = parseInt(lastSentStr, 10)
        if (!isNaN(lastSent) && nowSeconds - lastSent < cooldownSeconds) {
          continue
        }
      }

      try {
        await sendInvoiceReminderEmail(invoice)
        await stripeBilling.invoices.update(invoice.id, {
          metadata: {
            ...invoice.metadata,
            reminder_sent_at: nowSeconds.toString(),
          },
        })
        remindedIds.push(invoice.id)
      } catch (sendErr) {
        console.error('Failed to send invoice reminder for', invoice.id, sendErr)
      }
    }

    return NextResponse.json({
      success: true,
      remindedCount: remindedIds.length,
      invoiceIds: remindedIds,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Invoice reminder cron error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
