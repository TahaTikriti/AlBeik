# AlBeik website

Next.js 16 + Payload CMS 3 in one app. The public site is static (rebuilt when content is published) and the admin lives at `/admin`. See [BRIEF.md](BRIEF.md) for the project brief.

## This branch: `poc/street`

Design direction 1 (the one chosen), taken from AlBeik's Instagram rebrand and held to the client's brand guidelines (`docs/brand/brand-guidelines.jpg`): exactly the guidelines' five colours (primary red #D8262F, logo highlight #F4313F, charcoal #231F20, black, white), two typefaces (Anton for condensed bold display and labels, Inter for text), AlBeik's real logo in its original colours on white (a white header, as in the guidelines), huge condensed caps with one word in red, dish names in title case, the logo's mustache as the recurring mark, the logo's fez-and-face mark on a white tile on the 404 and Visit pages, slow smoke and steam, and a dark order sheet that slides up. Corners are kept tight (one radius per role; logo panels share the card radius). Like the brand's Instagram reels, food is lit and everything else is dark: the hero pairs "The recipe is Lebanese." with charcoal-grilled tawouk, as on the guidelines board, signature dishes are same-size reel cards, and an item page shows the dish's name over the lit dish, like the dish posts. Menu cards are all the same size and the menu stays quiet, because regulars come to order.

**Motion** (`src/theme/brand.css`, all off with reduced motion): the hero headline punches in word by word, LEBANESE settles in after it and a few embers rise off the grill, and every page title punches in the same way; a fuse burns along the header as you scroll; big section titles slide in from both sides, the red section opens out, photos drift and menu photos settle into their cards, category rules draw across (CSS scroll timelines, still elsewhere); the slogan strip tilts into place and speeds up or reverses with the scroll (`MarqueeTrack`), and comes round again lower on the home page, the other way; a red pill glides between menu categories; pages lift out and in while the header and order bar hold still, the nav underline slides to its link, and a card's photo and name morph into the dish page (React `<ViewTransition>`: `app/(frontend)/template.tsx`, `MenuItemCard`, `ItemView`, `ScrollTopOnArrival`); red buttons shimmer and outlined ones fill on hover, a glow follows the pointer on dish cards (`Spotlight`), and order buttons give off a small puff of sparks (`emberBurst`).

**Hero video.** Set `heroLoop` in `src/seed/content.ts` to an MP4 in `public/seed` (silent, 6-10 s) and it plays over the hero photo, which stays as the poster: loaded only after the page, paused off-screen, never for reduced motion or data saving (`HeroLoop`). It replaces the CSS embers. The current clip is Pexels video 14554564 (free licence), cropped to the food and crossfaded end-to-start so it loops without a seam (10.5 s, 720x944, 2.3 MB).

What changed versus `main` is presentation only: `src/theme` (tokens, fonts, motifs, copy, `brand.css`), `src/components`, `src/views` and one import in `src/styles/globals.css`. Data and logic are identical.

**Logo.** The client's files are in `public/brand/`; the brand guidelines and original photos are in `docs/brand/`. **Map.** The footer shows AlBeik's Google Maps listing (Google's "Embed a map" iframe, lazy-loaded, tinted dark until you point at or use it) with the address and a Get directions button; the address and link come from the client's Google Maps listing.

**Share image.** Links to the site show `public/og.png` (logo and slogan on black; source `docs/brand/share-card.html`, which says how to re-render it); dish pages show their dish. `docs/` is never served by the site (only `public/` is); remove `docs/brand/brand-guidelines.jpg` when it's no longer needed. The manager wants the original logo (red fez, charcoal ink) on white, never reversed, so it lives on white surfaces only: the header (`data-theme="light"`), a white logo panel in the footer, and white tiles for the fez mark. The pieces in `src/theme/brand/` (mark, horizontal lockup, wordmark mask) are cut uncoloured from the stacked PNG, plus the favicons. Swap them for the client's vector files when those arrive.

Lighthouse mobile (production build, demo data): performance home 90–91, menu 92, item 96–97; accessibility, best practices and SEO 100. The home page's ceiling is the hero photo: a properly sized, compressed professional shot would buy the most.

## Run it

Needs Node 22 and pnpm 10. No database or `.env` needed to look at the site:

```bash
pnpm install
pnpm dev                # http://localhost:3000
```

**Demo mode.** With no `DATABASE_URL`, the site runs on the scraped albeik.us content in `src/seed/content.ts` (photos in `public/seed/`). This also means Vercel deploys with zero environment variables. Order buttons go to AlBeik's real DoorDash and Uber Eats store pages. The admin (`/admin`) needs a database.

**CMS mode.** To edit content in the admin, add a Postgres database (a free [Neon](https://neon.tech) or Supabase project works):

```bash
cp .env.example .env    # set DATABASE_URL and PAYLOAD_SECRET (and SEED_ADMIN_* for a login)
pnpm migrate            # create the tables
pnpm seed               # load the same content into the CMS
pnpm dev                # admin at /admin
```

To start over with a clean database: `pnpm db:reset && pnpm seed`.

| Script                                       | What it does                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`     | Next.js (with a database configured, the build reads it to prerender pages)  |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Checks; the tests cover the order-link rules                                 |
| `pnpm migrate`                               | Apply database migrations                                                    |
| `pnpm migrate:create <name>`                 | After changing a collection or global, create a migration and commit it      |
| `pnpm seed`                                  | Add the scraped content. Only creates what's missing, so it's safe to re-run |
| `pnpm db:reset`                              | Drop every table and re-run the migrations                                   |

## Where things are

```
src/
  payload/      CMS schema: collections, globals, fields, hooks      ┐ data + logic:
  lib/          data loaders, order links, analytics, SEO            │ change on main
  seed/         seed script, scraped content, images                 ┘
  app/          routes (each page.tsx loads data, then renders a view)
  theme/        tokens.css, fonts, UI copy, brand motifs             ┐ presentation:
  components/   order button and sheet, menu, header/footer          │ POC branches
  views/        one layout per page                                  ┘ restyle these
```

**Presentation boundary.** A design branch changes `src/theme`, `src/components`, `src/views` and `public/` (plus the icons `src/app/(frontend)/icon.png` and `apple-icon.png`), and nothing else. Components get ready-made view models as props (`src/lib/data/types.ts`) and ESLint stops them from importing Payload or the data loaders. If a design needs different data, change it on `main` and rebase. To check a branch:

```bash
git diff main --stat -- src/payload src/lib src/seed src/migrations
# should print nothing
```

**Re-theming.** `src/theme/tokens.css` holds every color, type size, radius, spacing and motion value. Components use the token names (`bg-surface`, `text-ink`, `font-display`, `text-display-1`, …). Add `data-theme="inverse"` to any element to flip its colors, e.g. a dark hero on a light page.

**Highlighted words.** In headline fields, editors wrap words in `*asterisks*` (`The recipe is *Lebanese*.`). The site renders those words as `<em>`, and the theme decides how they look.

## Ordering (DoorDash / Uber Eats)

Neither platform can pre-fill a cart from a link, so each order button falls back through:

1. the item's own link (Menu item → Order links), then
2. the store link (Site settings → Ordering), then
3. hidden.

With one platform available the button links straight to it; with both it opens a small sheet. Links open in the same tab so the phone's app can take over.

The seed fills in AlBeik's store links (Site settings → Ordering); clear them there and every order button hides.

Clicks are tracked as Umami custom events (`order_sheet_open`, `order_click` with item, platform, link level and placement) once `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set.

## Content still needed from the client

- Full menu: Platters, Sides, Drinks and Desserts are empty (empty categories are hidden)
- Prices, and whether to show them (Site settings → Show prices)
- Item-level DoorDash / Uber Eats links, if they're willing to collect them (optional)
- Phone and opening hours (the address and Google Maps listing are in; demo content in `src/seed/content.ts`)
- The logo as vector (SVG) files; social links, testimonial sources
- Dietary tags (spicy, vegetarian), to be confirmed before tagging
- Real photography to replace the illustrative menu images when it exists (see [docs/menu-images.md](docs/menu-images.md))

## Deploying

**Demo:** import the repo in Vercel and deploy. No settings or environment variables needed.

**With the CMS:** Vercel + the same hosted Postgres. Two things to add first:

- **Media storage.** Uploads go to the local `media/` folder, which Vercel doesn't keep. Add Payload's S3 or Vercel Blob storage adapter.
- **Build command:** `pnpm migrate && pnpm build`.

Set the same environment variables as in `.env.example`, with `NEXT_PUBLIC_SERVER_URL` set to the real domain.

**Create the admin account before sharing the URL** (run `pnpm seed` with `SEED_ADMIN_*` set, or sign up at `/admin` yourself). Until an admin exists, anyone who opens `/admin` can create the first account.
