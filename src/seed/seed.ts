import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'
import { fileURLToPath } from 'url'

import { slugify } from '@/lib/text'
import { aboutEditor } from '@/payload/globals/About'

import * as content from './content'

const IMAGES_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/seed')

// Seeding runs outside Next.js, so skip on-demand revalidation.
const context = { disableRevalidate: true }

type Options = {
  admin?: { email: string; password: string }
  log?: (message: string) => void
}

/**
 * Fills an empty database with the scraped content. Safe to re-run: it only
 * creates what's missing and never overwrites existing documents, so it
 * can't clobber edits made in the admin.
 */
export async function seed(payload: Payload, { admin, log = () => {} }: Options = {}) {
  const created: Record<string, number> = {}
  const bump = (key: string) => (created[key] = (created[key] ?? 0) + 1)

  const mediaIds = new Map<string, number>()
  async function upload(file: string, alt: string) {
    const cached = mediaIds.get(file)
    if (cached) return cached
    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: file } },
      limit: 1,
      depth: 0,
    })
    let id = docs[0]?.id
    if (!id) {
      // No media document owns a file with this name, so one on disk was left
      // by a dropped database. Remove it, or Payload would store the upload as
      // "file-1.ext" and the next run wouldn't find it by name.
      const staticDir = payload.collections.media.config.upload.staticDir
      const stale = staticDir ? path.join(staticDir, file) : null
      if (stale && fs.existsSync(stale)) fs.rmSync(stale)

      id = (
        await payload.create({
          collection: 'media',
          data: { alt },
          filePath: path.join(IMAGES_DIR, file),
          context,
        })
      ).id
      bump('media')
    }
    mediaIds.set(file, id)
    return id
  }

  // Categories
  const categoryIds = new Map<string, number>()
  for (const category of content.categories) {
    const slug = slugify(category.name)
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const doc =
      docs[0] ??
      (bump('categories'),
      await payload.create({
        collection: 'categories',
        data: { name: category.name, slug, sortOrder: category.sortOrder },
        context,
      }))
    categoryIds.set(category.name, doc.id)
  }

  // Menu items, published, in live-site order within each category
  const itemIds = new Map<string, number>()
  const positions = new Map<string, number>()
  for (const item of content.menuItems) {
    const slug = slugify(item.name)
    const sortOrder = positions.get(item.category) ?? 0
    positions.set(item.category, sortOrder + 1)

    const { docs } = await payload.find({
      collection: 'menu-items',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (docs[0]) {
      itemIds.set(item.name, docs[0].id)
      continue
    }
    const doc = await payload.create({
      collection: 'menu-items',
      data: {
        name: item.name,
        slug,
        shortDescription: item.description,
        category: categoryIds.get(item.category)!,
        image: await upload(item.image.file, item.name),
        tags: item.tags ?? [],
        available: true,
        sortOrder,
        _status: 'published',
      },
      context,
    })
    bump('menu-items')
    itemIds.set(item.name, doc.id)
  }

  // Testimonials
  for (const [sortOrder, t] of content.testimonials.entries()) {
    const { totalDocs } = await payload.count({
      collection: 'testimonials',
      where: { name: { equals: t.name } },
    })
    if (totalDocs) continue
    await payload.create({
      collection: 'testimonials',
      data: { name: t.name, quote: t.quote, featured: true, sortOrder },
      context,
    })
    bump('testimonials')
  }

  // Globals: filled only while still empty
  const home = await payload.findGlobal({ slug: 'homepage', depth: 0, draft: true })
  if (!home.hero?.headline) {
    const { hero, promise, promo, featured } = content.homepage
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: { ...hero, media: await upload(content.images.hero.file, content.images.hero.alt) },
        promise: {
          ...promise,
          media: await upload(content.images.spread.file, content.images.spread.alt),
        },
        featuredItems: featured.map((name) => itemIds.get(name)!),
        promo,
        _status: 'published',
      },
      context,
    })
    bump('homepage')
  }

  const about = await payload.findGlobal({ slug: 'about', depth: 0 })
  if (!about.body) {
    const editorConfig = await editorConfigFactory.fromEditor({
      config: payload.config,
      editor: aboutEditor,
    })
    await payload.updateGlobal({
      slug: 'about',
      data: {
        headline: content.about.headline,
        body: convertMarkdownToLexical({ editorConfig, markdown: content.about.markdown }),
        images: [{ image: await upload(content.images.dining.file, content.images.dining.alt) }],
      },
      context,
    })
    bump('about')
  }

  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (!settings.locations?.length) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteName: content.siteSettings.siteName,
        ...content.storeLinks,
        locations: [content.siteSettings.location],
        seo: { defaultDescription: content.siteSettings.defaultDescription },
      },
      context,
    })
    bump('site-settings')
  }

  if (admin) {
    const { totalDocs } = await payload.count({
      collection: 'users',
      where: { email: { equals: admin.email } },
    })
    if (!totalDocs) {
      await payload.create({
        collection: 'users',
        data: { email: admin.email, password: admin.password, name: 'Admin' },
        context,
      })
      bump('users')
    }
  }

  const summary = Object.entries(created)
    .map(([key, n]) => `${key}: ${n}`)
    .join(', ')
  log(summary ? `Created ${summary}` : 'Nothing to create; the database is already seeded.')
  return created
}
