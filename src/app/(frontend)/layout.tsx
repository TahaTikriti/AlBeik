import '@/styles/globals.css'

import type { Metadata, Viewport } from 'next'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'

import { PreviewBanner } from '@/components/shell/PreviewBanner'
import { SiteShell } from '@/components/shell/SiteShell'
import { UmamiScript } from '@/lib/analytics/UmamiScript'
import { getSite } from '@/lib/data'
import { LivePreviewListener } from '@/lib/preview/LivePreviewListener'
import { restaurantJsonLd } from '@/lib/seo'
import { JsonLd } from '@/lib/seo/JsonLd'
import { fontClassName } from '@/theme/fonts'
import { theme } from '@/theme/theme'

export const viewport: Viewport = {
  themeColor: theme.themeColor,
  // Lets env(safe-area-inset-*) report real values on notched phones.
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    metadataBase: new URL(site.url),
    title: { default: site.name, template: `%s · ${site.name}` },
    description: site.seo.description ?? undefined,
  }
}

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [site, { isEnabled: isDraft }] = await Promise.all([getSite(), draftMode()])
  return (
    <html lang="en" dir="ltr" className={fontClassName || undefined}>
      <body>
        {isDraft ? (
          <>
            <PreviewBanner />
            <LivePreviewListener />
          </>
        ) : null}
        <SiteShell site={site}>{children}</SiteShell>
        <JsonLd data={restaurantJsonLd(site)} />
        <UmamiScript />
      </body>
    </html>
  )
}
