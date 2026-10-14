import { Anton, Barlow, Caveat_Brush } from 'next/font/google'

/**
 * poc/street: Anton for the heavy condensed caps of the Instagram rebrand,
 * Barlow for body copy, Caveat Brush for the handwritten accent line
 * ("Juicier. Meatier. Tastier."), used sparingly. Self-hosted by next/font (no layout shift, no
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

const script = Caveat_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--p-font-script',
  display: 'swap',
})

export const fontClassName = `${display.variable} ${body.variable} ${script.variable}`
