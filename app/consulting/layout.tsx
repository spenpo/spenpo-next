import { ReactNode } from 'react'

export default function ConsultingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: 'html { scroll-behavior: smooth; }',
        }}
      />
      {children}
    </>
  )
}
