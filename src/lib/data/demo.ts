/**
 * Demo data: the scraped albeik.us content (src/seed/content.ts) as view
 * models, used when no database is configured. Lets anyone run or deploy the
 * site with zero setup. Same shapes as the CMS loaders, so pages and
 * components can't tell the difference.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { resolveOrderLinks } from '@/lib/order'
import { slugify } from '@/lib/text'
import * as content from '@/seed/content'

import { toLocation, toRichLine } from './mappers'
import type {
  AboutPageData,
  CategoryVM,
  HomePageData,
  ImageVM,
  ItemPageData,
  MenuItemVM,
  MenuPageData,
  SiteVM,
} from './types'

const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

function image(file: { file: string; width: number; height: number }, alt: string): ImageVM {
  return {
    kind: 'image',
    url: `/seed/${file.file}`,
    alt,
    width: file.width,
    height: file.height,
    mimeType: MIME[file.file.split('.').pop() ?? ''] ?? null,
    focalX: 50,
    focalY: 50,
  }
}

const storeLinks = resolveOrderLinks(null, content.storeLinks)

const items: MenuItemVM[] = content.menuItems.map((item, i) => {
  const slug = slugify(item.name)
  return {
    id: i + 1,
    slug,
    name: item.name,
    href: `/menu/${slug}`,
    description: item.description,
    image: image(item.image, item.name),
    price: null,
    tags: item.tags ?? [],
    category: { slug: slugify(item.category), name: item.category },
    orderLinks: storeLinks,
  }
})

export function demoSite(url: string): SiteVM {
  return {
    name: content.siteSettings.siteName,
    url,
    logo: null,
    showPrices: false,
    timezone: 'America/Chicago',
    storeOrderLinks: storeLinks,
    locations: [toLocation(content.siteSettings.location)],
    socials: [],
    seo: { description: content.siteSettings.defaultDescription, ogImage: null },
  }
}

export function demoMenu(): MenuPageData {
  const categories: CategoryVM[] = content.categories.map((category, i) => ({
    id: i + 1,
    slug: slugify(category.name),
    name: category.name,
    image: null,
    items: items.filter((item) => item.category.name === category.name),
  }))
  return { categories: categories.filter((c) => c.items.length > 0) }
}

export function demoItem(slug: string): ItemPageData | null {
  const item = items.find((i) => i.slug === slug)
  return item ? { item } : null
}

export function demoItemSlugs() {
  return items.map((i) => ({ slug: i.slug, updatedAt: '2026-10-12T00:00:00.000Z' }))
}

export function demoHome(): HomePageData {
  const { hero, promise, featured } = content.homepage
  const { images } = content
  return {
    hero: {
      headline: toRichLine(hero.headline),
      subline: hero.subline,
      media: image(images.hero, images.hero.alt),
      loop: content.heroLoop
        ? {
            kind: 'video',
            url: `/seed/${content.heroLoop.file}`,
            alt: images.hero.alt,
            mimeType: content.heroLoop.mimeType,
            poster: `/seed/${content.heroLoop.poster}`,
          }
        : null,
    },
    promise: {
      headline: toRichLine(promise.headline),
      body: promise.body,
      media: image(images.spread, images.spread.alt),
    },
    featured: featured.flatMap((name) => items.find((i) => i.name === name) ?? []),
    promo: null,
    testimonials: content.testimonials.map((t, i) => ({
      id: i + 1,
      name: t.name,
      quote: t.quote,
      source: null,
      sourceUrl: null,
      avatar: null,
    })),
  }
}

export function demoAbout(): AboutPageData {
  return {
    headline: toRichLine(content.about.headline),
    body: paragraphsToLexical(content.about.markdown),
    images: [image(content.images.dining, content.images.dining.alt)],
  }
}

/** Just enough Markdown (paragraphs and "## " headings) for the about copy. */
function paragraphsToLexical(markdown: string): SerializedEditorState {
  const text = (value: string) => ({
    type: 'text',
    text: value,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  })
  const block = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }

  const children = markdown
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) =>
      chunk.startsWith('## ')
        ? { ...block, type: 'heading', tag: 'h2', children: [text(chunk.slice(3))] }
        : { ...block, type: 'paragraph', textFormat: 0, children: [text(chunk)] },
    )

  return { root: { ...block, type: 'root', children } } as unknown as SerializedEditorState
}
