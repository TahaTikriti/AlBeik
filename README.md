# AlBeik website

Next.js 16 + Payload CMS 3 in one app. The public site is static (rebuilt when content is published) and the admin lives at `/admin`. See [BRIEF.md](BRIEF.md) for the project brief.

## This branch: `poc/street`

Design direction 1 (the one chosen), taken from AlBeik's Instagram rebrand and held to the client's brand guidelines (`docs/brand/brand-guidelines.jpg`): exactly the guidelines' five colours (primary red #D8262F, logo highlight #F4313F, charcoal #231F20, black, white), two typefaces (Anton for condensed bold display and labels, Inter for text), AlBeik's real logo in its original colours on white (a white header, as in the guidelines), huge condensed caps with one word in red, dish names in title case, the logo's mustache as the recurring mark, the logo's fez-and-face mark on a white tile on the 404 and Visit pages, slow smoke and steam, and a dark order sheet that slides up. Corners are kept tight (one radius per role; logo panels share the card radius). Like the brand's Instagram reels, food is lit and everything else is dark: the hero pairs "The recipe is Lebanese." with charcoal-grilled tawouk, as on the guidelines board, signature dishes are same-size reel cards, and an item page shows the dish's name over the lit dish, like the dish posts. Menu cards are all the same size and the menu stays quiet, because regulars come to order.

**Motion** (`src/theme/brand.css`, all off with reduced motion): the hero headline punches in word by word, LEBANESE settles in after it and a few embers rise off the grill, and every page title punches in the same way; a fuse burns along the header as you scroll; big section titles slide in from both sides, the red section opens out, photos drift and menu photos settle into their cards, category rules draw across (CSS scroll timelines, still elsewhere); the slogan strip tilts into place and speeds up or reverses with the scroll (`MarqueeTrack`), and comes round again lower on the home page, the other way; a red pill glides between menu categories; pages lift out and in while the header and order bar hold still, the nav underline slides to its link, and a card's photo and name morph into the dish page (React `<ViewTransition>`: `app/(frontend)/template.tsx`, `MenuItemCard`, `ItemView`, `ScrollTopOnArrival`); red buttons shimmer and outlined ones fill on hover, a glow follows the pointer on dish cards (`Spotlight`), and order buttons give off a small puff of sparks (`emberBurst`).

**Hero video.** In the admin: Homepage → Hero → Video and Video cover (the loop's first frame). In demo mode, `heroLoop` in `src/seed/content.ts` names an MP4 in `public/seed` (silent, 6-10 s) and its poster; the seed uploads the same pair. Either way it replaces the hero photo and its CSS embers: the poster shows first, the video is loaded only after the page, pauses off-screen, and never plays for reduced motion or data saving (`HeroLoop`). The current clip is Pexels video 14554564 (free licence), cropped to the food and crossfaded end-to-start so it loops without a seam (10.5 s, 720x944, 2.3 MB).

What changed versus `main` is presentation only: `src/theme` (tokens, fonts, motifs, copy, `brand.css`), `src/components`, `src/views` and one import in `src/styles/globals.css`. Data and logic are identical.

**Logo.** The client's files are in `public/brand/`; the brand guidelines and original photos are in `docs/brand/`. **Map.** The footer shows AlBeik's Google Maps listing (Google's "Embed a map" iframe, lazy-loaded, tinted to the brand's warm charcoal) with the address and a Get directions button; the address and link come from the client's Google Maps listing.

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

**Offer banner.** Site settings → Offer banner puts a red strip above the header on every page, for special offers and occasions. Optional start and end dates switch it on and off by themselves: pages are static, so a small inline script checks the dates in the browser before the first paint. Demo mode shows a sample (Thanksgiving catering, until the end of Thanksgiving Day) from `banner` in `src/seed/content.ts`. A database seeded earlier has no banner yet: run `pnpm migrate`, then fill it in the admin.

**Menu updates.** The menu in `src/seed/content.ts` is the client's final in-store menu boards with prices (2026-11-17, transcribed in `docs/content/albeik-menu-boards-2026-11-17.md`). A database seeded before then still has an older menu: run `pnpm migrate && pnpm seed:menu`. It updates names, descriptions, prices, sizes, tags and order, hides dishes no longer on the menu (nothing is deleted: tick "On the menu" in the admin to bring one back), refreshes the home page's signatures and turns on Site settings → Show prices.

**The admin, for the restaurant.** Built for people who aren't technical: the sidebar has three groups (Menu, Website, Admin), the dashboard (`src/payload/admin/Dashboard.tsx`) greets by name and shows what's live right now (dishes on the menu, hidden, on offer, the offer banner; each opens the matching list), one-tap actions for the everyday jobs and every section with a line on what it's for, and the dish list reads in menu order with prices in dollars. Per dish: Price, Combo price, Other sizes (half portion, 12 pieces…) and Deal price (the site shows the old price crossed out and a "Deal" sticker; empty it to end the offer). Site-wide offers go in Site settings → Offer banner.

| Script                                       | What it does                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`     | Next.js (with a database configured, the build reads it to prerender pages)  |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Checks; the tests cover the order-link rules                                 |
| `pnpm migrate`                               | Apply database migrations                                                    |
| `pnpm migrate:create <name>`                 | After changing a collection or global, create a migration and commit it      |
| `pnpm seed`                                  | Add the scraped content. Only creates what's missing, so it's safe to re-run |
| `pnpm seed:menu`                             | Make the CMS menu match `src/seed/content.ts` (overwrites admin menu edits)  |
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

## Ordering (Clover / DoorDash / Uber Eats)

To enable direct pickup, run `pnpm migrate` and enter the public Clover Online Ordering URL in **Site settings → Ordering → Clover pickup link**. Pickup opens the restaurant’s full Clover menu, where guests choose their food and pay. Confirm pickup is enabled on that Clover storefront and verify a paid order reaches the POS and kitchen before publishing the link. Clearing the field restores the marketplace pickup options. For a local demo without Postgres, provide the public link via `CLOVER_PICKUP_URL` before starting the site.

### Embedded pickup spike

Start with `PICKUP_CARD_SPIKE_MODE=preview pnpm dev` and open `/order/pickup-card-spike`. Add a Chicken Tawouk combo with extra sauce to see the AlBeik checkout and complete a simulated payment with sample prices and tax. Checkout opens a waiting page that checks the same payment attempt and resumes after refreshing the tab.

For a connected test, open the US test merchant in Clover's developer sandbox. Add a fixed-price item, assign an optional modifier group, and enable a pickup order type. In that test merchant's Settings, generate a **Hosted iFrame + API/SDK** Ecommerce token pair and a REST token with inventory read and order read/write permissions. Set the sandbox values described in `.env.example` in `.env.local` and select `PICKUP_CARD_SPIKE_MODE=sandbox`. The menu mapping pairs published AlBeik slugs with test merchant inventory and modifier IDs. The page uses AlBeik photos and descriptions and reads prices, stock, and taxes from the test merchant.

Pay with a [Clover sandbox test card](https://docs.clover.com/dev/docs/test-card-numbers), then verify the same pickup order ID, item, modifier, total, and payment in Clover Sales activity. Check kitchen output on a configured Clover device. The spike stores attempt IDs and results in `.pickup-card-spike/` on a single machine, requires a persistent filesystem, and uses sandbox endpoints exclusively.

The DoorDash and Uber Eats buttons use this fallback chain:

1. the item's own link (Menu item → Order links), then
2. the store link (Site settings → Ordering), then
3. hidden.

With one platform available the button links straight to it; with both it opens a small sheet. Links open in the same tab so the phone's app can take over.

The seed fills in AlBeik's marketplace store links (Site settings → Ordering). Clover is opt-in.

Clicks are tracked as Umami custom events (`order_sheet_open`, `order_click` with item, platform, link level and placement) once `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set.

## Content still needed from the client

- Charbroiled Wings: the board prints the Fries Sandwich description and labels its sizes "Sandwich"/"Combo" (read as 6 and 12 pieces)
- Whether the icon next to Kabab or Kabab Orfali means spicy (tagged spicy for now)
- Catering's own phone and email (the restaurant's phone stands in)
- Item-level DoorDash / Uber Eats links, if they're willing to collect them (optional)
- Phone and opening hours (the address and Google Maps listing are in; demo content in `src/seed/content.ts`)
- The logo as vector (SVG) files; social links, testimonial sources
- Real photography to replace the illustrative menu images when it exists (see [docs/menu-images.md](docs/menu-images.md))

## Deploying

**Demo:** import the repo in Vercel and deploy. No settings or environment variables needed.

**With the CMS** (how `albeik-us` runs since 2026-11-17; `albeik-usa`, built from the same repo, stays in demo mode):

- **Database.** Storage → Create → Neon (free), connected to the project. It sets `DATABASE_URL` (pooled, used by the site) and `DATABASE_URL_UNPOOLED` (used for migrations).
- **Photo storage.** Storage → Create → Blob, connected to the project. It sets `BLOB_READ_WRITE_TOKEN`, and uploads go to Vercel Blob (without it they'd go to the local `media/` folder, which Vercel doesn't keep).
- **Secrets.** `PAYLOAD_SECRET` and `PREVIEW_SECRET` (random, see `.env.example`), and `NEXT_PUBLIC_SERVER_URL` set to the real domain.
- **Build command**, in the project's settings rather than a `vercel.json`, so the demo project isn't affected: `DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm migrate && pnpm build`.
- **Content.** Once, from your machine with the project's variables (`vercel env pull`): `pnpm migrate && pnpm seed`. It fills the empty database and uploads the photos and hero video to Blob.

**Create the admin account before sharing the URL** (sign up at `/admin` yourself, or run the seed with `SEED_ADMIN_*` set). Until an admin exists, anyone who opens `/admin` can create the first account. After that, admins add each other under Admin → Admins; there is no email sending yet, so a new admin gets a starting password from whoever adds them, and a forgotten password is reset by another admin.
