/**
 * The few theme values that CSS can't reach: the browser UI color and the
 * generated Open Graph image. Keep in step with tokens.css.
 */
export const theme = {
  /** <meta name="theme-color"> (mobile browser chrome). */
  themeColor: '#ffffff',
  og: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    accent: '#1a1a1a',
  },
} as const
