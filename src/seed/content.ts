/**
 * Seed content, transcribed from docs/content/ (scraped from albeik.us on
 * 2026-10-12). Corrections are commented next to the original wording.
 * Nothing here is invented: unknown facts (prices, hours, address, phone)
 * are left out on purpose. See TODO at the bottom.
 */
import type { MenuTag } from '@/lib/data/types'
import type { HoursRow } from '@/lib/hours'

const S3 = 'https://s3.eu-central-1.amazonaws.com/storage.albeik.us'

/** Original editorial photos in public/seed, served at /seed/<file>. */
export const images = {
  // Web copy of docs/brand/photos/tawook.png (the client's brand photo set),
  // cut to a centred square: the hero never shows more than that.
  hero: {
    file: 'hero-tawook.webp',
    width: 1122,
    height: 1122,
    alt: 'Chicken tawouk skewers charring over glowing charcoal, smoke rising',
    source: 'docs/brand/photos/tawook.png',
  },
  dining: {
    file: 'hero-landscape.webp',
    width: 1500,
    height: 1000,
    alt: 'The AlBeik dining room, with wooden booths, the order counter and menu screens',
    source: `${S3}/70/conversions/albeik-landscape2-large.webp`,
  },
  // Web copy of docs/brand/photos/platter-2.png.
  spread: {
    file: 'platter-spread.webp',
    width: 1536,
    height: 1024,
    alt: 'Overhead spread: chicken tawouk skewers with fries and grilled tomatoes, fattoush, hummus, garlic sauce, pickles and pita',
    source: 'docs/brand/photos/platter-2.png',
  },
} as const

/**
 * Optional silent video loop over the hero photo (the photo stays as its
 * poster). Put an MP4 (H.264, ~6-10 s, under ~3 MB) in public/seed and name
 * it here; null shows the photo alone.
 */
// Pexels video 14554564 (free licence, commercial use, no credit needed):
// chicken tawouk over coals, cropped to the food (the hand turning skewers is
// cut out) and crossfaded end-to-start so it loops seamlessly; 10.5 s, 720x944.
// Its poster is the loop's own first frame, so nothing else shows behind it.
export const heroLoop: { file: string; mimeType: string; poster: string } | null = {
  file: 'hero-loop.mp4',
  mimeType: 'video/mp4',
  poster: 'hero-loop-poster.webp',
}

export type SeedCategory = { name: string; description: string; sortOrder: number }

/**
 * Names and introductions from the client's content blueprint (2026-10-29,
 * not in the repo; section 4). Empty categories are hidden on the site.
 */
export const categories: SeedCategory[] = [
  {
    name: 'Start with the Good Stuff',
    description: 'Little plates and Lebanese favorites made for the middle of the table.',
    sortOrder: 0,
  },
  {
    name: 'Fresh from the Garden',
    description: 'Bright salads and crisp sides with herbs, vegetables, and Lebanese character.',
    sortOrder: 1,
  },
  {
    name: 'From the Charcoal',
    description:
      'Smoky, satisfying plates grilled over charcoal and served with the restaurant’s chosen accompaniments.',
    sortOrder: 2,
  },
  {
    name: 'Shawarma and More',
    description: 'Slow-seasoned shawarma, served in the formats guests love.',
    sortOrder: 3,
  },
  {
    name: 'Pita, Pressed, and Stacked',
    // The combo line is from the old albeik.us menu.
    description:
      'Handheld favorites with a proper filling and a good reason to take another bite. Make it a combo with small fries and a 20 oz fountain drink.',
    sortOrder: 4,
  },
  {
    name: 'Sides Worth Sharing',
    description: 'A little extra for the table, or the part of the meal you keep to yourself.',
    sortOrder: 5,
  },
  {
    name: 'Something Sweet',
    description: 'A sweet finish for one, or something to split after the last savory bite.',
    sortOrder: 6,
  },
  {
    name: 'Drinks',
    description: 'Cool sips, familiar favorites, and something to balance the spice.',
    sortOrder: 7,
  },
]

export type SeedItem = {
  name: string
  category: string
  description?: string
  /** Dishes without a photo yet show as text on the menu. */
  image?: { file: string; source: string; width: number; height: number }
  tags?: MenuTag[]
}

/** Client-selected AI menu recreations. See docs/menu-images.md for provenance. */
const photo = (file: string, size: number) => ({
  file,
  source: `/seed/${file}`,
  width: size,
  height: size,
})

/**
 * Item names are title-cased and use the "AlBeik" spelling; the live site
 * mixes "Albeik" and lower-case words. Descriptions are verbatim apart from
 * the commented fixes. Only `signature` is tagged (the copy says "Our
 * signature…"); dietary tags wait for the client.
 *
 * Sources: the old albeik.us home page and /our-menu; AlBeik's own Uber Eats
 * menu (2026-10-29: names and sizes only, it has no descriptions, and its
 * prices are app prices); for dishes only the blueprint names, the client's
 * catering menu (see catering.ts). Grouped as in the blueprint's menu
 * architecture.
 */
export const menuItems: SeedItem[] = [
  // ── Start with the Good Stuff ("Appetizers" on the old site)
  {
    name: 'Hummus',
    category: 'Start with the Good Stuff',
    description: 'Freshly made hummus served with Pita Bread',
    image: photo('hummus-brand.webp', 1254),
  },
  {
    name: 'Baba Ghannouj',
    category: 'Start with the Good Stuff',
    // fixed: stray ")" after "bread"
    description:
      'Smoky dip made from roasted eggplant, tahini, garlic and lemon juice. Served with Lebanese Pita bread',
    image: photo('baba-ghannouj-brand.webp', 1254),
  },
  {
    name: 'Falafel', // "Falafel- 6 pieces" on Uber Eats
    category: 'Start with the Good Stuff',
    // From the catering menu's falafel tray.
    description: 'Six crispy chickpea falafel with tahini sauce.',
  },
  {
    name: 'Hummus and Falafel', // on Uber Eats
    category: 'Start with the Good Stuff',
    description: 'Freshly made hummus with crispy falafel. Served with Lebanese Pita bread',
  },
  {
    // Named in the blueprint, 4 pieces on Uber Eats; description from the catering menu.
    name: 'Cheese Rolls',
    category: 'Start with the Good Stuff',
    description: 'Four crispy rolls filled with melted cheese and parsley.',
  },

  // ── Fresh from the Garden ("Salads" on the old /our-menu)
  {
    name: 'Fattoush',
    category: 'Fresh from the Garden',
    description:
      'Fresh vegetables with crispy pieces of pita bread and pomegranate molasses dressing.',
  },
  {
    name: 'Tabbouleh', // was "Taboule"; the catering menu spells it Tabbouleh
    category: 'Fresh from the Garden',
    // fixed: "Bulghur" → "bulgur"
    description: 'Finely chopped parsley, tomatoes, green onions, fresh mint and bulgur wheat',
  },

  // ── From the Charcoal ("Platters" on the old /our-menu)
  {
    name: 'Grill Platter',
    category: 'From the Charcoal',
    description:
      'Our mixed grill platter of three skewers, served over rice or fries, our garlic and spicy garlic sauce, grilled veggies, biwaz salad and pickles with pita bread',
  },
  {
    name: 'Charbroiled Half Chicken', // was "Charbroiled half chicken"
    category: 'From the Charcoal',
    description:
      'Half chicken served over rice or fries, pickles, garlic sauce and spicy garlic sauce with Pita bread',
  },
  {
    name: 'Charbroiled Whole Chicken', // was "Charbroiled whole Chicken"
    category: 'From the Charcoal',
    description:
      'Charbroiled whole chicken served with Rice or Fries, pickles, garlic sauce and spicy garlic sauce with Pita bread',
  },

  // ── Shawarma and More
  {
    name: 'Chicken Shawarma Sandwich', // was "Chicken shawarma Sandwich"
    category: 'Shawarma and More',
    description:
      'Slices of Chicken shawarma with Garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo('chicken-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Beef Shawarma Sandwich',
    category: 'Shawarma and More',
    description: 'Our signature beef shawarma sandwich with biwaz salad, pickles and tahini sauce',
    image: photo('beef-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Hummus with Beef Shawarma', // was "Hummus with Beef shawarma"
    category: 'Shawarma and More',
    description: 'Hummus, topped with our signature beef shawarma. Served with Lebanese Pita bread',
    image: photo('hummus-with-beef-shawarma-brand.webp', 1254),
  },
  {
    name: 'Hummus with Chicken Shawarma', // was "Hummus with chicken shawarma"
    category: 'Shawarma and More',
    description:
      'Hummus topped with our signature chicken shawarma. Served with Lebanese Pita bread.',
    image: photo('hummus-with-chicken-shawarma-brand.webp', 1254),
  },

  {
    // Uber Eats: Chicken / Beef Shawarma Box (for 2) and Feast (for 4).
    name: 'Shawarma Feast',
    category: 'Shawarma and More',
    description: 'Chicken or beef shawarma, packed to share: a box for two or a feast for four.',
  },

  // ── Pita, Pressed, and Stacked ("AlBeik Specials", appetizer arayes and "Sandwiches")
  {
    name: 'AlBeik Smashed Burger', // was "Albeik Smashed Burger"
    category: 'Pita, Pressed, and Stacked',
    // fixed: "smashed smashed patty"
    description: 'Our signature smashed patty topped with cheese, caramelized onion and coleslaw',
    image: photo('albeik-smashed-burger-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'AlBeik Chicken Sandwich', // was "Albeik chicken sandwich"
    category: 'Pita, Pressed, and Stacked',
    description:
      'Our signature sandwich made of grilled seasoned chicken, melted cheese, grilled green pepper and onions, and a drizzle of our Avocado sauce',
    image: photo('albeik-chicken-sandwich-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'Arayes Sujuk',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Lebanese sujuk spread on pita bread and toasted, topped with pickles, Mayo, corn, lettuce and tomatoes',
    // No photo until the reshoot: the review said arayes-sujuk-brand.webp reads as pizza.
  },
  {
    name: 'Arayes Kafta',
    category: 'Pita, Pressed, and Stacked',
    description: 'Juicy Beef Kafta spread in pita bread and grilled',
    image: photo('arayes-kafta-brand.webp', 1254),
  },
  {
    name: 'Chicken Tawouk Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled chicken breast pieces seasoned with our special spices, over garlic sauce, pickles and wrapped in Lebanese Pita bread.',
    image: photo('chicken-tawouk-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Chicken Sandwich', // was "Charbroiled Chicken sandwich"
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled chicken with Garlic sauce, spicy garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo('charbroiled-chicken-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Rib-eye Sandwich', // fixed: "Ribe-eye"
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled rib-eye beef chunks with hummus and Biwaz salad (Parsley, Onion and Sumac) wrapped in Lebanese Pita Bread',
    image: photo('charbroiled-rib-eye-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kafta Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Beef Kafta skewer wrapped in Lebanese Pita bread over hummus, biwaz, pickles, tomatoes and tahini sauce',
    image: photo('kafta-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled beef Kabab, over hummus, tahini, pickles, tomatoes and Biwaz Salad. Wrapped in Lebanese Pita bread.',
    image: photo('kabab-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Orfali Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled special beef Kabab blend, tomatoes, over hummus and Biwaz Salad. Wrapped in Lebanese Pita Bread and drizzled with Tahini sauce',
    image: photo('kabab-orfali-sandwich-brand.webp', 1254),
  },
  {
    name: 'Francisco Sandwich', // was "Francisco sandwich"
    category: 'Pita, Pressed, and Stacked',
    description: 'Grilled chicken over melted cheese with aioli sauce, pickles, lettuce and corn.',
    image: photo('francisco-sandwich-brand.webp', 1254),
  },
  {
    name: 'Falafel Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Crispy Falafel balls served in soft Lebanese Pita Bread with Tahini sauce and Vegetables (Tomatoes, Parsley, Turnip pickles)',
    image: photo('falafel-sandwich-brand.webp', 1254),
  },

  {
    name: 'Gyro', // on Uber Eats; description from the catering menu's gyro box
    category: 'Pita, Pressed, and Stacked',
    description: 'Gyro meat with lettuce, onions, tomatoes, cheese and tzatziki in pita bread.',
  },

  // ── Sides Worth Sharing
  {
    // Named in the blueprint; description from the catering menu.
    name: 'Batata Harra',
    category: 'Sides Worth Sharing',
    description: 'Lebanese-style potatoes tossed with garlic, cilantro, and a spicy sauce.',
  },
  {
    name: 'Fries', // small or large on Uber Eats
    category: 'Sides Worth Sharing',
    description: 'Crispy golden fries, small or large.',
  },

  // ── Something Sweet: the two on Uber Eats (the catering menu's pistachio
  // cake isn't sold on its own there)
  { name: 'Lebanese Rice Pudding', category: 'Something Sweet' },
  { name: 'Baklava', category: 'Something Sweet' },

  // ── Drinks (20 oz cups, per the old /our-menu)
  {
    name: 'Lebanese Lemonade', // was "Lemonade"; Uber Eats' name
    category: 'Drinks',
    // fixed: "Lemonade the lebanese way"
    description: 'Freshly squeezed homemade lemonade, the Lebanese way',
  },
  {
    name: 'Laban Ayran', // was "Aryan(Yogurt)"; the blueprint's name
    category: 'Drinks',
    description: 'Yogurt drink with a pinch of salt',
  },
  {
    name: 'Fountain Drink', // on Uber Eats
    category: 'Drinks',
    description: 'A 20 oz cup, your pick.',
  },
]

/** Customer quotes stay verbatim (surrounding spaces trimmed). Sources unknown; avatars were placeholders. */
export const testimonials = [
  {
    name: 'Peachy K.',
    quote:
      'A chill atmosphere with delicious halal food? Sign me up! I ordered their smash burger, and it did not disappoint. I also appreciate that they use reusable cups and silverware — it makes me feel a little more environmentally conscious.',
  },
  {
    name: 'Clara B.',
    quote:
      'I have had a lot of Mediterranean food and this was by far the best I’ve had in general and in KC! I got the kebab platter and they encouraged me to choose different skewers and customize my plate. The fatoush is amazing. I will be back many times!',
  },
  {
    name: 'Julia U',
    quote:
      'OMG Amazing!!! Such a cute little place tucked away in the stateline shops! Menu has great choices, and variety. We ordered the kabob platter, gyro and charbroiled sandwich. The presentation was gorgeous, and tasted even better.',
  },
  {
    name: 'MF',
    quote:
      'Authentic, flavorful, and worth every penny. Al Beik on State Line is hands down one of the best spots in KC for Middle Eastern food. The kabobs are juicy, the garlic sauce is addictive, and the tabbouleh is super fresh. Family-run, clean, and welcoming.',
  },
]

export const homepage = {
  hero: {
    // From AlBeik's Instagram rebrand ("THE RECIPE IS LEBANESE / THE EXTRA
    // ATTITUDE IS OURS", with LEBANESE highlighted). Kept: the client's review
    // calls it excellent.
    headline: 'The recipe is *Lebanese*. The extra attitude is ours.',
    // The blueprint's hero headline and promise (section 2), as the follow-up.
    subline:
      'Discover the Lebanese in you. Big flavor and generous comfort, right on State Line Road.',
  },
  // The blueprint's introduction (section 2), in the hero's voice.
  promise: {
    headline: 'A little *Lebanese*. A lot to love.',
    body: 'Come for the charcoal-grilled favorites. Stay for the spreads, the salads, the sandwiches and the dishes everyone reaches across the table to try. Quick lunch, easy dinner, or one more plate for the middle: AlBeik brings Lebanese flavor to Kansas City, with a little extra attitude.',
  },
  // The blueprint's signature set (section 3) as far as the menu has it
  // (Fajitanon is waiting on the client). Dishes with and without a photo
  // alternate as far as the photos allow, so the grid reads as a pattern.
  featured: [
    'AlBeik Smashed Burger',
    'Batata Harra',
    'AlBeik Chicken Sandwich',
    'Fattoush',
    'Charbroiled Rib-eye Sandwich',
    'Arayes Sujuk',
    'Shawarma Feast',
    'Hummus with Beef Shawarma',
    'Charbroiled Half Chicken',
    'Laban Ayran',
  ],
  promo: {
    // Off by default; copy from the Instagram countdown posts.
    enabled: false,
    text: '*Clock is ticking.* Spice bomb is waiting.',
    linkLabel: 'See the menu',
    linkUrl: '/menu',
  },
}

// The blueprint's Story page (section 6). The founders' own story replaces
// this once the client shares it; nothing here is invented.
export const about = {
  headline: 'Lebanese flavor. *Kansas City* welcome.',
  markdown: `AlBeik brings the flavors we love to a table close to home. Think charcoal-grilled favorites, comforting sandwiches, bright salads and Lebanese dishes made for sharing. Know exactly what you came for, or ready to try something new? There's a place for you here.

## Come hungry. Leave with a new favorite.

Some meals are quick. Some turn into a table full of dishes and “just one more bite.” We make room for both. Find your usual order, bring someone along, and let the menu do the rest.`,
}

export const siteSettings = {
  siteName: 'AlBeik',
  // The blueprint's home page description (section 8), with the AlBeik spelling.
  defaultDescription:
    'Discover Lebanese favorites, charcoal-grilled dishes, sandwiches, salads, and more at AlBeik. Order delivery or pickup at 13135 State Line Rd.',
  // How Google lists the restaurant; told to search engines as an alternate name.
  alternateName: 'Al Beik',
  // From AlBeik's Google Maps listing, shared by the client (2026-10-19).
  // Phone and hours from the old albeik.us footer (2026-10-29), awaiting the
  // client's confirmation.
  location: {
    name: 'Kansas City',
    streetAddress: '13135 State Line Rd',
    city: 'Kansas City',
    region: 'MO',
    postalCode: '64145',
    phone: '(816) 216-1703',
    hours: [
      { days: ['mon', 'tue', 'wed', 'thu'], opens: '11:00', closes: '21:00' },
      { days: ['fri', 'sat', 'sun'], opens: '11:00', closes: '22:00' },
    ] satisfies HoursRow[],
    // The listing's pin, as in the map embed below.
    geo: { latitude: 38.8899988, longitude: -94.6061227 },
    mapUrl: 'https://maps.app.goo.gl/znsqSSoN9GUnPYi2A',
    // Google Maps "Embed a map" for the listing (place ID 0x87c0c3f45ad27473:0x6183bb57e0283719).
    mapEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2500!2d-94.6061227!3d38.8899988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87c0c3f45ad27473%3A0x6183bb57e0283719!2sAL%20BEIK!5e0!3m2!1sen!2sus!4v1760000000000!5m2!1sen!2sus',
  },
}

/** From the old albeik.us footer (2026-10-29). */
export const socials = [
  { platform: 'instagram', url: 'https://www.instagram.com/albeik.us/' },
  { platform: 'tiktok', url: 'https://www.tiktok.com/@albeik.us' },
] as const

/** AlBeik's store pages, from the client (2026-10-14). Item-level links can be added per dish in the CMS. */
export const storeLinks = {
  doordashStoreUrl: 'https://www.doordash.com/store/albeik-kansas-city-32933201/54031354/',
  uberEatsStoreUrl:
    'https://www.ubereats.com/store/al-beik-state-line-rd/lkFhH1rNVt-gZXLRIOxHzA?diningMode=DELIVERY',
}

/** Printed after seeding; also listed in the README. */
export const TODO = [
  'Menu: which catering dishes are also sold individually (wings, falafel, gyro, fries, rice, Shawarma Feast, Fajitanon…)',
  'In-store prices (and decide whether to show them: Site settings → Show prices)',
  'Item-level DoorDash / Uber Eats links, if the client wants to collect them (optional)',
  'Confirm phone and opening hours (from the old albeik.us footer); holiday hours, parking, dine-in',
  'Logo files (Site settings)',
  'Testimonial sources (Google, Yelp…)',
  'Dietary tags (spicy, vegetarian) once the client confirms them',
]
