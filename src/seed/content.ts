/**
 * Seed content, transcribed from docs/content/ (scraped from albeik.us on
 * 2026-10-12). Corrections are commented next to the original wording.
 * Nothing here is invented: unknown facts (prices, hours, address, phone)
 * are left out on purpose. See TODO at the bottom.
 */
import type { MenuTag } from '@/lib/data/types'

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
export const heroLoop: { file: string; mimeType: string } | null = null

export type SeedCategory = { name: string; sortOrder: number }

export const categories: SeedCategory[] = [
  { name: 'Specials', sortOrder: 0 },
  { name: 'Appetizers', sortOrder: 1 },
  { name: 'Sandwiches', sortOrder: 2 },
  // TODO(menu): the full menu (/our-menu) isn't scraped yet; these stay
  // empty, and empty categories are hidden on the site.
  { name: 'Platters', sortOrder: 3 },
  { name: 'Sides', sortOrder: 4 },
  { name: 'Drinks', sortOrder: 5 },
  { name: 'Desserts', sortOrder: 6 },
]

export type SeedItem = {
  name: string
  category: string
  description: string
  image: { file: string; source: string; width: number; height: number }
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
 */
export const menuItems: SeedItem[] = [
  // ── Specials ("AlBeik Specials" on the live home page)
  {
    name: 'AlBeik Smashed Burger', // was "Albeik Smashed Burger"
    category: 'Specials',
    // fixed: "smashed smashed patty"
    description: 'Our signature smashed patty topped with cheese, caramelized onion and coleslaw',
    image: photo('albeik-smashed-burger-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'AlBeik Chicken Sandwich', // was "Albeik chicken sandwich"
    category: 'Specials',
    description:
      'Our signature sandwich made of grilled seasoned chicken, melted cheese, grilled green pepper and onions, and a drizzle of our Avocado sauce',
    image: photo('albeik-chicken-sandwich-brand.webp', 1254),
    tags: ['signature'],
  },

  // ── Appetizers
  {
    name: 'Arayes Sujuk',
    category: 'Appetizers',
    description:
      'Lebanese sujuk spread on pita bread and toasted, topped with pickles, Mayo, corn, lettuce and tomatoes',
    image: photo('arayes-sujuk-brand.webp', 1254),
  },
  {
    name: 'Arayes Kafta',
    category: 'Appetizers',
    description: 'Juicy Beef Kafta spread in pita bread and grilled',
    image: photo('arayes-kafta-brand.webp', 1254),
  },
  {
    name: 'Hummus',
    category: 'Appetizers',
    description: 'Freshly made hummus served with Pita Bread',
    image: photo('hummus-brand.webp', 1254),
  },
  {
    name: 'Hummus with Beef Shawarma', // was "Hummus with Beef shawarma"
    category: 'Appetizers',
    description: 'Hummus, topped with our signature beef shawarma. Served with Lebanese Pita bread',
    image: photo('hummus-with-beef-shawarma-brand.webp', 1254),
  },
  {
    name: 'Hummus with Chicken Shawarma', // was "Hummus with chicken shawarma"
    category: 'Appetizers',
    description:
      'Hummus topped with our signature chicken shawarma. Served with Lebanese Pita bread.',
    image: photo('hummus-with-chicken-shawarma-brand.webp', 1254),
  },
  {
    name: 'Baba Ghannouj',
    category: 'Appetizers',
    // fixed: stray ")" after "bread"
    description:
      'Smoky dip made from roasted eggplant, tahini, garlic and lemon juice. Served with Lebanese Pita bread',
    image: photo('baba-ghannouj-brand.webp', 1254),
  },

  // ── Sandwiches
  {
    name: 'Beef Shawarma Sandwich',
    category: 'Sandwiches',
    description: 'Our signature beef shawarma sandwich with biwaz salad, pickles and tahini sauce',
    image: photo('beef-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Francisco Sandwich', // was "Francisco sandwich"
    category: 'Sandwiches',
    description: 'Grilled chicken over melted cheese with aioli sauce, pickles, lettuce and corn.',
    image: photo('francisco-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kafta Sandwich',
    category: 'Sandwiches',
    description:
      'Beef Kafta skewer wrapped in Lebanese Pita bread over hummus, biwaz, pickles, tomatoes and tahini sauce',
    image: photo('kafta-sandwich-brand.webp', 1254),
  },
  {
    name: 'Falafel Sandwich',
    category: 'Sandwiches',
    description:
      'Crispy Falafel balls served in soft Lebanese Pita Bread with Tahini sauce and Vegetables (Tomatoes, Parsley, Turnip pickles)',
    image: photo('falafel-sandwich-brand.webp', 1254),
  },
  {
    name: 'Chicken Shawarma Sandwich', // was "Chicken shawarma Sandwich"
    category: 'Sandwiches',
    description:
      'Slices of Chicken shawarma with Garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo('chicken-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Orfali Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled special beef Kabab blend, tomatoes, over hummus and Biwaz Salad. Wrapped in Lebanese Pita Bread and drizzled with Tahini sauce',
    image: photo('kabab-orfali-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled beef Kabab, over hummus, tahini, pickles, tomatoes and Biwaz Salad. Wrapped in Lebanese Pita bread.',
    image: photo('kabab-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Rib-eye Sandwich', // fixed: "Ribe-eye"
    category: 'Sandwiches',
    description:
      'Charbroiled rib-eye beef chunks with hummus and Biwaz salad (Parsley, Onion and Sumac) wrapped in Lebanese Pita Bread',
    image: photo('charbroiled-rib-eye-sandwich-brand.webp', 1254),
  },
  {
    name: 'Chicken Tawouk Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled chicken breast pieces seasoned with our special spices, over garlic sauce, pickles and wrapped in Lebanese Pita bread.',
    image: photo('chicken-tawouk-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Chicken Sandwich', // was "Charbroiled Chicken sandwich"
    category: 'Sandwiches',
    description:
      'Charbroiled chicken with Garlic sauce, spicy garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo('charbroiled-chicken-sandwich-brand.webp', 1254),
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
    // ATTITUDE IS OURS", with LEBANESE highlighted).
    headline: 'The recipe is *Lebanese*. The extra attitude is ours.',
    subline: 'A taste of home, miles away from Beirut',
  },
  promise: {
    headline: '100% *Halal*, Fresh & Delicious', // HALAL highlighted, as on Instagram
    // "Al Beik" → "AlBeik"; "Lebanon-a" → "Lebanon — a".
    body: "We created AlBeik to be a place where you can rediscover the joy of Lebanese food, whether you are a fellow expat, or simply a lover of great cuisine. Every meal is crafted with the same passion, care and dedication you'd find in a Lebanese Kitchen. Come and experience the flavors of Lebanon — a little closer to home.",
  },
  featured: ['AlBeik Smashed Burger', 'AlBeik Chicken Sandwich'],
  promo: {
    // Off by default; copy from the Instagram countdown posts.
    enabled: false,
    text: '*Clock is ticking.* Spice bomb is waiting.',
    linkLabel: 'See the menu',
    linkUrl: '/menu',
  },
}

export const about = {
  headline: 'Rooted in Flavor, Driven by Purpose',
  // fixed: "hala" → "halal", "commited" → "committed", "Kansas city" → "Kansas City"
  markdown: `At AlBeik, our mission is to bring the authentic taste of Lebanon to every table - serving 100% halal, freshly prepared meals that celebrate tradition, flavor and hospitality. We are committed to using quality ingredients, honoring time-tested recipes and delivering a warm, welcoming experience to every guest. Whether it's your first visit or your fiftieth, AlBeik is where food feels like home.

## A taste of home, miles away from Beirut

At AlBeik, we serve more than just food - we serve a piece of Beirut's soul. From the smoky aroma of grilled meats to the rich, comforting flavors of traditional mezze, every dish is a tribute to Lebanon's vibrant street food culture. In the heart of Kansas City, we bring you an authentic taste of Beirut - fresh, halal and full of love.`,
}

export const siteSettings = {
  siteName: 'AlBeik',
  // The live site's meta description.
  defaultDescription: 'A taste of home, miles away from Beirut',
  // Only the city is known (brief: "Kansas City (State Line shops)").
  location: { name: 'Kansas City', city: 'Kansas City' },
}

/** AlBeik's store pages, from the client (2026-10-14). Item-level links can be added per dish in the CMS. */
export const storeLinks = {
  doordashStoreUrl: 'https://www.doordash.com/store/albeik-kansas-city-32933201/54031354/',
  uberEatsStoreUrl:
    'https://www.ubereats.com/store/al-beik-state-line-rd/lkFhH1rNVt-gZXLRIOxHzA?diningMode=DELIVERY',
}

/** Printed after seeding; also listed in the README. */
export const TODO = [
  'Full menu (Platters, Sides, Drinks, Desserts are empty): scrape /our-menu or get it from the client',
  'Prices (and decide whether to show them: Site settings → Show prices)',
  'Item-level DoorDash / Uber Eats links, if the client wants to collect them (optional)',
  'Address, phone, opening hours and Google Maps link (Site settings → Locations)',
  'Logo files and social links (Site settings)',
  'Testimonial sources (Google, Yelp…)',
  'Dietary tags (spicy, vegetarian) once the client confirms them',
]
