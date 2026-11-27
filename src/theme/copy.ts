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
  marqueeLate: ['Juicier', 'Meatier', 'Tastier', 'The extra attitude is ours'],
  order: {
    cta: 'Order',
    now: 'Order now',
    ctaFor: (item: string) => `Order ${item}`,
    ctaForOn: (item: string, platform: string) => `Order on ${platform}: ${item}`,
    on: (platform: string) => `Order on ${platform}`,
    sheetTitle: 'Pick your app',
    sheetIntro: 'Spice bomb is waiting.',
    sheetIntroFor: (item: string) => `${item}. Coming right up.`,
    storeLevelNote: 'Opens AlBeik’s page',
    cloverFullMenu: 'Open full menu on Clover',
    close: 'Not yet',
    stickyKicker: 'Spice bomb is waiting',
    // The blueprint's two journeys (section 1); the header's "Order now"
    // unfolds into them.
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
    pickupInApp: (platform: string) => `Choose Pickup in ${platform}`,
    // Each journey's own page (/order/delivery, /order/pickup).
    page: {
      delivery: 'Order *delivery*',
      pickup: 'Order for *pickup*',
    },
    menuFirst: 'See the menu first',
  },
  // Online pickup: the bag, the Add sheet and the checkout.
  bag: {
    add: 'Add',
    addFor: (item: string) => `Add ${item} to your bag`,
    added: 'Added',
    addPrice: (price: string) => `Add · ${price}`,
    loading: 'Checking today’s prices…',
    required: 'Required',
    optional: (max: number | null) => (max ? `Optional · up to ${max}` : 'Optional'),
    pickOne: 'Pick one',
    quantity: 'Quantity',
    fewer: 'One fewer',
    more: 'One more',
    soldOut: 'Sold out today',
    busy: 'Ordering is busy right now.',
    busyHelp: 'Please call us, or order on the apps.',
    call: 'Call us',
    apps: 'Order on the apps',
    view: (count: number, total: string) => `View bag (${count}) · ${total}`,
    viewShort: (count: number) => `Bag (${count})`,
    title: 'Your *bag*',
    empty: 'Your bag is empty.',
    emptyCta: 'See the menu',
    remove: (item: string) => `Remove ${item}`,
    dropped: (n: number) =>
      n === 1 ? '1 item is no longer available and was removed.' : `${n} items are no longer available and were removed.`,
  },
  checkout: {
    eyebrow: 'Pickup',
    title: 'Your *order*',
    bag: 'Your bag',
    edit: 'Add more',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    checking: 'Checking prices…',
    details: 'Pickup details',
    readyAround: (time: string) => `Ready around ${time}`,
    name: 'Name for pickup',
    phone: 'Phone',
    phoneHelp: 'Only if we need to reach you about this order.',
    email: 'Email for a receipt (optional)',
    payment: 'Payment',
    cardNote: 'Card details go straight to Clover, our card processor.',
    previewNote: 'Preview: no card needed.',
    previewDecline: 'Test a declined card',
    walletOr: 'or pay by card',
    fieldsLoading: 'The card form is still loading.',
    fieldsFailed: 'The card form couldn’t load.',
    reload: 'Reload',
    pay: (total: string) => `Pay ${total}`,
    paying: 'Paying…',
    declined: 'Your card was declined. Try another card, or call us.',
    closedTitle: 'Online ordering is closed',
    lineOptions: (parts: string[]) => parts.join(' · '),
    // The confirmation page.
    confirming: 'Confirming your order…',
    inTitle: (number: string) => `Order #${number} is in.`,
    readyAt: (time: string) => `Ready around ${time}.`,
    pickupAt: 'Pick it up at',
    directions: 'Directions',
    pendingTitle: 'Still confirming your payment',
    pendingBody: 'Please don’t pay again. Check again in a moment, or call us with your name.',
    checkAgain: 'Check again',
    declinedTitle: 'Payment declined',
    tryAgain: 'Try another card',
    reviewTitle: 'We need to check this order',
    reviewBody: (ref: string) =>
      `No payment was taken. Please call us and mention reference ${ref} before ordering again.`,
    stoppedTitle: 'Your order didn’t go through',
    missingTitle: 'No order to show',
    backToMenu: 'Back to the menu',
    orderMore: 'Order something else',
  },
  menu: {
    title: 'Menu',
    categoriesLabel: 'Menu categories',
    // Under the heading: this is the everyday menu, catering has its own.
    subline: 'Everyday dishes for delivery, pickup or dine-in.',
    cateringLink: 'Your gang coming over? See the catering menu',
    empty: 'The grill is warming up.',
    // The blueprint's halal explainer and short statement (section 5).
    halalTitle: '100% *halal*',
    halalNote:
      'If you have a question about a dish or an ingredient, please contact our team before ordering.',
    cateringNote:
      'Mezze trays, sandwich boxes, lunch boxes and buffets for the office or the party.',
    count: (n: number) => (n === 1 ? '1 option' : `${n} options`),
    // A sandwich's two prices: alone, and as a combo.
    combo: 'Combo',
    comboPrice: (price: string) => `Combo ${price}`,
    comboNote: 'Combo: small fries and a 20 oz fountain drink with free refills. Large fries +$1.',
    sandwich: 'Sandwich',
    // The first price when a dish also comes in other sizes.
    regular: 'Regular',
    // A dish on offer (Deal price in the admin): the old price is crossed out.
    was: 'Was',
    now: 'now',
    deal: 'Deal',
    viewItem: (item: string) => `View ${item}`,
  },
  item: {
    backTo: (category: string) => `Back to ${category} on the menu`,
    tags: {
      spicy: 'Spicy',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      popular: 'Popular',
      new: 'New',
      signature: 'Signature',
    } satisfies Record<MenuTag, string>,
  },
  home: {
    // The blueprint's eyebrow (section 2).
    heroKicker: 'Lebanese favorites in the heart of Kansas City',
    // The blueprint asks for a compact halal label by the order buttons.
    halalChip: '100% halal',
    featuredTitle: 'The *signatures*',
    seeMenu: 'See the menu',
    fullMenu: 'The whole menu',
    storyLink: 'Our story',
    // The blueprint's halal callout (section 2), without "certified" until
    // the client names the certifier.
    halal: {
      title: 'Good food. Better choices.',
      body: 'Everything we serve is 100% halal, with the Lebanese flavors you came for. Questions about a dish or an ingredient? Ask us before you order.',
    },
    categoriesTitle: 'The whole foodie *saga*',
    testimonialsTitle: 'Word on the *street*',
    testimonialsSubtitle: 'Spreading like wildfire',
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
      'Quick pickup or a meal worth sharing? Stop by AlBeik for your absolute Lebanese favorites. Check today’s hours before heading over. We are waiting for you.',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    directions: 'Get directions',
    orderAhead: 'Order ahead',
    // Confirmed by the client (2026-11-02). Holiday hours aren't decided yet.
    goodToKnow: 'Good to know',
    facts: [
      { label: 'Dine in', value: 'Yes. Grab a table.' },
      { label: 'Parking', value: 'Yes. Pull right in.' },
    ],
    call: (phone: string) => `Call ${phone}`,
    detailsSoon: 'Address and hours are on their way. Hungry now? Order online.',
    hoursSoon: 'Opening hours are on their way. Hungry now? Order online.',
  },
  catering: {
    // Above the heading, so the page never reads as the everyday menu.
    eyebrow: 'Catering menu · order by phone',
    // The client's wordplay (2026-11-15). Only here: the nav, the eyebrow
    // and the page title keep "catering", which is what people search for.
    heading: '*Caring* for the whole crew',
    sectionsLabel: 'Catering sections',
    menuLink: 'Ordering for yourself? See the everyday menu',
    // The phone bar on the catering page, in place of Delivery and Pickup.
    barKicker: 'Catering orders',
    barCta: 'Call to order',
    barCtaLabel: (phone: string) => `Call ${phone} to order catering`,
    call: (phone: string) => `Call ${phone} to order`,
    email: (address: string) => `Email ${address}`,
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
  banner: {
    label: 'Special offer',
    /** When the editor gave a link but no label. */
    more: 'Find out more',
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
      `Lebanese catering in Kansas City from ${site}: mezze trays, sandwich boxes, lunch boxes and buffets for offices and events. Contact us to order.`,
    visitDescription: (site: string) =>
      `Find ${site} on State Line Road. View current hours, get directions, call the restaurant, or place a pickup order.`,
  },
  footer: {
    // The client's slogan, LEBANESE in red as in the brand guidelines.
    tagline: 'Come hungry. Leave a little *Lebanese*.',
    mapLabel: 'Find us',
    mapTitle: 'Map: AlBeik on State Line Rd, Kansas City',
    follow: 'Follow us',
  },
} as const
