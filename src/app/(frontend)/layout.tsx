import '@/styles/globals.css'

import type { ReactNode } from 'react'

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  )
}
