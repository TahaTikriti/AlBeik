import { completeHours, formatHours } from '@/lib/hours'
import { resolveOrderLinks, type StoreOrderUrls } from '@/lib/order'
import { parseEmphasis, plainText } from '@/lib/text'
import type { Category, Homepage, Media, MenuItem, SiteSetting, Testimonial } from '@/payload-types'
import { baseLabel } from '@/lib/pickup-card/clover-match'

import type {
  BannerVM,
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
  VideoVM,
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

/**
 * The hero's video, with its cover (first frame) as the poster, or the hero
 * photo when no cover was added: the poster is all that shows until the page
 * has loaded, and all that ever shows with reduced motion or data saving.
 */
function toHeroLoop(video: Ref<Media>, cover: Ref<Media>, photo: Ref<Media>): VideoVM | null {
  const loop = toMedia(video)
  if (loop?.kind !== 'video') return null
  return { ...loop, poster: toImage(cover)?.url ?? toImage(photo)?.url ?? null }
}

export function toRichLine(text: string | null | undefined): RichLine {
  return { segments: parseEmphasis(text), text: plainText(text) }
}

export type ItemContext = {
  store: StoreOrderUrls
  showPrices: boolean
  /** Online pickup is on: linked dishes get their Clover options. */
  pickup: boolean
  /** Preview mode: dishes not linked to Clover yet get demo options, so the whole menu can be tried. */
  demo?: boolean
}

/** A stable stand-in Clover ID for a dish's nth option in preview mode. */
function demoId(slug: string, index: number) {
  let hash = 2166136261
  for (const char of slug + '#' + index) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  return ('DEMO' + index + hash.toString(36).toUpperCase() + '00000000').slice(0, 13)
}

function demoOptions(doc: MenuItem) {
  const combo = typeof doc.comboPrice === 'number'
  const labels = [
    baseLabel(doc.name, combo),
    ...(combo ? ['Combo'] : (doc.sizes ?? []).flatMap(({ label }) => (label?.trim() ? [label.trim()] : []))),
  ]
  return labels.map((label, index) => ({ label, cloverItemId: demoId(doc.slug, index) }))
}

function pickupOptions(doc: MenuItem, ctx: ItemContext): MenuItemVM['pickup'] {
  if (!ctx.pickup) return null
  const options = (doc.pickupOptions ?? []).flatMap(({ label, cloverItemId }) =>
    label?.trim() && cloverItemId ? [{ label: label.trim(), cloverItemId }] : [],
  )
  if (!options.length && ctx.demo) return { options: demoOptions(doc) }
  return options.length ? { options } : null
}

export function toMenuItem(doc: MenuItem, ctx: ItemContext): MenuItemVM | null {
  if (!isPopulated(doc.category)) return null
  const pickup = pickupOptions(doc, ctx)
  // Linked dishes are sold at Clover's price: always shown, and deals are set in Clover.
  const showPrices = ctx.showPrices || pickup !== null
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    href: `/menu/${doc.slug}`,
    description: orNull(doc.shortDescription),
    image: toImage(doc.image),
    price: showPrices && typeof doc.price === 'number' ? doc.price : null,
    comboPrice: showPrices && typeof doc.comboPrice === 'number' ? doc.comboPrice : null,
    dealPrice:
      ctx.showPrices &&
      pickup === null &&
      typeof doc.dealPrice === 'number' &&
      typeof doc.price === 'number' &&
      doc.dealPrice < doc.price
        ? doc.dealPrice
        : null,
    sizes: showPrices
      ? (doc.sizes ?? []).flatMap(({ label, price }) =>
          label && typeof price === 'number' ? [{ label, price }] : [],
        )
      : [],
    tags: doc.tags ?? [],
    category: { slug: doc.category.slug, name: doc.category.name },
    orderLinks: resolveOrderLinks(doc, ctx.store),
    pickup,
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

/**
 * A keyless Google map searched by name and address, so the CMS (which has no
 * embed field) still shows the map, and it follows the address the admin edits.
 */
export function mapEmbedFor(placeName: string, addressLines: string[]): string | null {
  if (!addressLines.length) return null
  const q = [placeName, ...addressLines].filter(Boolean).join(', ')
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`
}

// TODO(cms): a field for the pin; the demo content sets it today.
export function toLocation(row: LocationRow & DemoLocationFields, placeName = ''): LocationVM {
  const streetAddress = orNull(row.streetAddress)
  const city = orNull(row.city)
  const region = orNull(row.region)
  const postalCode = orNull(row.postalCode)
  const phone = orNull(row.phone)

  const locality = [city, [region, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const addressLines = [streetAddress, locality].filter((l): l is string => !!l)

  return {
    name: row.name,
    addressLines,
    streetAddress,
    city,
    region,
    postalCode,
    phone,
    phoneHref: phone ? toTelHref(phone) : null,
    mapUrl: orNull(row.mapUrl),
    mapEmbedUrl: orNull(row.mapEmbedUrl) ?? mapEmbedFor(placeName, addressLines),
    geo: row.geo ?? null,
    hours: formatHours(row.hours),
    openingHours: completeHours(row.hours),
    hoursNote: orNull(row.hoursNote),
  }
}

export function toTelHref(phone: string): string | null {
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

/**
 * `pickupConfigured`: the server has PICKUP_MODE set. Both it and the admin
 * switch must be on before the site sells online.
 */
export function toSite(
  settings: SiteSetting,
  url: string,
  pickupConfigured = Boolean(process.env.PICKUP_MODE),
): SiteVM {
  return {
    name: settings.siteName,
    // TODO(cms): a Site settings field; the demo content sets it today.
    alternateName: null,
    url,
    logo: toImage(settings.logo),
    showPrices: settings.showPrices ?? false,
    timezone: settings.timezone || 'America/Chicago',
    storeOrderLinks: resolveOrderLinks(null, settings),
    locations: (settings.locations ?? []).map((row) => toLocation(row, settings.siteName)),
    socials: (settings.socials ?? []).map(toSocial),
    seo: {
      description: orNull(settings.seo?.defaultDescription),
      ogImage: toImage(settings.seo?.ogImage),
    },
    banner: toBanner(settings.banner),
    pickup: {
      enabled: Boolean(settings.onlinePickup) && pickupConfigured,
      prepMinutes: settings.prepMinutes ?? 20,
    },
  }
}

type BannerFields = {
  enabled?: boolean | null
  text?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  countdownTo?: string | null
}

/** The offer banner, or null when it's off, has no message or has already ended. */
export function toBanner(
  banner: BannerFields | null | undefined,
  now = Date.now(),
): BannerVM | null {
  if (!banner?.enabled || !orNull(banner.text)) return null
  if (banner.endsAt && Date.parse(banner.endsAt) <= now) return null
  return {
    text: toRichLine(banner.text),
    linkLabel: orNull(banner.linkLabel),
    linkUrl: orNull(banner.linkUrl),
    startsAt: banner.startsAt ?? null,
    endsAt: banner.endsAt ?? null,
    countdownTo: banner.countdownTo ?? null,
  }
}

export function toHomePage(
  home: Homepage,
  featured: MenuItemVM[],
  testimonials: TestimonialVM[],
): HomePageData {
  const promise = home.promise

  return {
    // Globals that were never saved come back without their groups.
    hero: {
      headline: toRichLine(home.hero?.headline),
      subline: orNull(home.hero?.subline),
      media: toMedia(home.hero?.media),
      loop: toHeroLoop(home.hero?.video, home.hero?.videoCover, home.hero?.media),
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
    testimonials,
  }
}
