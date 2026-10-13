import { describe, expect, it } from 'vitest'

import type { ImageVM, SiteVM } from '@/lib/data/types'

import { pageMetadata } from './metadata'

const site = {
  name: 'AlBeik',
  url: 'https://albeik.us',
  seo: { description: 'Lebanese street food.', ogImage: null },
} as SiteVM

const photo: ImageVM = {
  kind: 'image',
  url: '/api/media/file/kafta.jpg',
  alt: 'Kafta sandwich',
  width: 540,
  height: 540,
  mimeType: 'image/jpeg',
  focalX: 50,
  focalY: 50,
}

describe('pageMetadata', () => {
  it('sets title, canonical and a complete Open Graph block', () => {
    expect(
      pageMetadata(site, {
        title: 'Kafta Sandwich',
        description: 'Beef kafta.',
        path: '/menu/kafta',
        image: photo,
      }),
    ).toEqual({
      title: 'Kafta Sandwich',
      description: 'Beef kafta.',
      alternates: { canonical: '/menu/kafta' },
      openGraph: {
        type: 'website',
        siteName: 'AlBeik',
        locale: 'en_US',
        url: '/menu/kafta',
        title: 'Kafta Sandwich',
        description: 'Beef kafta.',
        images: [
          { url: '/api/media/file/kafta.jpg', width: 540, height: 540, alt: 'Kafta sandwich' },
        ],
      },
      twitter: { card: 'summary_large_image' },
    })
  })

  it('falls back to the site description and the generated share image', () => {
    const meta = pageMetadata(site, { title: 'Menu', path: '/menu' })
    expect(meta.description).toBe('Lebanese street food.')
    expect(meta.openGraph?.images).toEqual([
      { url: '/og', width: 1200, height: 630, alt: 'AlBeik' },
    ])
  })

  it('supports an absolute title for the home page', () => {
    expect(pageMetadata(site, { absoluteTitle: 'AlBeik', path: '/' }).title).toEqual({
      absolute: 'AlBeik',
    })
  })
})
