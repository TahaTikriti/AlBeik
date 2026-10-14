/**
 * Seed content, transcribed from docs/content/ (scraped from albeik.us on
 * 2026-10-12). Corrections are commented next to the original wording.
 * Nothing here is invented: unknown facts (prices, hours, address, phone)
 * are left out on purpose. See TODO at the bottom.
 */
import type { MenuTag } from '@/lib/data/types'

const S3 = 'https://s3.eu-central-1.amazonaws.com/storage.albeik.us'

/** Files live in public/seed (committed copies of the live site's images), served at /seed/<file>. */
export const images = {
  hero: {
    file: 'banner.webp',
    width: 1500,
    height: 1000,
    alt: 'Mixed grill board with kafta, chicken tawouk and beef skewers, fries, grilled vegetables, onion salad and a side salad',
    source: `${S3}/69/conversions/albeik-banner-large.webp`,
  },
  dining: {
    file: 'hero-landscape.webp',
    width: 1500,
    height: 1000,
    alt: 'The AlBeik dining room, with wooden booths, the order counter and menu screens',
    source: `${S3}/70/conversions/albeik-landscape2-large.webp`,
  },
  spread: {
    file: 'table.webp',
    width: 4000,
    height: 5000,
    alt: 'Overhead spread of AlBeik dishes: hummus, baba ghannouj, a kafta and chicken plate, wraps, a burger, wings and fries',
    source: `${S3}/49/conversions/albeik-table-large.webp`,
  },
} as const

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

/** Item photos are square; `size` is their width and height in pixels. */
const photo = (file: string, path: string, size: number) => ({
  file,
  source: `${S3}/${path}`,
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
    image: photo('albeik-smashed-burger.jpg', '89/Screenshot_20250906_141626_Photoroom.jpg', 540),
    tags: ['signature'],
  },
  {
    name: 'AlBeik Chicken Sandwich', // was "Albeik chicken sandwich"
    category: 'Specials',
    description:
      'Our signature sandwich made of grilled seasoned chicken, melted cheese, grilled green pepper and onions, and a drizzle of our Avocado sauce',
    image: photo('albeik-chicken-sandwich.jpg', '93/Screenshot_20250906_141655_Photoroom.jpg', 505),
    tags: ['signature'],
  },

  // ── Appetizers
  {
    name: 'Arayes Sujuk',
    category: 'Appetizers',
    description:
      'Lebanese sujuk spread on pita bread and toasted, topped with pickles, Mayo, corn, lettuce and tomatoes',
    image: photo('arayes-sujuk.jpg', '91/Screenshot_20250906_141427_Photoroom.jpg', 685),
  },
  {
    name: 'Arayes Kafta',
    category: 'Appetizers',
    description: 'Juicy Beef Kafta spread in pita bread and grilled',
    image: photo('arayes-kafta.jpg', '90/Screenshot_20250906_141347_Photoroom.jpg', 1080),
  },
  {
    name: 'Hummus',
    category: 'Appetizers',
    description: 'Freshly made hummus served with Pita Bread',
    image: photo('hummus.jpg', '84/Screenshot_20250906_141713_Photoroom.jpg', 569),
  },
  {
    name: 'Hummus with Beef Shawarma', // was "Hummus with Beef shawarma"
    category: 'Appetizers',
    description: 'Hummus, topped with our signature beef shawarma. Served with Lebanese Pita bread',
    image: photo('hummus-with-beef-shawarma.png', '87/6M2A9570-%282%29.png', 921),
  },
  {
    name: 'Hummus with Chicken Shawarma', // was "Hummus with chicken shawarma"
    category: 'Appetizers',
    description:
      'Hummus topped with our signature chicken shawarma. Served with Lebanese Pita bread.',
    image: photo('hummus-with-chicken-shawarma.png', '88/6M2A9570-%283%29.png', 921),
  },
  {
    name: 'Baba Ghannouj',
    category: 'Appetizers',
    // fixed: stray ")" after "bread"
    description:
      'Smoky dip made from roasted eggplant, tahini, garlic and lemon juice. Served with Lebanese Pita bread',
    image: photo('baba-ghannouj.jpg', '86/Screenshot_20250906_141706_Photoroom.jpg', 554),
  },

  // ── Sandwiches
  {
    name: 'Beef Shawarma Sandwich',
    category: 'Sandwiches',
    description: 'Our signature beef shawarma sandwich with biwaz salad, pickles and tahini sauce',
    image: photo('beef-shawarma-sandwich.jpg', '102/Screenshot_20250906_141508_Photoroom.jpg', 504),
  },
  {
    name: 'Francisco Sandwich', // was "Francisco sandwich"
    category: 'Sandwiches',
    description: 'Grilled chicken over melted cheese with aioli sauce, pickles, lettuce and corn.',
    image: photo('francisco-sandwich.jpg', '101/Screenshot_20250906_141633_Photoroom.jpg', 509),
  },
  {
    name: 'Kafta Sandwich',
    category: 'Sandwiches',
    description:
      'Beef Kafta skewer wrapped in Lebanese Pita bread over hummus, biwaz, pickles, tomatoes and tahini sauce',
    image: photo('kafta-sandwich.jpg', '94/Screenshot_20250906_141508_Photoroom.jpg', 554),
  },
  {
    name: 'Falafel Sandwich',
    category: 'Sandwiches',
    description:
      'Crispy Falafel balls served in soft Lebanese Pita Bread with Tahini sauce and Vegetables (Tomatoes, Parsley, Turnip pickles)',
    // Only a 300px thumbnail exists on the live site.
    image: photo('falafel-sandwich.webp', '63/conversions/falafel-thumb.webp', 300),
  },
  {
    name: 'Chicken Shawarma Sandwich', // was "Chicken shawarma Sandwich"
    category: 'Sandwiches',
    description:
      'Slices of Chicken shawarma with Garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo(
      'chicken-shawarma-sandwich.jpg',
      '75/Screenshot_20250906_143342_Photoroom.jpg',
      490,
    ),
  },
  {
    name: 'Kabab Orfali Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled special beef Kabab blend, tomatoes, over hummus and Biwaz Salad. Wrapped in Lebanese Pita Bread and drizzled with Tahini sauce',
    image: photo('kabab-orfali-sandwich.jpg', '95/Screenshot_20250906_141508_Photoroom.jpg', 534),
  },
  {
    name: 'Kabab Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled beef Kabab, over hummus, tahini, pickles, tomatoes and Biwaz Salad. Wrapped in Lebanese Pita bread.',
    image: photo('kabab-sandwich.jpg', '77/Screenshot_20250906_141508_Photoroom.jpg', 522),
  },
  {
    name: 'Charbroiled Rib-eye Sandwich', // fixed: "Ribe-eye"
    category: 'Sandwiches',
    description:
      'Charbroiled rib-eye beef chunks with hummus and Biwaz salad (Parsley, Onion and Sumac) wrapped in Lebanese Pita Bread',
    image: photo(
      'charbroiled-rib-eye-sandwich.jpg',
      '78/Screenshot_20250906_141523_Photoroom.jpg',
      493,
    ),
  },
  {
    name: 'Chicken Tawouk Sandwich',
    category: 'Sandwiches',
    description:
      'Charbroiled chicken breast pieces seasoned with our special spices, over garlic sauce, pickles and wrapped in Lebanese Pita bread.',
    image: photo('chicken-tawouk-sandwich.jpg', '81/Screenshot_20250906_141533_Photoroom.jpg', 557),
  },
  {
    name: 'Charbroiled Chicken Sandwich', // was "Charbroiled Chicken sandwich"
    category: 'Sandwiches',
    description:
      'Charbroiled chicken with Garlic sauce, spicy garlic sauce and pickles wrapped in Lebanese Pita bread.',
    image: photo(
      'charbroiled-chicken-sandwich.jpg',
      '82/Screenshot_20250906_141516_Photoroom.jpg',
      559,
    ),
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
  uberEatsStoreUrl: 'https://www.ubereats.com/store/al-beik-state-line-rd/lkFhH1rNVt-gZXLRIOxHzA?diningMode=DELIVERY',
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
