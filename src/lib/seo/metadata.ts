import type { Metadata } from 'next'

import type { ImageVM, SiteVM } from '@/lib/data/types'

type PageMeta = {
  /** Uses the layout's "%s · AlBeik" template. */
  title?: string
  /** Bypasses the template (home page). */
  absoluteTitle?: string
  description?: string | null
  path: string
  image?: ImageVM | null
}

/**
 * Per-page metadata. A page's `openGraph` replaces the layout's entirely, so
 * this always returns the full block (site name, locale, share image).
 */
export function pageMetadata(site: SiteVM, page: PageMeta): Metadata {
  const description = page.description ?? site.seo.description ?? undefined
  // Pages without their own photo (and the home page) share the brand card,
  // public/og.png: the logo and slogan (source: docs/brand/share-card.html).
  const share = page.image ?? site.seo.ogImage
  const title = page.absoluteTitle ?? page.title

  return {
    title: page.absoluteTitle ? { absolute: page.absoluteTitle } : page.title,
    description,
    alternates: { canonical: page.path },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'en_US',
      url: page.path,
      title,
      description,
      images: [
        share
          ? { url: share.url, width: share.width, height: share.height, alt: share.alt }
          : {
              url: '/og.png',
              width: 1200,
              height: 630,
              alt: `${site.name} Lebanese Restaurant: the recipe is Lebanese, the extra attitude is ours`,
            },
      ],
    },
    twitter: { card: 'summary_large_image' },
  }
}
