# AlBeik: Phase 1 Foundation Plan (`main` only)

> **Revised 2026-10-13 after review:** slimmed down at the user's request. No Docker (use a hosted Postgres such as Neon), no Playwright, no integration tests or test database; only the order-link unit tests remain. Everything else below still applies. See README.md for the current setup.

## Context

AlBeik's current site (albeik.us) is a menu with no way to order. The new site has two jobs: make people hungry, and get them from a menu item to DoorDash or Uber Eats in as few taps as possible, mostly on phones. Phase 1 builds the foundation on `main`: Next.js + Payload 3 in one app, Postgres, the §5 content model, a seed script from `docs/content/`, the §3 order-link fallback chain, click tracking, and neutral tokens with unstyled but working pages. Phase 2 (separate sessions) builds 2–3 design POCs on their own branches. So the main goal of this phase is a data and logic layer that any visual direction can re-theme fully without touching it.

The repo has `BRIEF.md`, `docs/content/` (home and about), and `docs/inspo/` (3 images), with no commits yet. Toolchain: Node 22.14, Docker Desktop 28 (installed, not running), Homebrew `psql` 18 (client only), no pnpm (Corepack available).

### What I found that differs from the brief
1. **No Chipotle or Hardee's screenshots** in `docs/inspo/`, only the Instagram grid and the two Dribbble shots. This blocks nothing in Phase 1.
2. **The photos aren't transparent cut-outs.** I downloaded samples from the live site. The `*_Photoroom.jpg` files are square ~500px photos on a red backdrop or a wooden board, with branded packaging. The `6M2A9570-(n).png` files have an alpha channel but an opaque red background. This doesn't affect Phase 1, but it matters a lot for the "food breaks out of its container" idea in §6.
3. **Testimonial avatars are generic placeholder icons**, so I won't seed them.
4. The packaging in the photos shows the existing logo (fez and mustache character). We still need the actual logo files.
5. Items known from Instagram and testimonials but missing from the scrape: Fattoush, Batata Harra, kebab platter, tabbouleh. These wait for the full menu.

---

## 1. Folder structure

```
AlBeik/
├── BRIEF.md · README.md · .env.example · .nvmrc (22)
├── docker-compose.yml            # local Postgres 17
├── package.json · pnpm-lock.yaml · pnpm-workspace.yaml (build-script allowlist)
├── next.config.ts (withPayload) · tsconfig.json (strict) · eslint.config.mjs
├── postcss.config.mjs · vitest.config.ts · playwright.config.ts
├── docs/
│   ├── content/ · inspo/                       # existing
│   └── superpowers/specs/2026-10-13-foundation-design.md   # this plan, committed
├── tests/e2e/                                  # Playwright smoke (if approved)
└── src/
    ├── payload.config.ts · payload-types.ts (generated)
    ├── migrations/                             # committed Payload migrations
    ├── app/
    │   ├── (payload)/                          # Payload admin + REST (generated, untouched)
    │   └── (frontend)/
    │       ├── layout.tsx                      # settings → <SiteShell>, fonts, analytics script
    │       ├── page.tsx                        # Home
    │       ├── menu/page.tsx · menu/[slug]/page.tsx
    │       ├── about/page.tsx · location/page.tsx · not-found.tsx
    │       ├── sitemap.ts · robots.ts · opengraph-image.tsx
    │       └── next/preview/route.ts · next/exit-preview/route.ts
    ├── payload/                                # ── STABLE: CMS schema ──
    │   ├── collections/  MenuItems · Categories · Testimonials · Media · Users
    │   ├── globals/      SiteSettings · Homepage · About
    │   ├── fields/       slug · sortOrder · orderUrl · emphasisText
    │   ├── access/       authenticated · publishedOrAuthenticated
    │   └── hooks/        revalidateSite
    ├── lib/                                    # ── STABLE: data + logic ──
    │   ├── data/         payload client, page loaders, view-model types (the contract)
    │   ├── order/        platforms · resolveOrderLinks · toOrderAction (+ tests)
    │   ├── analytics/    events (typed) · track (Umami adapter)
    │   ├── text/         emphasis parser (+ tests)
    │   ├── hours/        format/group hours (+ tests)
    │   └── seo/          metadata helpers · JSON-LD builders
    ├── seed/                                   # ── STABLE ──
    │   ├── index.ts · content.ts (typed transcription) · images/ (committed)
    ├── theme/                                  # ── RE-THEME SURFACE ──
    │   ├── tokens.css · fonts.ts · theme.ts · copy.ts · motifs.tsx
    ├── styles/globals.css                      # tailwind + tokens + base (reset, focus, motion)
    ├── components/                             # ── POC-EDITABLE: presentation ──
    │   ├── shell/  SiteShell · Header · Footer · StickyOrderBar
    │   ├── order/  OrderButton · OrderSheet (client islands)
    │   ├── menu/   CategoryNav (client island) · MenuSection · MenuItemCard
    │   └── ui/     Img (next/image wrapper) · Emphasis · RichText
    └── views/                                  # ── POC-EDITABLE: page layouts ──
        └── HomeView · MenuView · ItemView · AboutView · LocationView · NotFoundView
```

Every `page.tsx` handles data only: load, build metadata and JSON-LD, then hand off to a view:
```tsx
export default async function MenuPage() {
  const data = await getMenuPageData()        // lib/data: view models, order links resolved server-side
  return <MenuView {...data} />               // views/: whatever the POC wants
}
```

---

## 2. Content model

Shared conventions:
- **Public read access** returns published documents only. Logged-in users see everything.
- **Writes** require login.
- **GraphQL** is disabled. REST stays, because the admin uses it.
- **`*emphasis*` markup** in display-text fields (marked ★ below). The editor writes `The recipe is *Lebanese*.`, and `lib/text` parses it into segments. The design decides what emphasis looks like (red, outline, and so on). This is how the client controls the "one word in red" style without rich text.

### Collections

**`menu-items`**: drafts and live preview on
| Field | Type | Notes |
|---|---|---|
| name | text, required | `useAsTitle` |
| slug | text, unique, indexed | auto-generated from name when blank; editable; sidebar |
| shortDescription | textarea | |
| category | relationship → categories, required | single category |
| image | upload → media | optional |
| price | number ≥ 0, step 0.01 | optional, USD; shown only if `site-settings.showPrices` |
| tags | select, hasMany | `spicy`, `vegetarian`, `popular`, `new`, `signature` (halal is site-wide) |
| doordashUrl | text | validated: https + DoorDash host allowlist (shared with runtime check) |
| uberEatsUrl | text | validated: https + Uber Eats host allowlist |
| available | checkbox, default true | false = hidden from the site |
| sortOrder | number, default 0 | ascending within category |

**`categories`**: name (required), slug, image (upload, optional: "icon or image"), sortOrder, `items` join field (read-only list of the category's items in the admin).

**`testimonials`**: name (required), quote (textarea, required), source (optional select: google, yelp, facebook, instagram, tripadvisor, doordash, uber-eats, other), sourceUrl (optional, *added*), avatar (upload, optional), featured (checkbox), sortOrder (*added*).

**`media`** (upload): alt (text, **required**). Accepts `image/*`, `video/mp4`, and `video/webm` (the Instagram brand is reels, so a hero might be a video). Focal point on. No Payload image sizes, because `next/image` handles resizing. Stored on local disk (`/media`, gitignored) on `main`.

**`users`** (auth): name. Every user is an admin; no roles yet.

### Globals

**`site-settings`**
- siteName (default "AlBeik") · logo (upload)
- doordashStoreUrl · uberEatsStoreUrl (validated as above; the base of the fallback chain)
- showPrices (checkbox, default **off**) *added*: answers the open "prices or not" question with a switch
- locations (array, min 1) *added in place of a single address*: name, streetAddress, city, region, postalCode, mapUrl, phone, hours (array of `{ days: mon–sun multi-select, opens "HH:MM", closes "HH:MM" }`), hoursNote. Structured hours feed the Restaurant JSON-LD and any future "open now" feature.
- timezone (default `America/Chicago`) · socials (array: platform select + url)
- seo group: defaultDescription, ogImage (upload)

**`homepage`**: drafts and live preview on
- hero: headline ★ · subline · media (upload)
- promise *added*: headline ★ · body · media. Holds the "100% Halal, Fresh & Delicious" brand-promise section from §8, so that copy is editable instead of hard-coded.
- featuredItems: relationship, hasMany → menu-items, ordered
- promo: enabled · text ★ · linkLabel · linkUrl · countdownTo (optional date, *added* so the flip-clock promo motif in §6 has data without a later change to `main`)

**`about`**: headline ★ (*added*) · body (Lexical rich text, limited to paragraph, h2/h3, bold/italic, link, lists) · images (array of uploads, which the design places freely).

The store URLs stay at site level, as §5 says. If the restaurant adds a second location, each location would need its own store links. Making `locations` a list now keeps the rest of the model ready for that.

---

## 3. Order links and click tracking (§3)

`lib/order/platforms.ts` is the one registry. A third platform (DoorDash Storefront or order.store) would mean one entry here plus one field.
```ts
PLATFORMS = [
  { id: 'doordash', label: 'DoorDash',  hosts: ['doordash.com', 'drd.sh'] },
  { id: 'ubereats', label: 'Uber Eats', hosts: ['ubereats.com'] },
]
```
- `isAllowedOrderUrl(platform, url)`: https only, host equals or ends with an allowed host. The Payload field validation and the runtime check both use this function, so a bad URL saved before a rule change still never renders.
- `resolveOrderLinks(item | null, settings) → OrderLink[]`: for each platform in registry order, use the item URL if valid, else the store URL if valid, else nothing. Each link is `{ platform, label, href, level: 'item' | 'store' }`. Passing `null` gives the store-level links used by the site-wide sticky CTA.
- `toOrderAction(links)`: `none` (render nothing), `direct` (exactly one platform: a plain link "Order on DoorDash", **one tap**), or `choose` (open the sheet).
- Links are universal `https://` links opened **in the same tab** (no `target=_blank`), which is the most reliable way to hand off to the installed app on iOS and Android.
- Order links are resolved server-side in `lib/data`, so client components receive finished links and there is no logic on the client.

**Components (unstyled on `main`):** `OrderButton` is a client island. `OrderSheet` uses a native `<dialog>` with `showModal()`, which provides focus trapping, Esc to close, and backdrop dismissal with no library. `StickyOrderBar` is a site-wide bottom CTA that respects `env(safe-area-inset-bottom)`.

**Tracking:** `lib/analytics/track.ts` is a typed adapter, and swapping vendors means editing this one file.
- `order_sheet_open { item, placement }`
- `order_click { item, platform, level, placement }`. `item` is the slug, or `"store"` for the sticky CTA. `placement` is one of `menu | item | home-featured | sticky`.

The adapter fires on click without blocking navigation. Umami's tracker sends with `fetch` `keepalive`, so the event survives the page unloading; I'll confirm this in the network panel. The adapter does nothing, with no console noise, when the analytics env var is unset.

---

## 4. Rendering, caching, previews

- **Static generation and ISR.** All public pages prerender at build from the Payload Local API, and `generateStaticParams` covers item slugs. `dynamicParams` is on, so an item added later renders on first request and is then cached. No route handlers or custom API endpoints, apart from the two draft-mode toggles.
- **`lib/data`** queries through `getPayload({ config })` and is deduplicated per render with React `cache()`. It returns plain view models (`MenuItemVM`, `ImageVM`, `OrderLink`, `Segment[]`…). Those types in `lib/data/types.ts` are the contract between data and presentation.
- **Hiding drafts.** Payload returns never-published drafts even when a query asks for published content only, so the `draft` flag alone isn't enough. As in Payload's website template, drafts are kept off the public site through access control:
  - `read: publishedOrAuthenticated` returns `_status = published` for visitors who aren't logged in.
  - Queries pass `overrideAccess: draftMode`, which applies that rule on every normal render (`generateStaticParams` too). Draft mode lifts the rule and shows drafts.
  - `available = true` is always added to the query.
- **On-demand revalidation.** `payload/hooks/revalidateSite` runs on afterChange and afterDelete for every public collection and global, and calls `revalidatePath('/', 'layout')`. With about 25 pages, invalidating the whole site on publish is simpler and safer than mapping each collection to paths. After a `revalidatePath`, the next request renders fresh rather than serving stale content, so an editor sees the change on refresh.
  - It runs only when the doc is published, or when a published doc is unpublished.
  - It skips when `context.disableRevalidate` is set. The seed script must set this, because `revalidatePath` throws an "Invariant: static generation store missing" error when called from a `payload run` script.
- **Drafts and live preview** for `menu-items` and `homepage`, using drafts plus autosave so the preview updates as the editor types. The setup mirrors Payload's website template:
  - `admin.livePreview.url` points at `/next/preview?path=…&previewSecret=…`.
  - The route handler checks `PREVIEW_SECRET` and `payload.auth({ headers })`, calls `draftMode().enable()`, and redirects with a sanitized path. `/next/exit-preview` turns draft mode off.
  - A `RefreshRouteOnSave` listener renders only when draft mode is on.
  - Preview breakpoints are 375, 768, and 1280.

  Draft mode in Next 16 still bypasses static and ISR caches. This is the **last** build step, and if it fights the setup I'll cut it and log it as a follow-up, as §5 allows.
- **Next 16 specifics (confirmed in the Payload 3.90.2 and Next 16.4.0 source):**
  - `cacheComponents` stays off. Payload says it is "not guaranteed" and its templates don't use it.
  - `withPayload` supports the default Turbopack build.
  - Lint runs as `eslint .`, since `next lint` is gone.
  - No proxy or middleware.
  - `images.localPatterns: [{ pathname: '/api/media/file/**' }]`, so Payload's cache-busting `?…` query strings don't break `next/image`. Media URLs stay relative, which also avoids Next 16's block on optimizing images from local IP addresses.
- **SEO:** `generateMetadata` on every page (title template `%s · AlBeik`, descriptions from content), a generated Open Graph image (via `next/og`, which ships with Next), `sitemap.ts`, and `robots.ts`. JSON-LD:
  - `Restaurant` with address, phone, hours, cuisine, socials, and `hasMenu`
  - `Menu` → `MenuSection` → `MenuItem` on `/menu`, with `suitableForDiet: HalalDiet` and offers only when prices are shown

  Empty fields are left out, never filled with made-up values.

---

## 5. Styling approach and the re-theme layer

**Tailwind v4, CSS-first.** There is no `tailwind.config.js`; tokens are CSS custom properties exposed to Tailwind through `@theme inline`. That means tokens work at runtime (they can be scoped and swapped per section), and a POC re-themes by editing CSS, not JavaScript config. Tailwind's CSS loads only in the `(frontend)` layout, so it can't collide with Payload's admin styles.

**`src/theme/` is the entire re-theme surface:**
| File | Role on `main` | What a POC does |
|---|---|---|
| `tokens.css` | **Primitives** (`--p-*`: raw grayscale palette, system font stacks, scale steps, private to the file). **Semantic contract** (stable names that components use): color roles `surface / surface-raised / surface-inverse / ink / ink-muted / ink-inverse / accent / accent-ink / line / focus`; type `font-display / font-body`, fluid `text-display-1..3` (size, leading, tracking, set for 375px first), `text-body / text-small`; shape `radius-control / card / sheet`; elevation `shadow-raised / sheet`; space `gutter (16px) / section / stack`; layout `tap-min (44px) / header-h / chipbar-h / content-max`; motion `duration-fast/base/slow`, `ease-out / ease-snap`; z-index `header / sheet`. **Theme scopes**: `[data-theme="inverse"]` re-points the color roles, so one section can flip (the hybrid POC's dark home and light menu) with no new components. **Reduced motion**: duration tokens become 0ms under `prefers-reduced-motion`. | Replace the primitives, re-point the semantics, add tokens |
| `fonts.ts` | `next/font` setup exporting CSS variables; system stacks on `main` | Load the brand's condensed display face |
| `theme.ts` | JS mirror for places CSS can't reach: `<meta name="theme-color">` and OG image colors and font | Brand values |
| `copy.ts` | UI microcopy ("Order", "Order on DoorDash", empty states, section labels): plain on `main` | The brand voice ("Spice bomb is waiting") |
| `motifs.tsx` | Brand slots: `<Logo/>`, `<Divider/>`, `<Loader/>`, `<NotFoundArt/>`, rendered as plain text, `<hr>`, or nothing | Mustache divider, fez loader and 404, smoke |

**Presentation boundary.** This is what lets each POC change everything visual and nothing else:
- POC-editable: `src/theme/**`, `src/components/**`, `src/views/**`, `public/brand/**`. A POC may also add thin route files for a UI pattern, such as an intercepting route that shows item detail as a sheet over the menu, as long as they call existing `lib/data` loaders.
- Stable (changes happen on `main`, then POCs rebase): `src/payload/**`, `src/lib/**`, `src/seed/**`, `src/migrations/**`, `src/app/(payload)/**`, and the data wiring in `(frontend)/**/page.tsx`.
- Enforced by ESLint `no-restricted-imports`: `components/`, `views/`, and `theme/` can't import `payload`, `@payload-config`, or `@/lib/data`; they only receive view-model props. The README tells POC branches to keep `git diff main --stat -- <stable paths>` empty.

**"Unstyled" on `main`** means grayscale and system fonts, but functional. Base CSS covers:
- no horizontal scroll
- 44px tap targets
- category chips that stick under the header (`scroll-margin-top` from tokens)
- the sticky bottom order bar, respecting safe areas
- visible focus
- a skip link

CSS uses logical properties, so RTL stays possible.

---

## 6. Dependencies

Pinned to current versions: Next 16.4, React 19, Payload 3.90.2. Payload 3.90's peer range supports Next ≥16.3.3.

| Package | Why | Status |
|---|---|---|
| `next`, `react`, `react-dom` | framework | core |
| `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical` | CMS, admin, Postgres, rich text for About (`convertMarkdownToLexical` seeds it) | official |
| `@payloadcms/live-preview-react` | `RefreshRouteOnSave` for live preview | official |
| `graphql` | required peer of Payload, even with GraphQL disabled | Payload requirement |
| `sharp` | Payload image metadata and focal point; Next image optimization when self-hosted | Payload requirement |
| `tailwindcss`, `@tailwindcss/postcss`, `postcss` | styling | styling tool |
| `typescript`, `@types/*` | strict TS | core |
| `eslint`, `eslint-config-next` | `pnpm lint` (Next 16 runs ESLint through its own CLI) | Next's official config |
| **`vitest`** | unit tests for the fallback chain, URL validation, emphasis parsing, hours, and a seed check that the known typos are gone | **needs your OK** |
| **`@playwright/test`** | small smoke suite reused on every POC branch: each page at 375/768/1280 has no horizontal overflow and no console errors, and the order button and sheet resolve and hide correctly | **needs your OK** |
| **`prettier`** | formatting (the Payload template includes it) | **needs your OK** |

**Not adding:** a storage adapter (until hosting is decided, see Q1), UI kits, animation libraries, `clsx`, or an analytics SDK (Umami is one script tag). Approving this plan approves the three marked packages; strike any you don't want.

**Removing from the Payload `blank` template:**
- `@testing-library/react`, `jsdom`, `@vitejs/plugin-react`: no component unit tests; Playwright covers UI.
- `vite-tsconfig-paths`: one alias in `vitest.config.ts` does the same job.
- `cross-env`, `dotenv`: Payload's CLI and Next load `.env` themselves.
- `tsx`: `payload run` executes TypeScript.
- The template's Dockerfile, `.npmrc`, and the `my-route` example.

**pnpm 10.34** (latest 10.x), through Corepack and pinned with `packageManager`. pnpm 12 is out, but Vercel natively supports only pnpm 6–10 (11 and later need an experimental Corepack flag), and Payload's templates declare `engines.pnpm ^9–^11`. Packages that need build scripts (sharp, esbuild, unrs-resolver) go in the build-script allowlist in `pnpm-workspace.yaml` (`onlyBuiltDependencies`). Moving to pnpm 11 or later later on means renaming that one key to `allowBuilds`.

---

## 7. Local Postgres

- **Docker Compose**: `postgres:17-alpine`, host port **5433**→5432 to avoid clashing with any Homebrew install, a named volume, and a healthcheck. Payload doesn't publish a supported-version list (its adapter uses `pg` 8.20 and Drizzle 0.45), so I chose 17 to match Neon's and Supabase's current major version.
- Scripts: `pnpm db:up`, `pnpm db:down`, `pnpm db:reset` (removes the volume), and `pnpm fresh` (`db:reset` → `payload migrate` → `seed`).
- Development uses Payload's schema push (on by default only in development). When the schema settles, `payload migrate:create` writes a migration that gets committed. Fresh and hosted databases are built from migrations only, never push; a hosted build later runs `payload migrate && pnpm build`.
- `DATABASE_URI=postgres://albeik:albeik@localhost:5433/albeik` in `.env.example`.
- Docker Desktop is installed but not running; I'll start it. The README also documents a Homebrew `postgresql@17` alternative for anyone without Docker.

---

## 8. Analytics: Umami Cloud

- **Free Hobby tier**: 100K events a month, where each pageview, custom event, and stored event property counts as one event. That's plenty for a single restaurant.
- **About 2 KB, cookie-free script** loaded with `next/script` (`lazyOnload`), so no consent banner and no Lighthouse penalty.
- **Custom events with properties** give exactly the breakdown asked for: clicks by item, by platform, and by item-level vs store-level link.
- **Shareable dashboard link** for the client, with no login needed.

Why not the others:
- Plausible: custom properties require the Business plan (about $19 a month).
- Vercel Analytics: custom events are Pro-only and tie analytics to the host.
- GA4 and PostHog: heavy scripts that threaten the Lighthouse 90s target, and GA4 brings consent questions.

Configured with `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (plus an optional script URL). I'll check the live pricing page before anyone signs up.

---

## 9. Seed script (`pnpm seed` → `payload run src/seed/index.ts`)

- **Content:** `seed/content.ts` is a typed transcription of `docs/content/`. Each fix is commented with the original text:
  - every typo fix listed in the brief
  - "Lebanon-a" → "Lebanon — a"
  - item names title-cased with consistent "AlBeik" spelling

  Customer quotes stay verbatim (whitespace trimmed only).
- **What gets created:**
  - 7 categories. Specials, Appetizers, and Sandwiches have items. Platters, Sides, Drinks, and Desserts are empty and marked TODO; the menu hides empty categories.
  - 18 items: Specials 2, Appetizers 6, Sandwiches 10. No prices.
  - Only the `signature` tag is seeded, on the two Specials.
  - 4 featured testimonials (no source, no avatar).
  - Homepage. Hero: "The recipe is *Lebanese*. The extra attitude is ours." with subline "A taste of home, miles away from Beirut" and the landscape banner. Promise: "100% *Halal*, Fresh & Delicious" with the intro paragraph and the table photo. Featured: the 2 Specials. Promo off.
  - About page, built from the scraped copy with `convertMarkdownToLexical`.
  - Site settings with siteName, and contact details and store URLs left **empty**.
  - An admin user from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
- **Images:** downloaded once from the live site's S3 bucket into `src/seed/images/` and **committed** (about 5 MB), so seeding never depends on the old site staying up. Alt text is the item name, editable in the admin.
- **Safe to re-run:** upserts by slug or name, so a second run creates no duplicates. Writes use `context.disableRevalidate` and publish drafts. It ends by printing the content TODO list (menu, prices, hours, address, phone, store URLs, logo).

---

## 10. Build sequence (small commits on `main`)

1. `chore`: add the brief, scraped content, and inspo; commit this plan as `docs/superpowers/specs/2026-10-13-foundation-design.md`.
2. Scaffold Next 16 + Payload 3.90, then add pnpm, strict TS, ESLint, Docker Compose, and `.env.example`. I'll generate the template with `create-payload-app@3.90.2 -t blank --db postgres --branch v3.90.2 --no-agent` in the scratchpad, never in the repo, because it overwrites files and would add an agent file. Then I copy its version-matched `(payload)` files and config across and trim the extras listed in §6.
3. Payload schema: collections, globals, access, shared fields → generate types → initial migration.
4. `lib/order`, `lib/text`, `lib/hours`, `lib/analytics`, written test-first with Vitest.
5. `lib/data` loaders and view-model types, including the published and available filters.
6. Theme layer + Tailwind + base CSS.
7. Shell, views, and components (menu with sticky chips, item page, about, location, 404, order button, sheet, and sticky bar) + metadata, JSON-LD, sitemap, robots, and OG image.
8. Revalidation hook.
9. Seed script + committed images.
10. Drafts + live preview (can be cut to a follow-up).
11. Playwright smoke (if approved), the README (how to run, the presentation boundary, the content TODO list), and final verification.

## 11. Verification (definition of done for `main`)

- `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass, and `pnpm build` passes with the database up (prerendering needs it).
- `pnpm fresh` fills a brand-new database end to end, and a second `pnpm seed` creates no duplicates.
- **In the admin**, edit an item, a category, and the homepage headline, publish, and confirm each change appears on the public page (revalidation works). Live preview shows unpublished drafts.
- **Fallback chain**: the unit matrix covers item/store/none × 2 platforms × valid/invalid URLs. I'll also check by hand: item DoorDash URL only, store Uber URL only, and nothing at all, with the buttons showing, going direct, or hiding as expected.
- **Real browser** (Claude in Chrome) at 375, 768, and 1280:
  - no horizontal scroll (`scrollWidth ≤ innerWidth`)
  - no console errors
  - keyboard: the sheet traps focus and Esc closes it
  - chips stay stuck under the header
  - the sticky bar clears the safe area
- **Lighthouse mobile on `/menu`** against `pnpm start`, run with `pnpm dlx lighthouse` (one-off, not a dependency): performance and accessibility in the 90s.
- **Analytics**: with a test website ID the events show up in the network panel; without one, nothing fires and nothing errors.

Then I stop and report.

---

## 12. Assumptions (I'll proceed on these unless you object)

1. Each item belongs to one category. "Specials" is a category; `signature` is a separate tag.
2. Dietary tags (`spicy`, `vegetarian`) are claims customers rely on, so I won't seed them until the client confirms. Only `signature` is seeded, backed by the copy's "Our signature…".
3. `available: false` hides the item everywhere, and its page returns 404.
4. Prices are optional, none are seeded, and `showPrices` defaults to off.
5. `*emphasis*` markup marks the highlighted word. Emphasis is seeded only where the Instagram posts do it (LEBANESE, HALAL).
6. The fields marked *added* in §2 go beyond the brief's list. Each is small and avoids a later data change on `main`.
7. UI microcopy lives in `theme/copy.ts` per POC, not in the CMS. If the client wants to edit it, we move it to a global later.
8. The order button links straight to the platform when only one platform has a link, and opens the sheet when both do. DoorDash is listed first. Links open in the same tab.
9. The host allowlists (`doordash.com`, `drd.sh`, `ubereats.com`) are a starting guess. I'll widen them once we see real share links from the client.
10. Seed copy changes go beyond the brief's typo list only for title-casing item names, "AlBeik" spelling, and the "Lebanon-a" fix.
11. Every publish revalidates the whole site.
12. `pnpm build` needs a reachable database (true on Vercel as well).
13. No Arabic or Payload localization now. CSS uses logical properties, and `lang`/`dir` are set in one place.
14. Media stays on local disk on `main`.
15. Sorting uses plain `sortOrder` number fields, as the brief says. Payload's drag-and-drop `orderable` is still marked experimental and only keeps one order across the whole collection, so I'd revisit it once we know who edits the menu.

## 13. Open questions (each has a default so the plan can run as written)

1. **Where do POCs get hosted for the client's phone review?** I'd suggest Vercel + Neon (one shared database, since POCs don't change data) + media storage (Vercel Blob or an S3-compatible bucket, through an official Payload adapter). Whose accounts? *Default: Phase 1 stays local; we decide before Phase 2.*
2. **Is Umami Cloud OK, and who owns the account, you or the client?** *Default: yes; the code works with no ID until one exists.*
3. **Vitest, Playwright, Prettier?** *Default: all three.*
4. **Should I scrape the full `/our-menu` page now** with the browser and seed it (flagged for client review)? *Default: no; seed the 18 items, per the brief.*
5. **May I take address, hours, phone, and the DoorDash and Uber Eats store URLs from their public listings,** marked "verify with client"? Without store URLs, every order button stays hidden, so the order sheet can't be shown in the POCs until someone enters them in the admin. *Default: leave empty.*
6. **The Chipotle and Hardee's screenshots are missing** from `docs/inspo/`. *Default: needed before Phase 2, not now.*
7. **Photography:** the photos are on red or wooden backgrounds, not transparent (see "What I found"). Ask the client whether they have true cut-outs. *Default: no impact on Phase 1.*
8. **Process:** on approval I'll commit this plan to the repo (so the POC sessions can read it) and build straight through to the report. *Default: yes. Say so if you'd rather review a separate task-by-task plan first.*

The client questions in §13 of the brief (logo and fonts, Storefront or order.store, who edits the CMS, Arabic) are still open. I'm not repeating them here.
