import { completeHours, formatHours } from '@/lib/hours'
import { resolveOrderLinks, type StoreOrderUrls } from '@/lib/order'
import { parseEmphasis, plainText } from '@/lib/text'
import type { Category, Homepage, Media, MenuItem, SiteSetting, Testimonial } from '@/payload-types'

import type {
  CategoryVM,
  HomePageData,
  ImageVM,
  LocationVM,
  MediaVM,
  MenuItemVM,
  RichLine,
  SiteVM,
  SocialVM,
  TestimonialVM,
} from './types'

type Ref<T> = number | T | null | undefined

const isPopulated = <T extends object>(ref: Ref<T>): ref is T =>
  typeof ref === 'object' && ref !== null

const orNull = (value: string | null | undefined) => (value?.trim() ? value.trim() : null)

export function toImage(media: Ref<Media>): ImageVM | null {
  if (!isPopulated(media) || !media.url || !media.width || !media.height) return null
  if (media.mimeType?.startsWith('video/')) return null
  return {
    kind: 'image',
    url: media.url,
    alt: media.alt,
    width: media.width,
    height: media.height,
    mimeType: media.mimeType ?? null,
    focalX: media.focalX ?? 50,
    focalY: media.focalY ?? 50,
  }
}

export function toMedia(media: Ref<Media>): MediaVM | null {
  if (isPopulated(media) && media.url && media.mimeType?.startsWith('video/')) {
    return { kind: 'video', url: media.url, alt: media.alt, mimeType: media.mimeType, poster: null }
  }
  return toImage(media)
}

export function toRichLine(text: string | null | undefined): RichLine {
  return { segments: parseEmphasis(text), text: plainText(text) }
}

export type ItemContext = { store: StoreOrderUrls; showPrices: boolean }

export function toMenuItem(doc: MenuItem, ctx: ItemContext): MenuItemVM | null {
  if (!isPopulated(doc.category)) return null
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    href: `/menu/${doc.slug}`,
    description: orNull(doc.shortDescription),
    image: toImage(doc.image),
    price: ctx.showPrices && typeof doc.price === 'number' ? doc.price : null,
    tags: doc.tags ?? [],
    category: { slug: doc.category.slug, name: doc.category.name },
    orderLinks: resolveOrderLinks(doc, ctx.store),
  }
}

/** Categories in the given order, each with its items; empty categories are dropped. */
export function groupMenu(categories: Category[], items: MenuItemVM[]): CategoryVM[] {
  return categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: orNull(category.description),
      image: toImage(category.image),
      items: items.filter((i) => i.category.slug === category.slug),
    }))
    .filter((category) => category.items.length > 0)
}

/** Reorders items to match `ids` (an editor-curated list), skipping ids that aren't present. */
export function orderByIds<T extends { id: number }>(items: T[], ids: number[]): T[] {
  return ids.flatMap((id) => items.find((i) => i.id === id) ?? [])
}

const SOURCE_LABELS: Record<NonNullable<Testimonial['source']>, string> = {
  google: 'Google',
  yelp: 'Yelp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tripadvisor: 'Tripadvisor',
  doordash: 'DoorDash',
  'uber-eats': 'Uber Eats',
  other: 'Other',
}

export function toTestimonial(doc: Testimonial): TestimonialVM {
  return {
    id: doc.id,
    name: doc.name,
    quote: doc.quote.trim(),
    source: doc.source ? SOURCE_LABELS[doc.source] : null,
    sourceUrl: orNull(doc.sourceUrl),
    avatar: toImage(doc.avatar),
  }
}

type LocationRow = NonNullable<SiteSetting['locations']>[number]

type DemoLocationFields = {
  mapEmbedUrl?: string | null
  geo?: { latitude: number; longitude: number } | null
}

// TODO(cms): fields for the map embed and pin; the demo content sets them today.
export function toLocation(row: LocationRow & DemoLocationFields): LocationVM {
  const streetAddress = orNull(row.streetAddress)
  const city = orNull(row.city)
  const region = orNull(row.region)
  const postalCode = orNull(row.postalCode)
  const phone = orNull(row.phone)

  const locality = [city, [region, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return {
    name: row.name,
    addressLines: [streetAddress, locality].filter((l): l is string => !!l),
    streetAddress,
    city,
    region,
    postalCode,
    phone,
    phoneHref: phone ? toTelHref(phone) : null,
    mapUrl: orNull(row.mapUrl),
    mapEmbedUrl: orNull(row.mapEmbedUrl),
    geo: row.geo ?? null,
    hours: formatHours(row.hours),
    openingHours: completeHours(row.hours),
    hoursNote: orNull(row.hoursNote),
  }
}

function toTelHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('+')) return `tel:${digits}`
  if (digits.length === 10) return `tel:+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`
  return `tel:${digits}`
}

type SocialPlatform = NonNullable<SiteSetting['socials']>[number]['platform']

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  google: 'Google',
  yelp: 'Yelp',
  x: 'X',
  youtube: 'YouTube',
  other: 'Link',
}

export function toSocial(social: { platform: SocialPlatform; url: string }): SocialVM {
  return { platform: social.platform, label: SOCIAL_LABELS[social.platform], url: social.url }
}

export function toSite(settings: SiteSetting, url: string): SiteVM {
  return {
    name: settings.siteName,
    // TODO(cms): a Site settings field; the demo content sets it today.
    alternateName: null,
    url,
    logo: toImage(settings.logo),
    showPrices: settings.showPrices ?? false,
    timezone: settings.timezone || 'America/Chicago',
    storeOrderLinks: resolveOrderLinks(null, settings),
    locations: (settings.locations ?? []).map(toLocation),
    socials: (settings.socials ?? []).map(toSocial),
    seo: {
      description: orNull(settings.seo?.defaultDescription),
      ogImage: toImage(settings.seo?.ogImage),
    },
  }
}

export function toHomePage(
  home: Homepage,
  featured: MenuItemVM[],
  testimonials: TestimonialVM[],
): HomePageData {
  const promise = home.promise
  const promo = home.promo

  return {
    // Globals that were never saved come back without their groups.
    hero: {
      headline: toRichLine(home.hero?.headline),
      subline: orNull(home.hero?.subline),
      media: toMedia(home.hero?.media),
      // TODO(cms): a Homepage field for the hero loop; demo content sets it today.
      loop: null,
    },
    promise:
      promise && (orNull(promise.headline) || orNull(promise.body) || toMedia(promise.media))
        ? {
            headline: toRichLine(promise.headline),
            body: orNull(promise.body),
            media: toMedia(promise.media),
          }
        : null,
    featured,
    promo:
      promo?.enabled && orNull(promo.text)
        ? {
            text: toRichLine(promo.text),
            linkLabel: orNull(promo.linkLabel),
            linkUrl: orNull(promo.linkUrl),
            countdownTo: promo.countdownTo ?? null,
          }
        : null,
    testimonials,
  }
}
