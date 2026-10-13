# AlBeik website

Next.js 16 + Payload CMS 3 in one app. The public site is static (rebuilt when content is published) and the admin lives at `/admin`. See [BRIEF.md](BRIEF.md) for the project brief.

**This branch (`main`) is the foundation:** content model, seed data, order links and unstyled pages. It deliberately has no visual design; the design proofs of concept live on `poc/*` branches.

## Run it

You need Node 22, pnpm 10 and a Postgres database (a free [Neon](https://neon.tech) or Supabase project works).

```bash
cp .env.example .env    # set DATABASE_URL and PAYLOAD_SECRET (and SEED_ADMIN_* for a login)
pnpm install
pnpm migrate            # create the tables
pnpm seed               # load the content from the current albeik.us
pnpm dev                # http://localhost:3000, admin at /admin
```

To start over with a clean database: `pnpm db:reset && pnpm seed`.

| Script                                       | What it does                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`     | Next.js (the build needs the database, because pages are prerendered)        |
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

**Presentation boundary.** A design branch changes `src/theme`, `src/components`, `src/views` and `public/` (plus the icon in `src/app/(frontend)/icon.svg`), and nothing else. Components get ready-made view models as props (`src/lib/data/types.ts`) and ESLint stops them from importing Payload or the data loaders. If a design needs different data, change it on `main` and rebase. To check a branch:

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

**Until store links are entered in Site settings, every order button is hidden.**

Clicks are tracked as Umami custom events (`order_sheet_open`, `order_click` with item, platform, link level and placement) once `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set.

## Content still needed from the client

- Full menu: Platters, Sides, Drinks and Desserts are empty (empty categories are hidden)
- Prices, and whether to show them (Site settings → Show prices)
- DoorDash and Uber Eats store links, plus item links if they're willing to collect them
- Address, phone, opening hours, Google Maps link
- Logo files, social links, testimonial sources
- Dietary tags (spicy, vegetarian), to be confirmed before tagging
- True cut-out photos, if any exist (the current ones have backgrounds)

## Deploying (later)

Vercel + the same hosted Postgres works. Two things to add first:

- **Media storage.** Uploads go to the local `media/` folder, which Vercel doesn't keep. Add Payload's S3 or Vercel Blob storage adapter.
- **Build command:** `pnpm migrate && pnpm build`.

Set the same environment variables as in `.env.example`, with `NEXT_PUBLIC_SERVER_URL` set to the real domain.

**Create the admin account before sharing the URL** (run `pnpm seed` with `SEED_ADMIN_*` set, or sign up at `/admin` yourself). Until an admin exists, anyone who opens `/admin` can create the first account.
