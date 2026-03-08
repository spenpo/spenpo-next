'use client'

import React, { useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import styles from '@/app/labs/forged-seo/page.module.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  return value.trim().length > 0 && EMAIL_REGEX.test(value.trim())
}

type SubscribeStatus = 'success' | 'error' | 'invalid' | null

export function NewsletterSubscribe({ archetype }: { archetype: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<SubscribeStatus>(null)
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const showError = (submitAttempted || touched) && !isValidEmail(email)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const subscribed = searchParams.get('subscribed')
    const subscribe = searchParams.get('subscribe')
    if (subscribed === '1') setStatus('success')
    else if (subscribe === 'error') setStatus('error')
    else if (subscribe === 'invalid') setStatus('invalid')
  }, [searchParams])

  useEffect(() => {
    if (status == null) return
    const t = setTimeout(() => {
      router.replace(pathname, { scroll: false })
      setStatus(null)
    }, 6000)
    return () => clearTimeout(t)
  }, [status, pathname, router])

  return (
    <div className={styles.qrAndFormRow}>
      <Stack direction="column" spacing={1.5} sx={{ minWidth: 280 }}>
        {status === 'success' && (
          <Alert severity="success" onClose={() => setStatus(null)}>
            Thanks — check your inbox to confirm your subscription.
          </Alert>
        )}
        {status === 'error' && (
          <Alert severity="error" onClose={() => setStatus(null)}>
            Something went wrong. Please try again later.
          </Alert>
        )}
        {status === 'invalid' && (
          <Alert severity="warning" onClose={() => setStatus(null)}>
            Please enter a valid email address.
          </Alert>
        )}
        <form
          className={styles.newsletterForm}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!isValidEmail(email)) {
              setSubmitAttempted(true)
              return
            }
            setSubmitting(true)
            try {
              const formData = new FormData()
              formData.set('email', email.trim())
              formData.set('archetype', archetype)
              const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
              })
              const data = await res.json().catch(() => ({}))
              if (data.redirect) {
                window.location.href = data.redirect
                return
              }
              if (!res.ok) {
                setStatus('error')
              }
            } catch {
              setStatus('error')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <Typography>Enter your email</Typography>
          <TextField
            sx={{ fontSize: '16px' }}
            type="email"
            id="bd-email"
            label="Email"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            error={showError}
            helperText={showError ? (email.trim() ? 'Please enter a valid email address' : 'Email is required') : undefined}
            autoComplete="email"
            disabled={submitting}
          />
          <Button
            className="wp-block-button__link"
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? 'Subscribing…' : 'Subscribe'}
          </Button>
        </form>
      </Stack>
      <Image
        src="/images/buttondown-forged-seo.png"
        alt="Forged SEO QR code"
        width={200}
        height={200}
        className={styles.qrImage}
      />
    </div>
  )
}
