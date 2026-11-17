/**
 * Seed content. The menu is the client's final menu boards with prices
 * (docs/content/albeik-menu-boards-2026-11-17.md); the rest is transcribed from docs/content/
 * (scraped from albeik.us on 2026-10-12) and the client's content blueprint.
 * Corrections are commented next to the original wording. Nothing here is
 * invented: unknown facts are left out on purpose. See TODO at the bottom.
 */
import type { MenuTag } from '@/lib/data/types'
import type { HoursRow } from '@/lib/hours'
import { slugify } from '@/lib/text'

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

export type SeedCategory = {
  name: string
  /** Only when the slug must outlive a rename; otherwise it's the name, slugified. */
  slug?: string
  description: string
  sortOrder: number
}

export function categorySlug(category: SeedCategory): string {
  return category.slug ?? slugify(category.name)
}

/**
 * The client's final in-store menu boards (4 images, 2026-11-17), in their
 * order. Names and introductions from the content blueprint (2026-10-29)
 * where a section matches one of its categories. Empty categories are hidden
 * on the site.
 */
export const categories: SeedCategory[] = [
  {
    // "Appetizers" on the board.
    name: 'Start with the Good Stuff',
    description: 'Little plates and Lebanese favorites made for the middle of the table.',
    sortOrder: 0,
  },
  {
    // "Salads".
    name: 'Fresh from the Garden',
    description:
      'Bright salads with herbs, vegetables, and Lebanese character. Full or half portion.',
    sortOrder: 1,
  },
  {
    // "Sides".
    name: 'Sides Worth Sharing',
    description: 'A little extra for the table, or the part of the meal you keep to yourself.',
    sortOrder: 2,
  },
  {
    // "Al-Beik Specials", with the board's combo line.
    name: 'AlBeik Specials',
    description:
      'The house originals. Make it a combo: small fries and a 20 oz fountain drink with free refills. Large fries +$1.',
    sortOrder: 3,
  },
  {
    // "Sandwiches", with the board's combo line.
    name: 'Pita, Pressed, and Stacked',
    description:
      'Handheld favorites with a proper filling and a good reason to take another bite. Make it a combo: small fries and a 20 oz fountain drink with free refills. Large fries +$1.',
    sortOrder: 4,
  },
  {
    // "Lebanese Feast" on the board: shawarma boxes and the family grill
    // feasts. Named for what's in it, so it isn't mistaken for catering's
    // Lebanese Feast (20 and 50 sandwiches); the slug predates the grill feasts.
    name: 'Boxes and Feasts to Share',
    slug: 'shawarma-boxes-and-feasts',
    description:
      'Shawarma boxes for two or four, and grill feasts for the whole table. Feeding a bigger group? That’s the catering menu.',
    sortOrder: 5,
  },
  {
    // "Platters", with the board's line on what comes with them.
    name: 'From the Charcoal',
    description:
      'Smoky, satisfying plates grilled over charcoal. Every platter comes with salad, fries or rice, garlic sauce, and spicy garlic sauce. Tahini sauce on request, at no extra charge.',
    sortOrder: 6,
  },
  {
    name: 'Add-ons',
    description: 'Extra pita, extra protein, extra sauce.',
    sortOrder: 7,
  },
  {
    // Fountain drinks in 20 oz cups. Named by the client (2026-11-15); the
    // slug stays "drinks" so links and the CMS category it seeds don't change.
    name: 'Something to Drown It All With',
    slug: 'drinks',
    description: 'Cool sips, familiar favorites, and something to balance the spice. 20 oz cups.',
    sortOrder: 8,
  },
  {
    // "Desserts".
    name: 'Something Sweet',
    description: 'A sweet finish for one, or something to split after the last savory bite.',
    sortOrder: 9,
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
  /** Other sizes: a half portion, a bigger box. */
  sizes?: { label: string; price: number }[]
  /** On offer: shown instead of `price`, which is crossed out. */
  dealPrice?: number
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
 * The client's final menu boards (2026-11-17): dishes, descriptions, prices
 * and marks as printed there. Vegan/Vegetarian and "New" are the boards'
 * labels; their star is `signature`, their chili icon `spicy`. Names in title
 * case with the "AlBeik" spelling; dish names spelled one way throughout
 * (Baba Ghannouj, Tabbouleh, Tawouk, Kabab, Rib-eye). Other fixes are
 * commented.
 *
 * Off the boards, so no longer listed: AlBeik Shawarma Loaded Potato, Build
 * Your Own Bowl, Pistachio Cake, and Kabab / Kabab Orfali as two sandwiches
 * (now one).
 */
export const menuItems: SeedItem[] = [
  // ── Start with the Good Stuff (Appetizers)
  {
    name: 'Mezze Mix Platter',
    category: 'Start with the Good Stuff',
    description:
      'A Lebanese mezze platter featuring hummus, falafel with veggies and pickles (3 pcs), baba ghannouj and cheese rolls (3 pcs). Served with pita bread.',
    price: 18.35,
    tags: ['vegetarian'],
  },
  {
    name: 'Falafel (6 Pieces)',
    category: 'Start with the Good Stuff',
    description:
      'Crispy chickpea patties seasoned with herbs and spices. Served with fresh vegetables, pickles, tahini sauce, and pita bread.',
    price: 11.21,
    tags: ['vegan'],
  },
  {
    name: 'Hummus and Falafel',
    category: 'Start with the Good Stuff',
    description:
      'Creamy hummus served with 4 crispy golden falafel pieces and fresh Lebanese pita bread.',
    price: 11.35,
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
    name: 'Cheese Rolls (4 Pieces)',
    category: 'Start with the Good Stuff',
    description: 'Crispy rolls filled with melted cheese and parsley.',
    price: 7.35,
    tags: ['vegetarian'],
  },
  {
    name: 'Arayes Kafta',
    category: 'Start with the Good Stuff',
    description:
      'Crispy grilled pita stuffed with seasoned ground beef, onions, and parsley, served with tahini sauce, fresh tomato, and pickles.',
    price: 11.21,
    image: photo('arayes-kafta-brand.webp', 1254),
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
    name: 'Arayes Sujuk',
    category: 'Start with the Good Stuff',
    description:
      'Crispy grilled pita stuffed with spiced sujuk, topped with fresh lettuce, tomatoes, pickles, sweet corn, and creamy mayonnaise.',
    price: 11.35,
    // No photo until the reshoot: the review said arayes-sujuk-brand.webp reads as pizza.
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
    name: 'Batata Harra',
    category: 'Start with the Good Stuff',
    description: 'Lebanese-style potatoes tossed with garlic, cilantro, and a spicy sauce.',
    price: 9.99,
    tags: ['new', 'vegan'],
  },

  // ── Fresh from the Garden (Salads: full, then half portion)
  {
    name: 'Fattoush',
    category: 'Fresh from the Garden',
    description:
      'A fresh mix of lettuce, parsley, tomatoes, green onions, radishes, cucumbers, cabbage, and mint, tossed in a tangy pomegranate molasses dressing.',
    price: 10.19,
    sizes: [{ label: 'Half portion', price: 5.1 }],
    tags: ['vegan'],
  },
  {
    name: 'Tabbouleh', // "Taboule" on the board; the catering menu spells it Tabbouleh
    category: 'Fresh from the Garden',
    description:
      'Finely chopped parsley, tomatoes, spring onions, fresh mint, and bulgur wheat, tossed in a tangy lemon dressing.',
    price: 10.19,
    sizes: [{ label: 'Half portion', price: 5.1 }],
    tags: ['vegan'],
  },

  // ── Sides Worth Sharing (Sides)
  { name: 'Saffron Rice', category: 'Sides Worth Sharing', price: 3.56 }, // "SAFROUN RICE"
  { name: 'Small Fries', category: 'Sides Worth Sharing', price: 3.05 },
  { name: 'Large Fries', category: 'Sides Worth Sharing', price: 4.58 },
  { name: 'Veggies', category: 'Sides Worth Sharing', price: 3.05 },
  { name: 'Side Salad', category: 'Sides Worth Sharing', price: 5.1 }, // "SALAD"

  // ── AlBeik Specials
  {
    name: 'AlBeik Charbroiled Shrimp (12 Pieces)', // a platter of 12 pieces
    category: 'AlBeik Specials',
    description:
      'Juicy, flame-grilled shrimp seasoned with a flavorful blend of herbs and spices, served with fragrant saffron rice, creamy garlic sauce, and tahini sauce.',
    price: 27.49,
  },
  {
    name: 'Grilled Halloumi Platter',
    category: 'AlBeik Specials',
    // The board ends "…and pita bread, served with pita bread."
    description:
      '5 pieces of grilled halloumi cheese, served with your choice of mixed fresh vegetables or honey, and pita bread.',
    price: 12.35,
    tags: ['new', 'vegetarian'],
  },
  {
    name: 'AlBeik Chicken Sandwich (Fajitanon)',
    category: 'AlBeik Specials',
    description:
      'Seasoned grilled chicken with red peppers, corn, onions, mushrooms, melted cheese, and signature avocado sauce, served in a sesame-crusted French baguette.',
    price: 12.75,
    comboPrice: 17.79,
    image: photo('albeik-chicken-sandwich-brand.webp', 1254),
  },
  {
    name: 'Charbroiled Wings (6 Pieces)',
    category: 'AlBeik Specials',
    // The board prints the Fries Sandwich description here, and labels the two
    // sizes "Sandwich" and "Combo". Read as 6 pieces / 12 pieces, with the
    // wings' description from the earlier menu, until the client confirms.
    description:
      'Juicy, flame-grilled chicken wings served with garlic sauce and Lebanese pita bread.',
    price: 11.43,
    sizes: [{ label: '12 pieces', price: 21.41 }],
    tags: ['new'],
  },
  {
    name: 'AlBeik Smashed Burger',
    category: 'AlBeik Specials',
    description:
      'Juicy smashed beef patty with melted cheese, caramelized onions, mushrooms, and coleslaw in a soft bun.',
    price: 11.65,
    comboPrice: 16.69,
    image: photo('albeik-smashed-burger-brand.webp', 1254),
    tags: ['signature'],
  },

  // ── Pita, Pressed, and Stacked (Sandwiches: sandwich price, then combo)
  {
    name: 'Charbroiled Chicken Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender, charbroiled chicken with garlic sauce and pickles, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('charbroiled-chicken-sandwich-brand.webp', 1254),
    tags: ['signature'],
  },
  {
    name: 'Charbroiled Rib-eye Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender, charbroiled rib-eye beef chunks with hummus and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 13.25,
    comboPrice: 18.88,
    image: photo('charbroiled-rib-eye-sandwich-brand.webp', 1254),
  },
  {
    name: 'Francisco Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Grilled chicken breast with melted cheese, lettuce, corn, pickles, and our signature mayo sauce.',
    price: 12.65,
    comboPrice: 18.24,
    image: photo('francisco-sandwich-brand.webp', 1254),
  },
  {
    name: 'Falafel Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Crispy falafel with tahini sauce, fresh tomatoes, parsley, and pickles, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('falafel-sandwich-brand.webp', 1254),
    tags: ['vegan'],
  },
  {
    name: 'Maali Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Fried eggplant, cauliflower, and fries with mixed vegetables and tahini sauce, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
  },
  {
    name: 'Chicken Tawouk Sandwich',
    category: 'Pita, Pressed, and Stacked',
    // fixed: "French fires"
    description:
      'Charbroiled chicken breast seasoned with signature spices, with garlic sauce, pickles, and French fries, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('chicken-tawouk-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kabab or Kabab Orfali Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled beef kabab or kabab orfali with hummus and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('kabab-sandwich-brand.webp', 1254),
    tags: ['spicy'],
  },
  {
    name: 'Gyro',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender gyro meat with lettuce, onions, tomatoes, and melted cheese in pita bread, served with tzatziki sauce.',
    price: 11.65,
    comboPrice: 17.24,
  },
  {
    name: 'Beef Shawarma Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender slices of beef shawarma with tahini sauce and biwaz salad (parsley, onions, and sumac), wrapped in pita bread.',
    price: 12.65,
    comboPrice: 18.24,
    image: photo('beef-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Chicken Shawarma Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Tender slices of chicken shawarma with garlic sauce and pickles, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('chicken-shawarma-sandwich-brand.webp', 1254),
  },
  {
    name: 'Kafta Sandwich',
    category: 'Pita, Pressed, and Stacked',
    description:
      'Charbroiled beef kafta made with our signature spice blend, served with hummus and biwaz salad, wrapped in pita bread.',
    price: 11.65,
    comboPrice: 17.24,
    image: photo('kafta-sandwich-brand.webp', 1254),
  },
  {
    name: 'Fries Sandwich', // no combo
    category: 'Pita, Pressed, and Stacked',
    description:
      'Crispy golden fries wrapped in warm pita bread with creamy coleslaw, crunchy pickles, garlic sauce, and ketchup.',
    price: 10.39,
    tags: ['vegetarian'],
  },

  // ── Boxes and Feasts to Share ("Lebanese Feast" on the board)
  {
    name: 'Chicken Shawarma Box (for 2)',
    category: 'Boxes and Feasts to Share',
    description: 'Three chicken shawarma sandwiches with garlic sauce and pickles.',
    price: 33.89,
  },
  {
    name: 'Chicken Shawarma Feast (for 4)',
    category: 'Boxes and Feasts to Share',
    description:
      'Five chicken shawarma sandwiches served with garlic sauce and spicy garlic sauce.',
    price: 55.89,
  },
  {
    name: 'Beef Shawarma Box (for 2)',
    category: 'Boxes and Feasts to Share',
    description:
      'Three beef shawarma sandwiches with tahini sauce and biwaz salad (parsley, onions, and sumac).',
    price: 35.79,
  },
  {
    // The board calls this one "Beef Shawarma Box" too; it's the five-sandwich feast for 4.
    name: 'Beef Shawarma Feast (for 4)',
    category: 'Boxes and Feasts to Share',
    description:
      'Five beef shawarma sandwiches with tahini sauce and biwaz salad (parsley, onions, and sumac).',
    price: 58.89,
  },
  {
    name: 'Family Grill Feast (4–5 People)',
    category: 'Boxes and Feasts to Share',
    description:
      'A selection of 12 skewers (2 kabab, 2 kafta, 2 orfali, 4 chicken tawouk, and 2 rib-eye) and 4 lamb chops, served with grilled vegetables, biwaz salad, and your choice of 2 large salads.',
    price: 127.99,
  },
  {
    name: 'Half Family Grill Feast (2–3 People)',
    category: 'Boxes and Feasts to Share',
    description:
      'A selection of 8 skewers (2 kabab, 2 kafta, 2 orfali, and 2 chicken tawouk), served with grilled vegetables, biwaz salad, and your choice of 2 large salads.',
    price: 79.99,
  },

  // ── From the Charcoal (Platters)
  {
    name: 'Grill Platter',
    category: 'From the Charcoal',
    description:
      'Your choice of 3 skewers (kabab, kafta, orfali, or chicken tawouk), served with grilled vegetables, biwaz salad, and pita bread.',
    price: 25.35,
  },
  {
    name: 'Vegan Platter',
    category: 'From the Charcoal',
    description:
      'A Lebanese vegan mezze platter featuring hummus, falafel (4 pcs), baba ghannouj, and batata harra, served with pita bread.',
    price: 22.59,
    tags: ['vegan'],
  },
  {
    name: 'Rib-eye Grill Platter', // "GRILL RIB-EYE" on the board
    category: 'From the Charcoal',
    description:
      '3 skewers of tender charbroiled rib-eye, served with grilled vegetables, biwaz salad, and pita bread.',
    price: 28.55,
  },
  {
    name: 'Charbroiled Half Chicken',
    category: 'From the Charcoal',
    description:
      'Half a charbroiled chicken, served with pita bread, pickles, garlic sauce, and spicy garlic sauce.',
    price: 19.37,
  },
  {
    name: 'Combo Kabab Platter',
    category: 'From the Charcoal',
    description:
      'Your choice of 2 skewers (kabab, kafta, orfali, or chicken tawouk), served with grilled vegetables, biwaz salad, and pita bread.',
    price: 20.71,
  },
  {
    name: 'Charbroiled Whole Chicken',
    category: 'From the Charcoal',
    description:
      'Whole charbroiled chicken, served with pita bread, pickles, garlic sauce, and spicy garlic sauce.',
    price: 28.99,
  },
  {
    name: 'Lamb Chops Platter (6 Pieces)',
    category: 'From the Charcoal',
    description:
      '6 tender lamb chops grilled over charcoal, served with grilled vegetables, biwaz salad, and pita bread.',
    price: 36.39,
    tags: ['signature'],
  },

  // ── Add-ons
  { name: 'Extra Pita Bread', category: 'Add-ons', price: 0.98 },
  { name: 'Extra Protein', category: 'Add-ons', price: 6.11 },
  { name: 'Extra Rib-eye or Shrimp', category: 'Add-ons', price: 7.13 },
  { name: 'Extra Sauce', category: 'Add-ons', price: 0.77 },

  // ── Something to Drown It All With (Drinks, 20 oz cups). The board has no descriptions; these are the old site's.
  {
    name: 'Lemonade',
    category: 'Something to Drown It All With',
    description: 'Freshly squeezed homemade lemonade, the Lebanese way',
    price: 5.35,
  },
  {
    name: 'Ayran', // "AYRAN (YOGURT)"
    category: 'Something to Drown It All With',
    description: 'Yogurt drink with a pinch of salt',
    price: 5.35,
  },
  {
    name: 'Fountain Drink', // "FOUNTAIN MACHINE DRINK"
    category: 'Something to Drown It All With',
    description: 'A 20 oz cup, your pick.',
    price: 3.29,
  },

  // ── Something Sweet (Desserts)
  { name: 'Rice Pudding', category: 'Something Sweet', price: 5.19 },
  { name: 'Baklava', category: 'Something Sweet', price: 5.69 },
  { name: 'Tiramisu', category: 'Something Sweet', price: 6.23 },
  { name: 'Pistachio Cheesecake', category: 'Something Sweet', price: 7.23 },
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
    // The blueprint's hero headline, back on top in the client's amendments
    // (2026-11-15). The slogan stays on the Story page, the footer and og.png.
    headline: 'Discover the *Lebanese* in you.',
    subline: 'Big flavor. Generous comfort. Right on State Line Road.',
  },
  // The blueprint's introduction (section 2), in the hero's voice.
  promise: {
    // The client's "Lush Lebanese spread meant to fall in love with"
    // (2026-11-15), in two lines like the headline it replaces.
    headline: 'A lush *Lebanese* spread. Made to fall in love with.',
    body: 'Come for the charcoal-grilled favorites. Stay for the spreads, the salads, the sandwiches and the dishes everyone reaches across the table to try. Quick lunch, easy dinner, or one more plate for the middle: AlBeik brings Lebanese flavor to Kansas City, with a little extra attitude.',
  },
  // The blueprint's signature set (section 3), named as on the menu boards
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
}

// The site-wide offer / occasion banner (Site settings → Offer banner).
// Sample copy so the client can see it: Thanksgiving catering, which hides
// itself after Thanksgiving Day (midnight in Kansas City). Swap it for the
// client's own offer or switch it off in the admin.
export const banner = {
  enabled: true,
  text: '*Thanksgiving* for the whole table: order your catering trays ahead.',
  linkLabel: 'See catering',
  linkUrl: '/catering',
  startsAt: null,
  endsAt: '2026-11-27T06:00:00.000Z',
  countdownTo: null,
}

// The blueprint's Story page (section 6). The founders' own story replaces
// this once the client shares it; nothing here is invented.
export const about = {
  headline: 'Lebanese flavor. *Kansas City* welcome.',
  markdown: `AlBeik brings the flavors we love to a table that feels closer to home. Think charcoal-grilled favorites, comforting sandwiches, bright salads and Lebanese dishes made for sharing. Know exactly what you came for, or ready to try something new?

There's always a place for you here.

## Come hungry. Leave a little Lebanese.

Some meals are quick. Some turn into a table full of dishes and “just one more bite.” Out here, there's room for both. Find your usual order, bring someone along, and let the menu do the rest.`,
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
  'Menu: Charbroiled Wings, whose board prints the Fries Sandwich description and labels its sizes "Sandwich"/"Combo" (read as 6 and 12 pieces)',
  'Item-level DoorDash / Uber Eats links, if the client wants to collect them (optional)',
  'Confirm phone and opening hours (from the old albeik.us footer); holiday hours once decided',
  'Catering phone and email, separate from the ordering line (cateringContact in src/seed/catering.ts)',
  'Logo files (Site settings)',
  'Testimonial sources (Google, Yelp…)',
  'Menu: is the icon next to Kabab or Kabab Orfali "spicy"? (tagged spicy for now)',
]
