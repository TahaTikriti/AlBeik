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
    catering: 'Catering',
  },
  // Facts, not filler: the charcoal grill and family recipes are from press coverage.
  marquee: ['Charcoal-grilled', 'Family recipes', 'Beirut street food', 'Kansas City'],
  // The second strip, lower on the home page: lines from the Instagram posts.
  marqueeLate: ['Juicier', 'Meatier', 'Tastier', 'Spice bomb is waiting'],
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
    // The blueprint's two journeys (section 1): never just "Order now".
    modes: {
      delivery: {
        short: 'Delivery',
        cta: 'Order Delivery',
        line: 'Lebanese favorites, brought to your door.',
      },
      pickup: {
        short: 'Pickup',
        cta: 'Order for Pickup',
        line: 'Skip the wait. Pick up your order at AlBeik on State Line Rd.',
      },
    },
    modeLabel: 'Delivery or pickup',
    pickupInApp: (platform: string) => `Choose Pickup on ${platform}’s page`,
    // Each journey's own page (/order/delivery, /order/pickup).
    page: {
      delivery: 'Order *delivery*',
      pickup: 'Order for *pickup*',
    },
    menuFirst: 'See the menu first',
  },
  menu: {
    title: 'Menu',
    categoriesLabel: 'Menu categories',
    empty: 'The grill is warming up.',
    // The blueprint's halal explainer and short statement (section 5).
    halalTitle: '100% *halal*',
    halalNote:
      'If you have a question about a dish or an ingredient, please contact our team before ordering.',
    cateringNote:
      'Mezze trays, sandwich boxes, lunch boxes and buffets for the office or the party.',
    count: (n: number) => (n === 1 ? '1 dish' : `${n} dishes`),
    viewItem: (item: string) => `View ${item}`,
  },
  item: {
    backTo: (category: string) => `Back to ${category} on the menu`,
    tags: {
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      popular: 'Popular',
      new: 'New',
      signature: 'Signature',
    } satisfies Record<MenuTag, string>,
  },
  home: {
    // The blueprint's eyebrow (section 2).
    heroKicker: 'Lebanese favorites in Kansas City',
    // The blueprint asks for a compact halal label by the order buttons.
    halalChip: '100% halal',
    featuredTitle: 'The *signatures*',
    seeMenu: 'See the menu',
    fullMenu: 'The whole menu',
    storyLink: 'Our story',
    // The blueprint's halal callout (section 2), without "certified" until
    // the client names the certifier.
    halal: {
      title: 'Good food. Clear choices.',
      body: 'Everything we serve is 100% halal, with the Lebanese flavors you came for. Questions about a dish or an ingredient? Ask us before you order.',
    },
    categoriesTitle: 'The whole *menu*',
    testimonialsTitle: 'Word on the *street*',
    visitTitle: 'Find *us*',
    visitBody: 'Pull up to State Line, or let it come to you.',
    // The blueprint's entry cards (section 1).
    finalTitle: 'Hungry *yet*?',
    deliveryCard: {
      title: 'Hungry at home?',
      body: 'We’ll bring the good stuff to you. Choose delivery to browse the AlBeik menu and check availability in your area.',
    },
    pickupCard: {
      title: 'On the way?',
      body: 'Place your order now and pick it up at AlBeik. Fresh Lebanese favorites, ready for your stop.',
    },
  },
  location: {
    title: 'Visit',
    // The blueprint's Visit page headline and intro (section 7).
    heading: 'Find us on *State Line* Road.',
    intro:
      'Stop by AlBeik for Lebanese favorites, a quick pickup, or a meal worth sharing. Check today’s hours before you head over.',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    directions: 'Get directions',
    orderAhead: 'Order ahead',
    call: (phone: string) => `Call ${phone}`,
    detailsSoon: 'Address and hours are on their way. Hungry now? Order online.',
    hoursSoon: 'Opening hours are on their way. Hungry now? Order online.',
  },
  catering: {
    heading: '*Catering* for the whole crew',
    call: (phone: string) => `Call ${phone} to order`,
    leadTime: 'Order 24–48 hours ahead; longer for 50+ meals.',
    howTo: 'How to order',
    tags: { vegan: 'Vegan', vegetarian: 'Vegetarian' },
    // The menu page's pointer to it.
    band: 'Feeding a crowd?',
    bandLink: 'See catering',
  },
  about: {
    title: 'Our story',
    // The blueprint's Story CTA (section 6), and a way to the door.
    menuCta: 'Explore the menu',
    visitCta: 'Plan your visit',
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
  promo: {
    /** Flip-clock countdown, like the "02 DAYS TO TASTEBUD TANTALIZATION" posts. */
    left: (n: number, unit: 'day' | 'hour') => `${unit}${n === 1 ? '' : 's'} to go`,
  },
  // Page titles and descriptions from the client's blueprint (section 8).
  seo: {
    homeTitle: (site: string) => `${site} | Lebanese Food in Kansas City, MO`,
    menuTitle: (site: string) => `Menu | ${site} Lebanese Restaurant in Kansas City`,
    menuDescription: (site: string) =>
      `Explore the ${site} menu, from Batata Harra and Fattoush to charcoal-grilled favorites. Choose delivery or pickup in Kansas City.`,
    storyTitle: 'Our Story',
    storyDescription: (site: string) =>
      `Meet ${site}, bringing Lebanese flavor and generous hospitality to Kansas City. Explore the menu and plan your visit.`,
    visitTitle: (site: string, address: string) => `Visit ${site} | ${address}`,
    cateringTitle: (site: string) => `Catering | ${site} Lebanese Catering in Kansas City`,
    cateringDescription: (site: string) =>
      `Lebanese catering in Kansas City from ${site}: mezze trays, sandwich boxes, lunch boxes and buffets for offices and events. Call to order.`,
    visitDescription: (site: string) =>
      `Find ${site} on State Line Road. View current hours, get directions, call the restaurant, or place a pickup order.`,
  },
  footer: {
    // As in the brand guidelines, LEBANESE in red.
    tagline: 'The recipe is *Lebanese*. The extra attitude is ours.',
    mapLabel: 'Find us',
    mapTitle: 'Map: AlBeik on State Line Rd, Kansas City',
    follow: 'Follow us',
  },
} as const
