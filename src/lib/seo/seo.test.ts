import { describe, expect, it } from 'vitest'

import type { CategoryVM, LocationVM, MenuItemVM, SiteVM } from '@/lib/data/types'

import { absoluteUrl, menuJsonLd, restaurantJsonLd, serializeJsonLd } from '.'

const location: LocationVM = {
  name: 'State Line',
  addressLines: ['123 State Line Rd', 'Kansas City, MO 64114'],
  streetAddress: '123 State Line Rd',
  city: 'Kansas City',
  region: 'MO',
  postalCode: '64114',
  phone: '(816) 555-0100',
  phoneHref: 'tel:+18165550100',
  mapUrl: 'https://maps.google.com/?q=albeik',
  hours: [{ days: 'Mon', time: '11:00 AM – 10:00 PM' }],
  openingHours: [{ days: ['mon'], opens: '11:00', closes: '22:00' }],
  hoursNote: null,
}

const site: SiteVM = {
  name: 'AlBeik',
  url: 'https://albeik.us',
  logo: null,
  showPrices: true,
  timezone: 'America/Chicago',
  storeOrderLinks: [],
  locations: [location],
  socials: [{ platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/albeik' }],
  seo: { description: null, ogImage: null },
}

const sparseSite: SiteVM = {
  ...site,
  locations: [
    {
      ...location,
      addressLines: ['Kansas City'],
      streetAddress: null,
      region: null,
      postalCode: null,
      phone: null,
      phoneHref: null,
      mapUrl: null,
      hours: [],
      openingHours: [],
    },
  ],
  socials: [],
}

describe('absoluteUrl', () => {
  it('joins the site origin and a path', () => {
    expect(absoluteUrl('https://albeik.us', '/menu')).toBe('https://albeik.us/menu')
    expect(absoluteUrl('https://albeik.us/', 'menu')).toBe('https://albeik.us/menu')
  })

  it('leaves absolute URLs alone', () => {
    expect(absoluteUrl('https://albeik.us', 'https://cdn.example/x.jpg')).toBe(
      'https://cdn.example/x.jpg',
    )
  })
})

describe('serializeJsonLd', () => {
  it('escapes "<" so content cannot close the script tag', () => {
    expect(serializeJsonLd({ name: '</script><b>' })).toBe('{"name":"\\u003c/script>\\u003cb>"}')
  })
})

describe('restaurantJsonLd', () => {
  it('describes the restaurant with everything that is known', () => {
    expect(restaurantJsonLd(site)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: 'AlBeik',
      url: 'https://albeik.us',
      servesCuisine: ['Lebanese', 'Halal'],
      hasMenu: 'https://albeik.us/menu',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 State Line Rd',
        addressLocality: 'Kansas City',
        addressRegion: 'MO',
        postalCode: '64114',
        addressCountry: 'US',
      },
      telephone: '(816) 555-0100',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['https://schema.org/Monday'],
          opens: '11:00',
          closes: '22:00',
        },
      ],
      sameAs: ['https://instagram.com/albeik'],
    })
  })

  it('omits what is unknown instead of guessing', () => {
    const ld = restaurantJsonLd(sparseSite)
    expect(ld.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Kansas City',
      addressCountry: 'US',
    })
    expect(ld).not.toHaveProperty('telephone')
    expect(ld).not.toHaveProperty('openingHoursSpecification')
    expect(ld).not.toHaveProperty('sameAs')
  })
})

describe('menuJsonLd', () => {
  const item = (overrides: Partial<MenuItemVM>): MenuItemVM => ({
    id: 1,
    slug: 'falafel-sandwich',
    name: 'Falafel Sandwich',
    href: '/menu/falafel-sandwich',
    description: 'Crispy falafel in pita.',
    image: {
      kind: 'image',
      url: '/api/media/file/falafel.webp',
      alt: 'Falafel',
      width: 300,
      height: 300,
      mimeType: 'image/webp',
      focalX: 50,
      focalY: 50,
    },
    price: 9.5,
    tags: ['vegetarian'],
    category: { slug: 'sandwiches', name: 'Sandwiches' },
    orderLinks: [],
    ...overrides,
  })

  const categories: CategoryVM[] = [
    {
      id: 1,
      slug: 'sandwiches',
      name: 'Sandwiches',
      image: null,
      items: [
        item({}),
        item({
          id: 2,
          slug: 'kafta',
          name: 'Kafta',
          href: '/menu/kafta',
          description: null,
          image: null,
          price: null,
          tags: [],
        }),
      ],
    },
  ]

  it('lists sections and items, with offers only for shown prices', () => {
    expect(menuJsonLd(site, categories)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Menu',
      name: 'AlBeik menu',
      url: 'https://albeik.us/menu',
      hasMenuSection: [
        {
          '@type': 'MenuSection',
          name: 'Sandwiches',
          hasMenuItem: [
            {
              '@type': 'MenuItem',
              name: 'Falafel Sandwich',
              url: 'https://albeik.us/menu/falafel-sandwich',
              description: 'Crispy falafel in pita.',
              image: 'https://albeik.us/api/media/file/falafel.webp',
              suitableForDiet: [
                'https://schema.org/HalalDiet',
                'https://schema.org/VegetarianDiet',
              ],
              offers: { '@type': 'Offer', price: '9.50', priceCurrency: 'USD' },
            },
            {
              '@type': 'MenuItem',
              name: 'Kafta',
              url: 'https://albeik.us/menu/kafta',
              suitableForDiet: ['https://schema.org/HalalDiet'],
            },
          ],
        },
      ],
    })
  })
})
