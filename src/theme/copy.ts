import type { MenuTag } from '@/lib/data/types'

/**
 * UI microcopy for poc/street, in the voice of AlBeik's Instagram:
 * confident, cheeky, short. Content (dishes, story) comes from the CMS.
 */
export const copy = {
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main',
    home: 'Home',
    menu: 'Menu',
    about: 'Story',
    location: 'Visit',
  },
  marquee: ['100% Halal', 'Juicier. Meatier. Tastier.', 'Beirut street food', 'Kansas City'],
  order: {
    cta: 'Order',
    ctaFor: (item: string) => `Order ${item}`,
    ctaForOn: (item: string, platform: string) => `Order on ${platform}: ${item}`,
    on: (platform: string) => `Order on ${platform}`,
    sheetTitle: 'Pick your app',
    sheetIntro: 'Spice bomb is waiting.',
    sheetIntroFor: (item: string) => `${item}. Coming right up.`,
    storeLevelNote: 'Opens AlBeik’s page',
    close: 'Not yet',
    stickyLabel: 'Order now',
    stickyKicker: 'Spice bomb is waiting',
  },
  menu: {
    title: 'Menu',
    kicker: 'Beirut street food · 100% halal',
    categoriesLabel: 'Menu categories',
    empty: 'The grill is warming up.',
    count: (n: number) => (n === 1 ? '1 dish' : `${n} dishes`),
    viewItem: (item: string) => `View ${item}`,
  },
  item: {
    backToMenu: 'Back to the menu',
    tags: {
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      popular: 'Popular',
      new: 'New',
      signature: 'Signature',
    } satisfies Record<MenuTag, string>,
  },
  home: {
    heroKicker: 'Lebanese street food · Kansas City',
    featuredKicker: 'Ours, and only ours',
    featuredTitle: 'The *signatures*',
    seeMenu: 'See the menu',
    fullMenu: 'The whole menu',
    testimonialsTitle: 'Word on the *street*',
    visitTitle: 'Find *us*',
    visitBody: 'Pull up to State Line, or let it come to you.',
  },
  location: {
    title: 'Visit',
    heading: 'Find *us*',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    directions: 'Get directions',
    call: (phone: string) => `Call ${phone}`,
    detailsSoon: 'Address and hours are on their way. Hungry now? Order online.',
  },
  about: {
    title: 'Our story',
  },
  notFound: {
    title: 'Lost your way?',
    body: 'This page went out for shawarma and never came back.',
    cta: 'Back to the menu',
  },
  preview: {
    notice: 'Preview: you are seeing unpublished changes.',
    exit: 'Exit preview',
  },
  footer: {
    halal: '100% halal. Always.',
    tagline: 'The recipe is Lebanese. The attitude is ours.',
    follow: 'Follow us',
  },
} as const
