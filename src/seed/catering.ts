/**
 * AlBeik's catering menu, transcribed from the client's print-ready catering
 * menu (2026-10-29, not in the repo): names in title case, prices and
 * descriptions as printed. Its internal notes are not published.
 */

export type SeedCateringItem = {
  name: string
  tag?: 'vegan' | 'vegetarian'
  price: number
  unit?: 'per person' | 'each' | 'per portion'
  description?: string
}

export type SeedCateringSection = { title: string; note?: string; items: SeedCateringItem[] }

export const cateringIntro =
  'Fresh Lebanese catering for meetings, office lunches, celebrations, and large group orders.'

/** The order information printed at the end, for customers. */
export const cateringTerms = [
  'Advance ordering recommended: 24–48 hours for standard orders; longer for 50+ meals.',
  'Pickup and delivery availability confirmed when ordering.',
  'Taxes, delivery, setup, and service fees are additional where applicable.',
  'Catering prices apply to qualifying minimum quantities. Offers cannot be combined with other promotions.',
]

export const cateringSections: SeedCateringSection[] = [
  {
    title: 'Appetizers & Mezze Trays',
    note: 'Served family-style with pita bread and appropriate sauces. Tray portions serve approximately 8–10 as a side unless otherwise noted.',
    items: [
      {
        name: 'Mezze Mix Tray',
        tag: 'vegetarian',
        price: 79.99,
        description:
          'Hummus, baba ghannouj, batata harra, 12 falafel with vegetables and pickles, and 12 cheese rolls. Served with pita bread. Serves approximately 8–10.',
      },
      {
        name: 'Falafel Tray (30 pieces)',
        tag: 'vegan',
        price: 50.99,
        description:
          'Crispy chickpea falafel served with vegetables, pickles, tahini sauce, and pita bread.',
      },
      {
        name: 'Baba Ghannouj Tray',
        tag: 'vegan',
        price: 39.99,
        description:
          'Smoky roasted eggplant blended with tahini, garlic, and lemon juice. Served with pita bread.',
      },
      {
        name: 'Cheese Rolls Tray (24 pieces)',
        tag: 'vegetarian',
        price: 37.49,
        description: 'Crispy rolls filled with melted cheese and parsley.',
      },
      {
        name: 'Batata Harra Tray',
        tag: 'vegan',
        price: 39.99,
        description: 'Lebanese-style potatoes tossed with garlic, cilantro, and a spicy sauce.',
      },
      {
        name: 'Hummus Tray',
        tag: 'vegan',
        price: 39.99,
        description:
          'Chickpeas blended with tahini, lemon juice, and garlic. Served with pita bread.',
      },
      {
        name: 'Hummus with Chicken Shawarma Tray',
        price: 59.99,
        description:
          'Creamy hummus topped with marinated chicken shawarma. Served with pita bread.',
      },
      {
        name: 'Hummus with Beef Shawarma Tray',
        price: 64.99,
        description: 'Creamy hummus topped with beef shawarma. Served with pita bread.',
      },
      {
        name: 'Charbroiled Wings Tray (30 pieces)',
        price: 46.79,
        description: 'Flame-grilled chicken wings served with garlic sauce and pita bread.',
      },
    ],
  },
  {
    title: 'Salad Trays',
    note: 'Approximately 8–10 side portions per tray.',
    items: [
      {
        name: 'Fattoush Tray',
        tag: 'vegan',
        price: 39.99,
        description:
          'Fresh lettuce, parsley, tomatoes, green onions, radishes, cucumbers, cabbage, and mint with pomegranate molasses dressing. Dressing packed separately.',
      },
      {
        name: 'Tabbouleh Tray',
        tag: 'vegan',
        price: 39.99,
        description:
          'Finely chopped parsley, tomatoes, spring onions, mint, and bulgur wheat with lemon dressing.',
      },
    ],
  },
  {
    title: 'Sides',
    items: [
      {
        name: 'Saffron Rice Tray',
        price: 29.99,
        description: 'Saffron rice for approximately 8–10 side portions.',
      },
      {
        name: 'Fries Tray',
        price: 29.99,
        description:
          'Crispy golden fries for approximately 8–10 side portions. Best served immediately after pickup or delivery.',
      },
    ],
  },
  {
    title: 'AlBeik Specials: Corporate Boxes',
    note: 'Minimum 10 sandwiches per selection. Individually wrapped. Mixed selections available by custom quote.',
    items: [
      {
        name: 'AlBeik Smashed Burger Box (10)',
        price: 104.99,
        description:
          'Smashed beef patties with cheese, caramelized onions, mushrooms, and coleslaw in soft buns.',
      },
      {
        name: 'Fajitanon Chicken Sandwich Box (10)',
        price: 104.99,
        description:
          'Grilled chicken with peppers, corn, onions, mushrooms, cheese, and signature avocado sauce in hoagie rolls.',
      },
      {
        name: 'Arayes Kafta Box (10)',
        price: 94.99,
        description:
          'Grilled pita stuffed with seasoned ground beef, onions, and parsley. Tahini and pickles included.',
      },
      {
        name: 'Arayes Sujuk Box (10)',
        price: 94.99,
        description:
          'Grilled pita with sujuk-style spiced filling. Served with appropriate sauces and pickles.',
      },
      {
        name: 'Fries Sandwich Box (10)',
        tag: 'vegetarian',
        price: 94.99,
        description:
          'Pita sandwiches filled with fries, coleslaw, pickles, garlic sauce, and ketchup.',
      },
      {
        name: 'Shawarma Loaded Potatoes (10)',
        price: 113.99,
        description:
          'Ten baked potatoes topped with your choice of chicken or beef shawarma and signature sauce.',
      },
    ],
  },
  {
    title: 'Sandwich Catering Boxes',
    note: 'Minimum 10 sandwiches per selection. Each sandwich is individually wrapped; sauces and pickles provided as appropriate. Larger 20- and 50-piece prices are listed under Lebanese Feast.',
    items: [
      {
        name: 'Charbroiled Chicken Box (10)',
        price: 104.99,
        description: 'Charbroiled chicken with garlic sauce and pickles in pita bread.',
      },
      {
        name: 'Chicken Tawouk Box (10)',
        price: 104.99,
        description: 'Spiced chicken breast with garlic sauce, pickles, and fries in pita bread.',
      },
      {
        name: 'Charbroiled Rib-eye Box (10)',
        price: 123.99,
        description: 'Charbroiled ribeye with hummus and biwaz salad in pita bread.',
      },
      {
        name: 'Kabab Box (10)',
        price: 104.99,
        description: 'Charbroiled beef kabab with hummus and biwaz salad in pita bread.',
      },
      {
        name: 'Kabab Orfali Box (10)',
        price: 104.99,
        description: 'Spiced beef kabab with hummus and biwaz salad in pita bread.',
      },
      {
        name: 'Chicken Shawarma Box (10)',
        price: 104.99,
        description: 'Chicken shawarma with garlic sauce and pickles in pita bread.',
      },
      {
        name: 'Beef Shawarma Box (10)',
        price: 107.99,
        description: 'Beef shawarma with tahini and biwaz salad in pita bread.',
      },
      {
        name: 'Falafel Box (10)',
        tag: 'vegan',
        price: 94.99,
        description: 'Falafel with tahini, tomatoes, parsley, and pickles in pita bread.',
      },
      {
        name: 'Francisco Box (10)',
        price: 104.99,
        description:
          'Chicken breast with cheese, lettuce, corn, pickles, and signature mayo sauce.',
      },
      {
        name: 'Gyro Box (10)',
        price: 104.99,
        description:
          'Gyro meat with lettuce, onions, tomatoes, cheese, and tzatziki in pita bread.',
      },
    ],
  },
  {
    title: 'Individual Corporate Lunch Boxes',
    note: 'Minimum 10 boxes. Each box includes one sandwich, small fries, and a 20 oz fountain drink for pickup orders. Bottled beverage substitutions available by quote.',
    items: [
      {
        name: 'Chicken Lunch Box',
        price: 14.29,
        unit: 'per person',
        description:
          'Choice of chicken shawarma, chicken tawouk, or charbroiled chicken sandwich, with small fries and a drink.',
      },
      {
        name: 'Beef Lunch Box',
        price: 14.59,
        unit: 'per person',
        description: 'Choice of beef shawarma or kabab sandwich, with small fries and a drink.',
      },
      {
        name: 'Rib-eye Lunch Box',
        price: 16.19,
        unit: 'per person',
        description: 'Charbroiled ribeye sandwich with small fries and a drink.',
      },
      {
        name: 'Falafel Lunch Box',
        tag: 'vegan',
        price: 12.39,
        unit: 'per person',
        description: 'Falafel sandwich with small fries and a drink.',
      },
    ],
  },
  {
    title: 'Build Your Own Bowl: Corporate Lunches',
    note: 'Minimum 10 bowls; individually packed.',
    items: [
      {
        name: 'Build Your Own Bowl',
        price: 16.19,
        unit: 'per person',
        description:
          'Rice, fresh vegetables, and your choice of chicken shawarma, beef shawarma, shish tawouk, kabab, or falafel. Choice of garlic sauce, hummus, tahini, or baba ghannouj. Protein quantities standardized for catering.',
      },
    ],
  },
  {
    title: 'Lebanese Feast: Large Group Sandwich Packages',
    note: 'Sandwiches are individually wrapped and grouped by protein. These packages include sauces and appropriate accompaniments.',
    items: [
      {
        name: 'Chicken Shawarma Feast (20 sandwiches)',
        price: 197.99,
        description:
          'Twenty chicken shawarma sandwiches with garlic sauce and pickles. Suggested for 15–20 guests depending on appetite.',
      },
      {
        name: 'Chicken Shawarma Feast (50 sandwiches)',
        price: 467.99,
        description: 'Fifty chicken shawarma sandwiches with garlic sauce and pickles.',
      },
      {
        name: 'Beef Shawarma Feast (20 sandwiches)',
        price: 204.99,
        description: 'Twenty beef shawarma sandwiches with tahini sauce and biwaz salad.',
      },
      {
        name: 'Beef Shawarma Feast (50 sandwiches)',
        price: 482.99,
        description: 'Fifty beef shawarma sandwiches with tahini sauce and biwaz salad.',
      },
    ],
  },
  {
    title: 'Corporate Buffet Platters',
    note: 'Buffet packages include serving trays and utensils. Minimum 15 guests.',
    items: [
      {
        name: 'Classic Chicken Buffet',
        price: 15.99,
        unit: 'per person',
        description:
          'Chicken shawarma, saffron rice, fattoush, hummus, pita bread, pickles, and garlic sauce.',
      },
      {
        name: 'Lebanese Mixed Buffet',
        price: 19.99,
        unit: 'per person',
        description:
          'Choice of two proteins from chicken shawarma, chicken tawouk, beef shawarma, or kabab; saffron rice, fattoush or tabbouleh, hummus, baba ghannouj, pita bread, pickles, and sauces.',
      },
      {
        name: 'Executive Grill Buffet',
        price: 25.99,
        unit: 'per person',
        description:
          'Choice of three proteins from chicken tawouk, kabab, kafta, beef shawarma, or ribeye; saffron rice, salad selection, hummus, baba ghannouj, batata harra, pita bread, pickles, and sauces. Ribeye quantity based on availability.',
      },
      {
        name: 'Vegan Mezze Buffet',
        tag: 'vegan',
        price: 17.99,
        unit: 'per person',
        description:
          'Falafel, dolma, hummus, baba ghannouj, batata harra, fattoush or tabbouleh, and pita bread.',
      },
    ],
  },
  {
    title: 'Add-Ons',
    items: [
      {
        name: 'Extra Pita Bread (10 pieces)',
        price: 9.0,
        description: 'Additional pita bread for sharing.',
      },
      {
        name: 'Extra Sauce (10 portions)',
        price: 6.5,
        description: 'Choice of garlic sauce, spicy garlic, tahini, or other available sauces.',
      },
      {
        name: 'Extra Protein',
        price: 5.99,
        unit: 'per portion',
        description: 'Additional protein serving; available with catering bowls and buffets.',
      },
    ],
  },
  {
    title: 'Drinks',
    items: [
      {
        name: '20 oz Fountain Drink',
        price: 2.99,
        unit: 'each',
        description:
          'Available with pickup catering, subject to packaging and transport requirements.',
      },
      { name: 'Ayran (Yogurt)', price: 5.35, unit: 'each', description: 'Chilled yogurt drink.' },
      { name: 'Lemonade', price: 5.35, unit: 'each' },
    ],
  },
  {
    title: 'Desserts',
    items: [
      {
        name: 'Lebanese Rice Pudding',
        price: 4.49,
        unit: 'each',
        description: 'Individual rice pudding servings.',
      },
      {
        name: 'Pistachio Cake',
        price: 5.99,
        unit: 'each',
        description: 'Individual pistachio cake servings.',
      },
      { name: 'Baklava', price: 4.49, unit: 'each', description: 'Individual baklava servings.' },
    ],
  },
]
