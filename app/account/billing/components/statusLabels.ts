export function invoiceStatusLabel(
  status?: string | null,
  paymentIntentStatus?: string | null
) {
  if (paymentIntentStatus === 'processing') return 'Processing'
  switch (status) {
    case 'draft':
      return 'Ready to pay'
    case 'open':
      return 'Due'
    case 'paid':
      return 'Paid'
    case 'void':
      return 'Void'
    case 'uncollectible':
      return 'Unpaid'
    default:
      return status ?? 'Unknown'
  }
}

export function subscriptionStatusLabel(
  status: string,
  cancelAtPeriodEnd?: boolean
) {
  if (cancelAtPeriodEnd) return 'Cancels at period end'
  switch (status) {
    case 'active':
      return 'Active'
    case 'trialing':
      return 'Trial'
    case 'past_due':
      return 'Past due'
    case 'paused':
      return 'Paused'
    case 'incomplete':
      return 'Incomplete'
    case 'unpaid':
      return 'Unpaid'
    case 'canceled':
      return 'Canceled'
    case 'incomplete_expired':
      return 'Expired'
    default:
      return status
  }
}
