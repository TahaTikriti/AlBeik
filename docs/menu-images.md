# Menu image refresh

The 18 menu photos were replaced with client-selected AI-generated recreations on 2026-10-15. They follow the supplied menu screenshots and descriptions; portions and plating are illustrative, not documentary photographs.

Each image is a 1254 × 1254 WebP, exported at quality 88 from the generated PNG master. The `-brand.webp` filenames avoid reusing previously cached image URLs. All menu cards, featured specials and dish pages use the shared mapping in `src/seed/content.ts`. Original assets remain available for rollback.

The logo and original hero, spread and real dining-room photos are unchanged.

## CMS behavior

Demo mode uses these files immediately after deployment. Fresh CMS seeds upload these files. Existing CMS records and media are deliberately not overwritten by the idempotent seed: replace their image relationships through the CMS to adopt these images in an already populated database. Do not reset a live database for this update.

## Mapping

| Dish | Asset in public/seed |
| --- | --- |
| ALBEIK smashed burger | `albeik-smashed-burger-brand.webp` |
| ALBEIK chicken sandwich | `albeik-chicken-sandwich-brand.webp` |
| Arayes Sujuk | `arayes-sujuk-brand.webp` |
| Arayes Kafta | `arayes-kafta-brand.webp` |
| Hummus | `hummus-brand.webp` |
| Hummus with Beef Shawarma | `hummus-with-beef-shawarma-brand.webp` |
| Hummus with Chicken Shawarma | `hummus-with-chicken-shawarma-brand.webp` |
| Baba Ghannouj | `baba-ghannouj-brand.webp` |
| Beef Shawarma Sandwich | `beef-shawarma-sandwich-brand.webp` |
| Francisco Sandwich | `francisco-sandwich-brand.webp` |
| Kafta Sandwich | `kafta-sandwich-brand.webp` |
| Falafel Sandwich | `falafel-sandwich-brand.webp` |
| Chicken Shawarma Sandwich | `chicken-shawarma-sandwich-brand.webp` |
| Kabab Orfali Sandwich | `kabab-orfali-sandwich-brand.webp` |
| Kabab Sandwich | `kabab-sandwich-brand.webp` |
| Charbroiled Rib-eye Sandwich | `charbroiled-rib-eye-sandwich-brand.webp` |
| Chicken Tawouk Sandwich | `chicken-tawouk-sandwich-brand.webp` |
| Charbroiled Chicken Sandwich | `charbroiled-chicken-sandwich-brand.webp` |
