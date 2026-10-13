import Script from 'next/script'

const DEFAULT_SRC = 'https://cloud.umami.is/script.js'

/** Loads Umami (cookie-free) after the page is idle. Renders nothing without a website ID. */
export function UmamiScript() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  if (!websiteId) return null
  return (
    <Script
      src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || DEFAULT_SRC}
      data-website-id={websiteId}
      strategy="lazyOnload"
    />
  )
}
