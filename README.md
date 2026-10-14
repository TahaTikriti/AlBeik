# AlBeik website

Next.js 16 + Payload CMS 3 in one app. The public site is static (rebuilt when content is published) and the admin lives at `/admin`. See [BRIEF.md](BRIEF.md) for the project brief.

## This branch: `poc/street`

Design direction 1 (the one chosen), taken straight from AlBeik's Instagram rebrand: deep black, the logo's fez red and white, AlBeik's real logo reversed for the dark background, huge condensed caps (Anton) with one word in red, the logo's mustache as the recurring mark, the logo's fez-and-face mark on the 404 and Visit pages, slow smoke and steam, split-flap numerals for the signatures and menu sections, round "plate" crops that hang off red cards, a scrolling slogan strip, and a dark order sheet that slides up. Copy is in the brand's voice ("Spice bomb is waiting").

What changed versus `main` is presentation only: `src/theme` (tokens, fonts, motifs, copy, `brand.css`), `src/components`, `src/views` and one import in `src/styles/globals.css`. Data and logic are identical.

**Logo.** The client's files are in `public/brand/`. They're dark ink on white or transparent, so the theme uses white-reversed pieces derived from the stacked PNG, kept in `src/theme/brand/` (mark, wordmark, full stacked logo) plus the favicons. Swap them for the client's own vector or reversed files when those arrive.

Lighthouse mobile (production build, demo data): performance home 91–92, menu 91–92, item 95; accessibility, best practices and SEO 100.

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
- Address, phone, opening hours, Google Maps link
- The logo as vector (SVG) files, including a white/reversed version; social links, testimonial sources
- Dietary tags (spicy, vegetarian), to be confirmed before tagging
- True cut-out photos, if any exist (the current ones have backgrounds)

## Deploying

**Demo:** import the repo in Vercel and deploy. No settings or environment variables needed.

**With the CMS:** Vercel + the same hosted Postgres. Two things to add first:

- **Media storage.** Uploads go to the local `media/` folder, which Vercel doesn't keep. Add Payload's S3 or Vercel Blob storage adapter.
- **Build command:** `pnpm migrate && pnpm build`.

Set the same environment variables as in `.env.example`, with `NEXT_PUBLIC_SERVER_URL` set to the real domain.

**Create the admin account before sharing the URL** (run `pnpm seed` with `SEED_ADMIN_*` set, or sign up at `/admin` yourself). Until an admin exists, anyone who opens `/admin` can create the first account.
