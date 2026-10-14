import { Anton, Barlow } from 'next/font/google'

/**
 * poc/street: Anton for the heavy condensed caps of the Instagram rebrand,
 * Barlow for body copy. Self-hosted by next/font (no layout shift, no
 * request to Google at runtime).
 */
const display = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--p-font-display',
  display: 'swap',
})

const body = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--p-font-body',
  display: 'swap',
})

export const fontClassName = `${display.variable} ${body.variable}`
