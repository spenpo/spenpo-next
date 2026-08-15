'use client'
import { ShoppingCartContext } from '@/app/context/shoppingCart'
import { Box, Step, StepButton, Stepper as MuiStepper } from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'

export const LANDING_STEPS = [
  { label: 'Design it', href: 'design', sectionId: 'step-design' },
  { label: 'Name it', href: 'domain', sectionId: 'step-name' },
  { label: 'Secure it', href: 'password', sectionId: 'step-secure' },
  { label: 'Claim it', href: 'checkout', sectionId: 'step-claim' },
] as const

const SECTION_IDS = LANDING_STEPS.map((step) => step.sectionId)

function useScrollSpy(enabled: boolean) {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!enabled) return

    const nodes = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    )
    if (nodes.length === 0) return

    const visibility = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.isIntersecting)
        }
        setActive(
          SECTION_IDS.reduce(
            (current, id, index) => (visibility.get(id) ? index : current),
            -1
          )
        )
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [enabled])

  return active
}

export const Stepper: React.FC<{
  variant?: 'flow' | 'overview'
}> = ({ variant = 'flow' }) => {
  const router = useRouter()
  const pathname = usePathname()
  const { domainName, passwordSet } = useContext(ShoppingCartContext)
  const isOverview = variant === 'overview'
  const pathStep = LANDING_STEPS.findIndex(
    (step) => step.href === (pathname.split('/').pop() ?? '')
  )
  const spyStep = useScrollSpy(isOverview)
  const activeStep = isOverview ? spyStep : pathStep
  const completedByIndex = isOverview
    ? LANDING_STEPS.map((_, index) => index < activeStep)
    : [true, !!domainName?.[0], passwordSet, false]

  return (
    <Box
      component="nav"
      aria-label="Landing page steps"
      sx={
        isOverview
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 2,
              py: 1.5,
              mx: { xs: -2, sm: -5 },
              px: { xs: 2, sm: 5 },
              bgcolor: 'background.default',
              borderBottom: 1,
              borderColor: 'divider',
            }
          : { flex: 1 }
      }
    >
      <MuiStepper
        nonLinear
        activeStep={activeStep}
        sx={{
          '& .MuiStepLabel-label': {
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            whiteSpace: { xs: 'normal', sm: 'nowrap' },
            color: 'text.secondary',
            '&.Mui-active': {
              color: 'text.primary',
              fontWeight: 600,
            },
            '&.Mui-completed': {
              color: 'text.secondary',
            },
            '&.Mui-disabled': {
              color: 'text.disabled',
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'divider',
          },
          '& .MuiStepIcon-root': {
            color: 'action.disabled',
            '&.Mui-active, &.Mui-completed': {
              color: 'primary.main',
            },
          },
        }}
      >
        {LANDING_STEPS.map((step, index) => {
          const disabled = !isOverview && index > Math.max(pathStep, 1)

          return (
            <Step
              key={step.href}
              completed={completedByIndex[index]}
              disabled={disabled}
            >
              <StepButton
                disabled={disabled}
                onClick={() => {
                  if (isOverview) {
                    document
                      .getElementById(step.sectionId)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    return
                  }
                  router.replace(step.href)
                }}
              >
                {step.label}
              </StepButton>
            </Step>
          )
        })}
      </MuiStepper>
    </Box>
  )
}
