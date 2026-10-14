import type { MenuTag } from '@/lib/data/types'

/**
 * UI microcopy for poc/app: friendly delivery-app voice with AlBeik's
 * attitude. Content (dishes, story) comes from the CMS.
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
  order: {
    cta: 'Order',
    ctaFor: (item: string) => `Order ${item}`,
    ctaForOn: (item: string, platform: string) => `Order on ${platform}: ${item}`,
    on: (platform: string) => `Order on ${platform}`,
    sheetTitle: 'Choose your app',
    sheetIntro: 'Spice bomb is waiting.',
    sheetIntroFor: (item: string) => `${item}, delivered hot.`,
    storeLevelNote: 'Opens the AlBeik store',
    close: 'Maybe later',
    stickyLabel: 'Order',
    deliveredBy: 'Delivery & pickup',
  },
  menu: {
    title: 'Menu',
    heading: 'What are you *craving*?',
    kicker: '100% halal · Lebanese street food',
    categoriesLabel: 'Menu categories',
    empty: 'The menu is on its way.',
    count: (n: number) => (n === 1 ? '1 dish' : `${n} dishes`),
    viewItem: (item: string) => `View ${item}`,
  },
  item: {
    backToMenu: 'Menu',
    close: 'Close',
    orderTitle: 'Get it delivered',
    tags: {
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      popular: 'Popular',
      new: 'New',
      signature: 'Signature',
    } satisfies Record<MenuTag, string>,
  },
  home: {
    greeting: 'Ahlan!',
    heroKicker: 'Lebanese street food · Kansas City',
    browseTitle: 'Browse the menu',
    featuredTitle: 'Signatures',
    seeAll: 'See all',
    halalTitle: '100% halal. Always.',
    testimonialsTitle: 'Loved in KC',
    visitTitle: 'Visit us',
  },
  location: {
    title: 'Visit',
    heading: 'Come say *ahlan*',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    directions: 'Get directions',
    call: (phone: string) => `Call ${phone}`,
    detailsSoon: 'Address and hours are on their way. Hungry now? Order delivery.',
  },
  about: {
    title: 'Our story',
  },
  notFound: {
    title: 'This dish isn’t on the menu',
    body: 'We couldn’t find that page. Let’s get you back to the good stuff.',
    cta: 'Back to the menu',
  },
  preview: {
    notice: 'Preview: you are seeing unpublished changes.',
    exit: 'Exit preview',
  },
  footer: {
    halal: '100% halal',
    tagline: 'The recipe is Lebanese. The extra attitude is ours.',
    follow: 'Follow us',
  },
} as const
