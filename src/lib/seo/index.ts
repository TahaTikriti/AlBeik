import type { CategoryVM, SiteVM } from '@/lib/data/types'
import { toSchemaOpeningHours } from '@/lib/hours'

/**
 * Structured data for search engines. Rule: only state what the CMS knows.
 * Empty fields are omitted, never filled with guesses.
 */

export function absoluteUrl(origin: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${origin.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

/** JSON for a <script type="application/ld+json">, safe against `</script>` in content. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

const HALAL = 'https://schema.org/HalalDiet'
const VEGETARIAN = 'https://schema.org/VegetarianDiet'

/** Drops keys whose value is undefined, null, '' or an empty array/object. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === undefined || v === null || v === '') return false
      if (Array.isArray(v)) return v.length > 0
      return true
    }),
  ) as Partial<T>
}

/** One Restaurant entity. Multiple locations are out of scope; the first is used. */
export function restaurantJsonLd(site: SiteVM) {
  const loc = site.locations[0]
  const address = loc
    ? compact({
        streetAddress: loc.streetAddress,
        addressLocality: loc.city,
        addressRegion: loc.region,
        postalCode: loc.postalCode,
      })
    : {}

  return compact({
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: site.name,
    alternateName: site.alternateName,
    description: site.seo.description,
    url: site.url,
    servesCuisine: ['Lebanese', 'Halal'],
    hasMenu: absoluteUrl(site.url, '/menu'),
    image: site.logo ? absoluteUrl(site.url, site.logo.url) : undefined,
    address: Object.keys(address).length
      ? { '@type': 'PostalAddress', ...address, addressCountry: 'US' }
      : undefined,
    geo: loc?.geo ? { '@type': 'GeoCoordinates', ...loc.geo } : undefined,
    hasMap: loc?.mapUrl,
    telephone: loc?.phone,
    openingHoursSpecification: toSchemaOpeningHours(loc?.openingHours),
    sameAs: site.socials.map((s) => s.url),
  })
}

export function menuJsonLd(site: SiteVM, categories: CategoryVM[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${site.name} menu`,
    url: absoluteUrl(site.url, '/menu'),
    hasMenuSection: categories.map((category) => ({
      '@type': 'MenuSection',
      name: category.name,
      hasMenuItem: category.items.map((item) =>
        compact({
          '@type': 'MenuItem',
          name: item.name,
          url: absoluteUrl(site.url, item.href),
          description: item.description,
          image: item.image ? absoluteUrl(site.url, item.image.url) : undefined,
          suitableForDiet: item.tags.includes('vegetarian') ? [HALAL, VEGETARIAN] : [HALAL],
          offers:
            item.price !== null
              ? { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'USD' }
              : undefined,
        }),
      ),
    })),
  }
}
