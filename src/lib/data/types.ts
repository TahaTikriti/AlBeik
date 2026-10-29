/**
 * View models: the contract between the data layer and presentation.
 *
 * Pages load these through `src/lib/data` and pass them to views as props.
 * Components, views and theme files may import these *types* but never the
 * loaders or Payload itself (enforced by ESLint). POC branches restyle
 * against these shapes; changing a shape is a change on `main`.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { HoursLine, OpeningHours } from '@/lib/hours'
import type { OrderLink } from '@/lib/order'
import type { Segment } from '@/lib/text'

export type { Day, HoursLine, OpeningHours } from '@/lib/hours'
export type { ModeLink, OrderLink, OrderMode, PlatformId } from '@/lib/order'
export type { Segment } from '@/lib/text'

export type MenuTag = 'spicy' | 'vegetarian' | 'popular' | 'new' | 'signature'

/** Display text with *emphasis*: render `segments`; use `text` where markup can't go. */
export type RichLine = { segments: Segment[]; text: string }

export type ImageVM = {
  kind: 'image'
  /** Relative to the site origin; feed straight to next/image. */
  url: string
  alt: string
  width: number
  height: number
  mimeType: string | null
  /** Focal point in percent (0–100), for object-position. */
  focalX: number
  focalY: number
}

export type VideoVM = {
  kind: 'video'
  url: string
  alt: string
  mimeType: string
  /** Still shown before (and instead of) playback: ideally the first frame. */
  poster: string | null
}

export type MediaVM = ImageVM | VideoVM

export type CategoryRef = { slug: string; name: string }

export type MenuItemVM = {
  id: number
  slug: string
  name: string
  href: string
  description: string | null
  image: ImageVM | null
  /** Null when there is no price or prices are switched off site-wide. */
  price: number | null
  tags: MenuTag[]
  category: CategoryRef
  /** Already resolved through the fallback chain; empty means "hide ordering". */
  orderLinks: OrderLink[]
}

export type CategoryVM = {
  id: number
  slug: string
  name: string
  /** A line introducing the category on the menu. */
  description: string | null
  image: ImageVM | null
  items: MenuItemVM[]
}

export type TestimonialVM = {
  id: number
  name: string
  quote: string
  source: string | null
  sourceUrl: string | null
  avatar: ImageVM | null
}

export type LocationVM = {
  name: string
  /** e.g. ["123 State Line Rd", "Kansas City, MO 64114"]; empty when unknown. */
  addressLines: string[]
  streetAddress: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  phone: string | null
  /** `tel:` link, or null. */
  phoneHref: string | null
  mapUrl: string | null
  /** Google Maps "Embed a map" URL for an iframe; null shows no map. */
  mapEmbedUrl: string | null
  /** The map pin, for search engines. */
  geo: { latitude: number; longitude: number } | null
  /** Display lines, e.g. { days: 'Mon–Thu', time: '11:00 AM – 10:00 PM' }. */
  hours: HoursLine[]
  /** The same hours as data (24-hour times), for JSON-LD or an "open now" badge. */
  openingHours: OpeningHours[]
  hoursNote: string | null
}

export type SocialVM = { platform: string; label: string; url: string }

export type SiteVM = {
  name: string
  /** Another spelling people search for (e.g. the Google listing's). */
  alternateName: string | null
  url: string
  logo: ImageVM | null
  showPrices: boolean
  timezone: string
  /** Store-level links for the site-wide order CTA. */
  storeOrderLinks: OrderLink[]
  locations: LocationVM[]
  socials: SocialVM[]
  seo: { description: string | null; ogImage: ImageVM | null }
}

export type PromoVM = {
  text: RichLine
  linkLabel: string | null
  linkUrl: string | null
  /** ISO timestamp, for countdown / flip-clock promos. */
  countdownTo: string | null
}

export type HomePageData = {
  hero: {
    headline: RichLine
    subline: string | null
    media: MediaVM | null
    /** Optional silent video loop played over the hero photo (the poster). */
    loop: VideoVM | null
  }
  promise: { headline: RichLine; body: string | null; media: MediaVM | null } | null
  featured: MenuItemVM[]
  promo: PromoVM | null
  testimonials: TestimonialVM[]
}

export type MenuPageData = {
  /** Only categories that have at least one visible item, in menu order. */
  categories: CategoryVM[]
}

export type ItemPageData = { item: MenuItemVM }

export type AboutPageData = {
  headline: RichLine
  body: SerializedEditorState | null
  images: ImageVM[]
}

export type LocationPageData = { locations: LocationVM[] }

export type CateringItemVM = {
  name: string
  tag: 'vegan' | 'vegetarian' | null
  price: number
  /** "per person", "each"…; null for a tray or box priced whole. */
  unit: string | null
  description: string | null
}

export type CateringSectionVM = {
  slug: string
  title: string
  note: string | null
  items: CateringItemVM[]
}

export type CateringPageData = {
  intro: string
  sections: CateringSectionVM[]
  /** Customer-facing ordering terms. */
  terms: string[]
}
