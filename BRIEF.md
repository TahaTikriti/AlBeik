# AlBeik — Website Rebuild Brief

> This is the source of truth for the project. Read it fully before planning. If anything here conflicts with what you find in the repo, ask, don't guess.

## 1. The client

**AlBeik** is a Lebanese fast-food restaurant in Kansas City (State Line shops). The food is 100% halal: shawarma, kafta, tawouk, arayes, falafel, mezze, plus a couple of "fusion" signatures like the AlBeik Smashed Burger. It's family-run, and the positioning is Beirut street food with attitude.

- Current site: <https://albeik.us> (built by Codeloops, menu only, no ordering)
- Existing taglines: "A taste of home, miles away from Beirut", "Rooted in Flavor, Driven by Purpose", "100% Halal, Fresh & Delicious"
- Instagram voice (recent rebrand): "Juicier. Meatier. Tastier.", "The recipe is Lebanese. The extra attitude is ours.", "Spice bomb is waiting."

Scraped content of the current site is in `docs/content/` (home + about). Use it as seed data. The full menu lives at `/our-menu` on the live site and is **not** scraped yet; seed what we have and mark the rest as TODO.

Fix these typos when seeding (they exist on the live site): "hala" → "halal", "commited" → "committed", "smashed smashed patty" → "smashed patty", "Ribe-eye" → "Rib-eye", "Kansas city" → "Kansas City", and the stray ")" in the Baba Ghannouj description. Do not invent prices, hours, or facts; leave them empty or as clearly marked placeholders.

## 2. What we're building now

Not the final site. A **foundation plus 2 to 3 design proofs of concept**, each on its own branch, so the client can react to real, clickable directions on their phone. The design is not decided and requirements are still incomplete, so optimize for speed of exploration and for a data layer that survives whichever direction wins.

## 3. Primary goal: get people from the menu to an order

The site is a menu, not an ordering system. Every item should make it effortless to order on **DoorDash** or **Uber Eats**.

**Important constraint (verified):** neither DoorDash nor Uber Eats offers a public link that pre-fills a customer's cart. Cart APIs exist only inside their apps or partner programs. So "add this item to your DoorDash cart" is not something we can do with a link. What we *can* do:

1. **Store-level links** (guaranteed): the restaurant's DoorDash and Uber Eats store pages. Use the `https://` universal links, not custom `doordash://` or `ubereats://` schemes, so they open the app when installed and fall back to the web otherwise.
2. **Item-level links** (best effort): both platforms have per-item pages or item views reachable by URL (for example via each app's "share item" option). If the client or we can collect these, link directly to the item so the user lands one tap from "Add to cart".
3. **Fallback chain:** item link for that platform → store link for that platform → hide that platform's button.

Data model must support this: each menu item has optional `doordashUrl` and `uberEatsUrl`; site settings hold the store URLs. The UI pattern is an "Order" button that opens a small sheet: "Order on DoorDash" / "Order on Uber Eats". Track clicks (simple analytics events) so we can show the client which items and which platform drive traffic.

Open question for the client: are they on Uber's direct storefront (order.store) or DoorDash Storefront? If so, those could be a third, commission-free option.

## 4. Stack

- **Next.js** (App Router, TypeScript strict) with **Payload CMS 3** installed in the same app (Payload 3 is Next-native; admin at `/admin`)
- **PostgreSQL** via Payload's Postgres adapter (Supabase or Neon for hosting; local Postgres or Docker for dev)
- **Media:** S3-compatible storage adapter for production; local storage is fine for the POCs
- **Hosting:** self-hosted (Vercel or similar). Payload Cloud is not an option for new projects.
- Styling: propose an approach in the plan (my default is Tailwind). Keep design tokens (colors, type, radii, spacing) in one place so each POC branch can re-theme without touching components' logic.
- Package manager: pnpm
- Ask before adding any dependency beyond Next, Payload and its official adapters/plugins, and the styling tool.

## 5. CMS content model (client must be able to edit all of this)

**Collections**

- `menu-items`: name, slug, short description, category (relation), image, price (optional), tags (halal is site-wide; per item: spicy, vegetarian, popular, new, signature), `doordashUrl`, `uberEatsUrl`, available toggle, sort order
- `categories`: name, slug, icon or image, sort order (Specials, Appetizers, Sandwiches, Platters, Sides, Drinks, Desserts; confirm with full menu)
- `testimonials`: name, quote, source (Google, Yelp, etc.), optional avatar, featured toggle
- `media`: with required alt text

**Globals**

- `site-settings`: logo, DoorDash store URL, Uber Eats store URL, address, map link, phone, hours, socials
- `homepage`: hero (headline, subline, media), featured items (relation), promo banner (text, link, on/off)
- `about`: rich text plus images

Enable drafts and live preview for `homepage` and `menu-items` if it doesn't slow down the foundation phase; otherwise note it as a follow-up.

## 6. Brand and design direction

### Design ambition

This must not look like a restaurant template. No generic hero-plus-three-cards layout, no stock "Mediterranean" beige and olive, no default component-library look. The bar is Chipotle: someone should recognize it as AlBeik from a single screenshot. Concretely:

- **Typography does the heavy lifting.** Huge condensed caps, tight leading, one word in red, like the Instagram posts. Type sized for a phone screen, not shrunk from desktop.
- **Food is the hero.** Cut-out dishes that break out of their containers, overlap edges, and sit on bold color fields instead of being boxed into identical cards.
- **The brand's own motifs, used with restraint:** the mustache as a recurring mark or divider, the fez as a moment (loader, 404, promo), smoke and steam as texture, and flip-clock numerals for specials or countdowns.
- **Motion with purpose.** Scroll-linked reveals, chips that snap, a satisfying order sheet, a subtle steam drift on hero images. It should feel tactile on a phone, and everything must respect `prefers-reduced-motion`.
- **Voice in the UI.** Microcopy in the brand's cheeky tone ("Spice bomb is waiting", "Juicier. Meatier. Tastier.") instead of "Learn more" and "View menu".
- **Each POC must have a clear point of view.** Two safe variations of the same layout is a failed exploration.

### The real brand: AlBeik's own Instagram (ground truth)

The Instagram grid in `docs/inspo/` is **the restaurant's actual recent posts, showing their new rebrand.** It is not inspiration; it is the brand. Match its colors, type style, motifs, and tone. The Dribbble shots and the Chipotle and Hardee's references are only for layout and UX patterns.

### What the brand already has (from the recent Instagram rebrand)

- Palette: deep black, a strong tomato/chili red, white. Warm smoky food photography.
- Type: heavy, condensed, all-caps display headlines with one word highlighted in red. Simple sans for body.
- Motifs: a white **mustache** mark, the red **fez (tarboush)**, smoke and steam, split-flap/flip-clock numerals ("02 DAYS TO TASTEBUD TANTALIZATION").
- Voice: confident, cheeky, short punchy lines.

### Reference sites and shots (in `docs/inspo/`)

- **Chipotle (main reference for experience):** food-first, huge confident type, simple path from menu to order, menu as big tappable tiles, strong single brand color, playful but fast.
- **Hardee's:** bold product heroes, big type, appetite appeal.
- **Dribbble shot A (white app UI):** soft white cards with gentle shadows, round top-down plate photos, orange pill category chips, generous spacing.
- **Dribbble shot B (GustoGrid, pink tint):** horizontal scrolling category chips, "Popular" carousel, "Specials of the Day" list, item detail with ingredient chips and a sticky bottom bar with the primary action.
- **AlBeik Instagram grid (the restaurant's own posts):** the brand system described above. This one is the source of truth, not a reference.

Take patterns and feel from these. Do not copy their branding, assets, or layouts one-to-one.

### Photography note

Current item photos are phone shots with backgrounds removed (cut-outs on transparent). They're inconsistent in angle and lighting. The round plate / cut-out style of the Dribbble shots suits them well; full-bleed hero photography needs better source images. Use the existing image URLs from the scraped content for the POCs.

## 7. Mobile-first requirements

- Design at 375px first, then scale up. Desktop should feel intentional, not a stretched phone.
- Sticky, thumb-reachable order CTA. Respect safe-area insets.
- Tap targets at least 44px. Category chips stick under the header while scrolling the menu.
- Fast: `next/image` with proper sizes, no layout shift, minimal client JS on menu pages (server components by default).
- Accessible: semantic HTML, visible focus, alt text, color contrast that passes WCAG AA (careful with red on black), `prefers-reduced-motion` respected.
- SEO basics: metadata per page, Open Graph images, `Restaurant` + `Menu` JSON-LD.

## 8. Pages for the POCs

1. **Home:** hero, halal/brand promise, featured items, order CTA, testimonials, location/hours
2. **Menu:** sticky category chips, item list or grid, order button on every item
3. **Item detail:** a bottom sheet or a page (try both across POCs): image, description, tags, order sheet
4. **About:** story from the scraped content
5. **Location & hours:** address, map link, hours, phone

## 9. Branch plan

- `main`: **foundation only.** Next + Payload running, collections and globals, seed script from `docs/content/`, neutral design tokens, unstyled but functional pages, order-link logic with fallbacks, click tracking hook. No design opinions here.
- `poc/street` — **Bold street brand.** Dark, black and red, condensed caps, mustache and fez motifs, smoke textures, flip-clock numerals for promos. Chipotle-level energy and confidence. Closest to the Instagram rebrand.
- `poc/app` — **Clean app-like menu.** Light, soft cards, round plate cut-outs, pill chips, bottom-sheet item detail, sticky bottom order bar. Dribbble A/B feel, with AlBeik red as the accent.
- (optional) `poc/hybrid` — dark brand-heavy home page and hero, light app-like menu pages.

POC branches change presentation only: tokens, layout, components' styling, motion. If a POC needs a data change, make it on `main` and rebase. Consider git worktrees so POCs can be built in parallel.

## 10. Out of scope for now

Online ordering, payments, user accounts, loyalty, multiple locations (but don't hard-code a single location where it costs nothing to keep a list), Arabic/RTL (ask the client; keep it possible).

## 11. How to work

1. Read this brief, `docs/content/`, and `docs/inspo/`. Then **produce a plan and wait for my approval** before writing code.
2. Build `main` (foundation) first, stop, and report. POC branches only after I review the foundation.
3. Small, focused commits with clear messages.
4. Flag assumptions and open questions in the plan rather than silently deciding them.

## 12. Definition of done (per branch)

- `pnpm build` passes with no type errors; `pnpm lint` clean
- Seed script populates a fresh database end-to-end
- Admin can edit an item, a category, and the homepage, and see it on the site
- Works at 375px, 768px, and 1280px with no horizontal scroll; checked in a real mobile viewport
- Order buttons resolve per the fallback chain; missing links hide gracefully
- No console errors; Lighthouse mobile performance and accessibility in the 90s on the menu page
- A short `README` section on how to run it and what this branch is trying out

## 13. Open questions for the client

- Exact DoorDash and Uber Eats store URLs; willingness to collect item-level links
- Are they on DoorDash Storefront or Uber's order.store?
- Show prices on the site or not (platform prices differ and change)
- Full menu, hours, phone, Google Maps link, logo files and brand fonts from the rebrand
- Better photography planned? (affects how hero-heavy we can go)
- Who edits the CMS day to day, and how often the menu changes
- Arabic version wanted?
