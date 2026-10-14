import { Anton, Plus_Jakarta_Sans } from 'next/font/google'

/**
 * poc/app: Plus Jakarta Sans (friendly, app-like) for everything, Anton only
 * for the AlBeik wordmark and big numerals, so it still reads as the brand.
 */
const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--p-font-body',
  display: 'swap',
})

const brand = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--p-font-brand',
  display: 'swap',
})

export const fontClassName = `${body.variable} ${brand.variable}`
