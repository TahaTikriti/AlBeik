import { Anton, Inter } from 'next/font/google'

/**
 * The brand guidelines' two typefaces: a condensed bold display (Anton) and a
 * clean sans for text (Inter). Self-hosted by next/font (no layout shift, no
 * request to Google at runtime).
 */
const display = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--p-font-display',
  display: 'swap',
})

const body = Inter({
  subsets: ['latin'],
  variable: '--p-font-body',
  display: 'swap',
})

export const fontClassName = `${display.variable} ${body.variable}`
