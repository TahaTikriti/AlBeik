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
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--p-font-body',
  display: 'swap',
})

// Not preloaded: it's 50 KB for one line that fades in after the hero, and
// preloading it competed with the hero photo for the first paint.
const script = Caveat_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--p-font-script',
  display: 'swap',
  preload: false,
})

export const fontClassName = `${display.variable} ${body.variable} ${script.variable}`
