import { render, toPlainText } from '@react-email/render'
import { Resend } from 'resend'
import type { ReactElement } from 'react'

/** Required to send invoice emails. Set in local `.env` and Vercel. */
export const resend = new Resend(process.env.RESEND_API_KEY || '')

/** Pre-render HTML so Resend does not dynamically import `@react-email/render`. */
export async function renderEmail(element: ReactElement) {
  const html = await render(element)
  return { html, text: toPlainText(html) }
}
