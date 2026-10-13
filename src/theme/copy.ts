import type { MenuTag } from '@/lib/data/types'

/**
 * UI microcopy: labels, buttons, empty states. Content (headlines, dishes,
 * story) lives in the CMS; this is the interface's voice, so each design
 * direction rewrites it. `main` is deliberately plain.
 */
export const copy = {
  skipToContent: 'Skip to content',
  nav: {
    label: 'Main',
    home: 'Home',
    menu: 'Menu',
    about: 'About',
    location: 'Location & hours',
  },
  order: {
    cta: 'Order',
    ctaFor: (item: string) => `Order ${item}`,
    ctaForOn: (item: string, platform: string) => `Order ${item} on ${platform}`,
    on: (platform: string) => `Order on ${platform}`,
    sheetTitle: 'Order',
    sheetIntro: 'Pick your delivery app.',
    sheetIntroFor: (item: string) => `Order ${item} through your delivery app.`,
    storeLevelNote: 'Opens the AlBeik store page.',
    close: 'Close',
    stickyLabel: 'Order online',
  },
  menu: {
    title: 'Menu',
    categoriesLabel: 'Menu categories',
    empty: 'The menu is on its way.',
    viewItem: (item: string) => `View ${item}`,
  },
  item: {
    backToMenu: 'Back to menu',
    tags: {
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      popular: 'Popular',
      new: 'New',
      signature: 'Signature',
    } satisfies Record<MenuTag, string>,
  },
  home: {
    featuredTitle: 'Featured',
    seeMenu: 'See the full menu',
    testimonialsTitle: 'What people say',
    visitTitle: 'Visit us',
  },
  location: {
    title: 'Location & hours',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    directions: 'Get directions',
    call: (phone: string) => `Call ${phone}`,
    detailsSoon: 'Details coming soon.',
  },
  about: {
    title: 'About',
  },
  notFound: {
    title: 'Page not found',
    body: 'We couldn’t find that page.',
    cta: 'Go to the menu',
  },
  preview: {
    notice: 'Preview: you are seeing unpublished changes.',
    exit: 'Exit preview',
  },
  footer: {
    halal: '100% halal',
    follow: 'Follow us',
  },
} as const
