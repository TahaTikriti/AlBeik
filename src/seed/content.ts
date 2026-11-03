/**
 * Seed content. The menu is the client's updated menu with prices
 * (docs/content/albeik-updated-menu-2026-11-03.md); the rest is transcribed from docs/content/
 * (scraped from albeik.us on 2026-10-12) and the client's content blueprint.
 * Corrections are commented next to the original wording. Nothing here is
 * invented: unknown facts are left out on purpose. See TODO at the bottom.
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
 * The client's updated menu (AL_BEIK_UPDATED_MENU.docx, 2026-11-03), in its
 * order. Names and introductions from the content blueprint (2026-10-29)
 * where a section matches one of its categories. Empty categories are hidden
 * on the site.
 */
export const categories: SeedCategory[] = [
  {
    // "Appetizers" in the updated menu.
    name: 'Start with the Good Stuff',
    description: 'Little plates and Lebanese favorites made for the middle of the table.',
    sortOrder: 0,
  },
  {
    // "Salads".
    name: 'Fresh from the Garden',
    description: 'Bright salads and crisp sides with herbs, vegetables, and Lebanese character.',
    sortOrder: 1,
  },
  {
    // "Sides".
    name: 'Sides Worth Sharing',
    description: 'A little extra for the table, or the part of the meal you keep to yourself.',
    sortOrder: 2,
  },
  {
    // "Al-Beik Specials", with the menu's combo line.
    name: 'AlBeik Specials',
    description:
      'The house originals. Make it a combo with small fries and a 20 oz fountain drink of your choice.',
    sortOrder: 3,
  },
  {
    // "Sandwiches", with the menu's combo line.
    name: 'Pita, Pressed, and Stacked',
    description:
      'Handheld favorites with a proper filling and a good reason to take another bite. Make it a combo with small fries and a 20 oz fountain drink of your choice.',
    sortOrder: 4,
  },
  {
    name: 'Build Your Own Bowl',
    description: 'Rice, fresh veggies, your protein and your favorite topping.',
    sortOrder: 5,
  },
  {
    // "Lebanese Feast" in the updated menu. Named for what's in it, so it
    // isn't mistaken for catering's Lebanese Feast (20 and 50 sandwiches).
    name: 'Shawarma Boxes and Feasts',
    description:
      'Shawarma sandwiches packed to share: a box for two, a feast for four. Feeding a bigger group? That’s the catering menu.',
    sortOrder: 6,
  },
  {
    // "Platters", with the menu's line on what comes with them.
    name: 'From the Charcoal',
    description:
      'Smoky, satisfying plates grilled over charcoal. Every platter comes with a salad of your choice, and rice or fries.',
    sortOrder: 7,
  },
  {
    name: 'Add-ons',
    description: 'Extra pita, extra protein, extra sauce.',
    sortOrder: 8,
  },
  {
    // Fountain drinks in 20 oz cups ("120oz" in the menu is a typo).
    name: 'Drinks',
    description: 'Cool sips, familiar favorites, and something to balance the spice.',
    sortOrder: 9,
  },
  {
    // "Desserts".
    name: 'Something Sweet',
    description: 'A sweet finish for one, or something to split after the last savory bite.',
    sortOrder: 10,
  },
]

export type SeedItem = {
  name: string
  category: string
  description?: string
  /** In-store price, USD (the sandwich alone where there's a combo). */
  price?: number
  /** With small fries and a 20 oz fountain drink. */
  comboPrice?: number
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
 * The client's updated menu (AL_BEIK_UPDATED_MENU.docx, 2026-11-03): dishes,
 * descriptions, prices and the vegan/vegetarian marks as written there.
 * Names in title case with the "AlBeik" spelling; dish names spelled one way
 * throughout (Baba Ghannouj, Tabbouleh, Tawouk, Kabab). Other fixes are
 * commented. Only `signature` is our tag: the old site calls those dishes
 * "our signature".
 *
 * Not on the updated menu, so no longer listed: Kafta Sandwich, Hummus and
 * Falafel (both were on the old site or Uber Eats).
 */
export const menuItems: SeedItem[] = [
  // ── Start with the Good Stuff (Appetizers)
  {
    name: 'Mezze Mix Platter', // was "MEZZZE MIX PLATTER"
    category: 'Start with the Good Stuff',
    description:
      'A Lebanese mezze platter featuring hummus, falafel with veggies and pickles (3 pcs), baba ghannouj, batata harra and cheese rolls (3 pcs). Served with pita bread.',
    price: 21.99,
    tags: ['vegetarian'],
  },
  {
    name: 'Falafel (6 Pieces)',
    category: 'Start with the Good Stuff',
    description:
      'Crispy chickpea patties seasoned with herbs and spices. Served with fresh vegetables, pickles, tahini sauce, and pita bread.',
    price: 11.99,
    tags: ['vegan'],
  },
  {
    name: 'Baba Ghannouj',
    category: 'Start with the Good Stuff',
    description:
      'Smoky roasted eggplant blended with tahini, garlic, and lemon juice. Served with pita bread.',
    price: 9.99,
    image: photo('baba-ghannouj-brand.webp', 1254),
    tags: ['vegan'],
  },
  {
    name: 'Cheese Rolls (4 Pieces)',
    category: 'Start with the Good Stuff',
    description: 'Crispy rolls filled with melted cheese and parsley.',
    price: 7.35,
    tags: ['vegetarian'],
  },
  {
    name: 'Batata Harra',
    category: 'Start with the Good Stuff',
    description: 'Lebanese-style potatoes tossed with garlic, cilantro, and a spicy sauce.',
    price: 9.99,
    tags: ['vegan'],
  },
  {
    name: 'Hummus',
    category: 'Start with the Good Stuff',
    description: 'Chickpeas blended with tahini, lemon juice, and garlic. Served with pita bread.',
    price: 9.99,
    image: photo('hummus-brand.webp', 1254),
    tags: ['vegan'],
  },
  {
    name: 'Hummus with Chicken Shawarma',
    category: 'Start with the Good Stuff',
    description:
      'Creamy hummus topped with tender, marinated chicken shawarma, served with pita bread.',
    price: 12.35,
    image: photo('hummus-with-chicken-shawarma-brand.webp', 1254),
  },
  {
    name: 'Hummus with Beef Shawarma',
    category: 'Start with the Good Stuff',
    description: 'Hummus topped with tender, marinated beef shawarma, served with pita bread.',
    price: 13.35,
    image: photo('hummus-with-beef-shawarma-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Wings (6 Pieces)',
    category: 'Start with the Good Stuff',
    description:
      'Juicy, flame-grilled chicken wings served with garlic sauce and Lebanese pita bread.',
    price: 10.99,
  },

  // ── Fresh from the Garden (Salads)
  {
    name: 'Fattoush',
    category: 'Fresh from the Garden',
    description:
      'A fresh mix of lettuce, parsley, tomatoes, green onions, radishes, cucumbers, cabbage, and mint, tossed in a tangy pomegranate molasses dressing.',
    price: 9.99,
    tags: ['vegan'],
  },
  {
    name: 'Tabbouleh', // "Taboule" in the menu; the catering menu spells it Tabbouleh
    category: 'Fresh from the Garden',
    description:
      'Finely chopped parsley, tomatoes, spring onions, fresh mint, and bulgur wheat, tossed in a tangy lemon dressing.',
    price: 9.99,
    tags: ['vegan'],
  },

  // ── Sides Worth Sharing (Sides)
  { name: 'Saffron Rice', category: 'Sides Worth Sharing', price: 3.49 }, // was "SAFROUN RICE"
  { name: 'Small Fries', category: 'Sides Worth Sharing', price: 2.99 },
  { name: 'Large Fries', category: 'Sides Worth Sharing', price: 4.49 },

  // ── AlBeik Specials (sandwich price, then combo)
  {
    name: 'AlBeik Smashed Burger',
    category: 'AlBeik Specials',
    description:
      'Juicy smashed beef patty with melted cheese, caramelized onions, mushrooms, and coleslaw in a soft bun.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('albeik-smashed-burger-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'AlBeik Chicken Sandwich (Fajitanon)',
    category: 'AlBeik Specials',
    description:
      'Seasoned grilled chicken with red peppers, corn, onions, mushrooms, melted cheese, and signature avocado sauce in a soft hoagie roll.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('albeik-chicken-sandwich-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'Arayes Kafta',
    category: 'AlBeik Specials',
    description:
      'Crispy grilled pita stuffed with seasoned ground beef, onions, and parsley, served with tahini sauce and pickles.',
    price: 9.99,
    comboPrice: 13.99,
    image: photo('arayes-kafta-brand.webp', 1254),
  },
  {
    name: 'Arayes Sujuk',
    category: 'AlBeik Specials',
    // The updated menu repeats the Arayes Kafta description here; this is
    // the catering menu's wording until the client sends the right one.
    description: 'Crispy grilled pita stuffed with spiced sujuk, served with pickles.',
    price: 9.99,
    comboPrice: 13.99,
    // No photo until the reshoot: the review said arayes-sujuk-brand.webp reads as pizza.
  },
  {
    name: 'Fries Sandwich', // no combo
    category: 'AlBeik Specials',
    description:
      'Crispy golden fries wrapped in warm pita bread with creamy coleslaw, crunchy pickles, garlic sauce, and ketchup.',
    price: 9.99,
    tags: ['vegetarian'],
  },
  {
    name: 'AlBeik Shawarma Loaded Potato',
    category: 'AlBeik Specials',
    description:
      'Fluffy baked potato loaded with tender beef or chicken shawarma, topped with your choice of signature sauce.',
    price: 11.99,
  },

  // ── Pita, Pressed, and Stacked (Sandwiches: sandwich price, then combo)
  {
    name: 'Charbroiled Chicken Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender, charbroiled chicken with garlic sauce and pickles, wrapped in pita bread.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('charbroiled-chicken-sandwich-brand.webp', 1254),
  },
  {
    name: 'Chicken Tawouk Sandwich',
    category: 'Pita, Pressed, and Stacked',
    // fixed: "French fires"
    description:
      'Charbroiled chicken breast seasoned with signature spices, with garlic sauce, pickles, and French fries, wrapped in pita bread.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('chicken-tawouk-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Rib-eye Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender, charbroiled rib-eye beef chunks with hummus and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 12.99,
    comboPrice: 16.99,
    image: photo('charbroiled-rib-eye-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled beef kabab with hummus and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('kabab-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab Orfali Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled beef kabab made with our signature spice blend, served with hummus and biwaz salad, wrapped in pita bread.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('kabab-orfali-sandwich-brand.webp', 1254),
  },
  {
    name: 'Chicken Shawarma Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender slices of chicken shawarma with garlic sauce and pickles, wrapped in pita bread.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('chicken-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Beef Shawarma Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender slices of beef shawarma with tahini sauce and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 11.35,
    comboPrice: 15.35,
    image: photo('beef-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Falafel Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Crispy falafel with tahini sauce, fresh tomatoes, parsley, and pickles, wrapped in pita bread.',
    price: 9.99,
    comboPrice: 12.99,
    image: photo('falafel-sandwich-brand.webp', 1254),
    tags: ['vegan'],
  },
  {
    name: 'Francisco Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Grilled chicken breast with melted cheese, lettuce, corn, pickles, and our signature mayo sauce.',
    price: 10.99,
    comboPrice: 14.99,
    image: photo('francisco-sandwich-brand.webp', 1254),
  },
  {
    name: 'Gyro',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender gyro meat with lettuce, onions, tomatoes, and melted cheese in pita bread, served with tzatziki sauce.',
    price: 10.99,
    comboPrice: 14.99,
  },

  // ── Build Your Own Bowl
  {
    name: 'Build Your Own Bowl',
    category: 'Build Your Own Bowl',
    description:
      'Create your perfect bowl with rice, fresh veggies, and your choice of chicken shawarma, beef shawarma, shish tawouk, kabab, or falafel. Finish it with your favorite topping: garlic sauce, hummus, tahini, or baba ghannouj.',
    price: 16.99,
  },

  // ── Shawarma Boxes and Feasts ("Lebanese Feast" in the menu)
  {
    name: 'Chicken Shawarma Box (for 2)',
    category: 'Shawarma Boxes and Feasts',
    description: 'Three chicken shawarma sandwiches with garlic sauce and pickles.',
    price: 26.99,
  },
  {
    name: 'Chicken Shawarma Feast (for 4)',
    category: 'Shawarma Boxes and Feasts',
    description:
      'Five chicken shawarma sandwiches served with garlic sauce and spicy garlic sauce.',
    price: 44.99,
  },
  {
    name: 'Beef Shawarma Box (for 2)',
    category: 'Shawarma Boxes and Feasts',
    description:
      'Three beef shawarma sandwiches with tahini sauce and biwaz salad (parsley, onions, and sumac).',
    price: 29.99,
  },
  {
    name: 'Beef Shawarma Feast (for 4)',
    category: 'Shawarma Boxes and Feasts',
    description:
      'Five beef shawarma sandwiches with tahini sauce and biwaz salad (parsley, onions, and sumac).',
    price: 49.99,
  },

  // ── From the Charcoal (Platters)
  {
    name: 'Grill Platter',
    category: 'From the Charcoal',
    description:
      'Your choice of 3 skewers (kabab, kafta, orfali, or chicken tawouk), served with pickles, garlic sauce, biwaz salad, and pita bread.',
    price: 22.99,
  },
  {
    name: 'Rib-eye Grill Platter', // "GRILL Ribeye" in the menu
    category: 'From the Charcoal',
    description:
      'Two skewers of tender, charbroiled rib-eye, served with pickles, garlic sauce, biwaz salad, and pita bread.',
    price: 26.99,
  },
  {
    name: 'Charbroiled Half Chicken',
    category: 'From the Charcoal',
    description:
      'Half a charbroiled chicken, served with pita bread, pickles, garlic sauce, and spicy garlic sauce.',
    price: 18.99,
  },
  {
    name: 'Charbroiled Whole Chicken',
    category: 'From the Charcoal',
    description:
      'Whole charbroiled chicken, served with pita bread, pickles, garlic sauce, and spicy garlic sauce.',
    price: 28.99,
  },
  {
    name: 'Vegan Platter',
    category: 'From the Charcoal',
    description:
      'A Lebanese vegan mezze platter featuring hummus, falafel (4 pcs), dolma (3 pcs), baba ghannouj, and batata harra, with your choice of fattoush or tabbouleh. Served with pita bread.',
    price: 24.99,
    tags: ['vegan'],
  },

  // ── Add-ons
  { name: 'Extra Pita Bread', category: 'Add-ons', price: 1.0 },
  { name: 'Extra Protein', category: 'Add-ons', price: 5.99 },
  { name: 'Extra Sauce', category: 'Add-ons', price: 0.75 },

  // ── Drinks (20 oz cups). The menu has no descriptions; these are the old site's.
  {
    name: 'Fountain Drink', // "FOUNTAIN MACHINE DRINK"
    category: 'Drinks',
    description: 'A 20 oz cup, your pick.',
    price: 2.99,
  },
  {
    name: 'Ayran', // "AYRAN (YOGURT)"
    category: 'Drinks',
    description: 'Yogurt drink with a pinch of salt',
    price: 5.35,
  },
  {
    name: 'Lemonade',
    category: 'Drinks',
    description: 'Freshly squeezed homemade lemonade, the Lebanese way',
    price: 5.35,
  },

  // ── Something Sweet (Desserts)
  { name: 'Lebanese Rice Pudding', category: 'Something Sweet', price: 4.49 },
  { name: 'Pistachio Cake', category: 'Something Sweet', price: 5.99 },
  { name: 'Baklava', category: 'Something Sweet', price: 4.49 },
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
    // The client's slogan (2026-11-02), with LEBANESE highlighted as in their
    // earlier "The recipe is Lebanese" line, which now runs in the home strip.
    headline: 'Come hungry. Leave a little *Lebanese*.',
    // The blueprint's hero headline and promise (section 2), as the follow-up.
    subline:
      'Discover the Lebanese in you. Big flavor and generous comfort, right on State Line Road.',
  },
  // The blueprint's introduction (section 2), in the hero's voice.
  promise: {
    headline: 'A little *Lebanese*. A lot to love.',
    body: 'Come for the charcoal-grilled favorites. Stay for the spreads, the salads, the sandwiches and the dishes everyone reaches across the table to try. Quick lunch, easy dinner, or one more plate for the middle: AlBeik brings Lebanese flavor to Kansas City, with a little extra attitude.',
  },
  // The blueprint's signature set (section 3), named as on the updated menu
  // (its Shawarma Feast is the feast for four). Dishes with and without a
  // photo alternate as far as the photos allow, so the grid reads as a pattern.
  featured: [
    'AlBeik Smashed Burger',
    'Batata Harra',
    'AlBeik Chicken Sandwich (Fajitanon)',
    'Fattoush',
    'Charbroiled Rib-eye Sandwich',
    'Arayes Sujuk',
    'Chicken Shawarma Feast (for 4)',
    'Hummus with Beef Shawarma',
    'Charbroiled Half Chicken',
    'Ayran',
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

## Come hungry. Leave a little Lebanese.

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
  'Menu: the Arayes Sujuk description (the updated menu repeats the Arayes Kafta one)',
  'Item-level DoorDash / Uber Eats links, if the client wants to collect them (optional)',
  'Confirm phone and opening hours (from the old albeik.us footer); holiday hours once decided',
  'Catering phone and email, separate from the ordering line (cateringContact in src/seed/catering.ts)',
  'Logo files (Site settings)',
  'Testimonial sources (Google, Yelp…)',
  'Spicy tags, if the client wants them (vegan and vegetarian are from the updated menu)',
]
