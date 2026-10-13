/**
 * Font loading. `main` uses system stacks (no downloads), so this is empty.
 *
 * A design direction loads its faces with next/font and points the tokens at
 * them, e.g.:
 *
 *   import { Anton, Inter } from 'next/font/google'
 *   const display = Anton({ weight: '400', subsets: ['latin'], variable: '--p-font-display' })
 *   const body = Inter({ subsets: ['latin'], variable: '--p-font-body' })
 *   export const fontClassName = `${display.variable} ${body.variable}`
 *
 * then in tokens.css: --font-display: var(--p-font-display), …
 */
export const fontClassName = ''
