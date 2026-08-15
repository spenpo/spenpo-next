import { Resend } from 'resend'

/** Required to send invoice emails. Set in local `.env` and Vercel. */
export const resend = new Resend(process.env.RESEND_API_KEY)
