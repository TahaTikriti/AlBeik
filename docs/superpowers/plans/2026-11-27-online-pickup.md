# Online Pickup Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers order pickup on AlBeik.us in three steps (menu → bag & pay → confirmation). Each order lands in Clover as one itemized, paid order with a kitchen ticket, and the owner watches web orders live in the admin.

**Architecture:** This builds on the partner's spike (`src/lib/pickup-card/`, already on this branch). The spike's file journal becomes a store interface with a Postgres (Payload) implementation. The spike's single-extra catalog becomes Clover items + modifier groups linked from each CMS dish. The standalone spike page becomes a site-wide bag, "Add" buttons on the real menu, and a one-screen checkout at `/order/pickup` with Clover's hosted card fields and wallet button. Static menu pages stay static: live Clover prices are fetched only by the Add sheet and the checkout.

**Tech Stack:** Next.js 16.4.6 (App Router), Payload 3.90.2 + Postgres (Neon), Clover Platform REST API + Ecommerce API + hosted iframe SDK, Vitest, Tailwind (existing theme tokens).

**Spec:** `docs/superpowers/specs/2026-11-27-clover-pickup-design.md`

## Global Constraints

- The repo is public. No Clover IDs, keys, tokens or merchant IDs in any committed file. Secrets live only in env vars (`.env.local` locally, Vercel in production). Never `git add -A`: `docs/*.docx` and `docs/*.private.md` must stay untracked.
- Card data only ever enters Clover's hosted iframe. Our server sees only the `clv_…` token.
- Money is integer cents everywhere in `src/lib/pickup-card/`. Clover is the source of price, stock, modifiers and tax at quote time.
- One checkout attempt produces at most one Clover order and one charge. Never retry a Clover POST whose outcome is unknown; reconcile by reading.
- Demo mode (no `DATABASE_URL`) must still build and run. With `PICKUP_MODE=preview` it uses the file store and simulated payments.
- Before using any Next.js API you haven't seen in this repo (caching, `after`, route config), read the matching guide in `node_modules/next/dist/docs/` (AGENTS.md).
- Schema changes go through `pnpm migrate:create <name>` against the local Docker DB. Recreate it with `docker run -d --name albeik-cms-check -e POSTGRES_PASSWORD=check -e POSTGRES_DB=albeik -p 55432:5432 postgres:17-alpine`, then run `pnpm migrate && pnpm seed`.
- Copy uses US spelling, the existing `src/theme/copy.ts` voice, and the brand tokens (black/red/white, `--p-green` only for plant labels).
- Phones: no new scroll-driven or blur effects, and menu pages keep their current weight (perf rules memory). The Add sheet's JS loads on first tap, not with the menu.
- Order buttons for delivery keep going to DoorDash / Uber Eats.

## Review Focus

1. **Double tap on Pay, or a refresh mid-payment.** Exactly one Clover order and one charge, and the confirmation still shows. The existing spike tests already cover this; they must keep passing against the new store (Task 2).
2. **A dish with a required choice** ("pick a side", min 1). Add is disabled until it's chosen, and the server rejects a bag line missing it or exceeding a group's max (Task 3).
3. **Ordering near closing time or after hours.** Orders are accepted only until `closes − prepMinutes` in the site's timezone. Closing after midnight counts as the previous day. The bag shows when ordering opens next (Task 4).
4. **A bag saved yesterday** holding a dish that is now sold out, unlinked or re-priced. It restores without that line, shows "1 item is no longer available", and the checkout re-quotes (Tasks 6–7).
5. **Clover slow or down.** The menu still renders, because it's static. The Add sheet and checkout show "Ordering is busy, call us" with the tap-to-call and the delivery-app links, never a blank page (Tasks 6–7).

---

### Task 1: Clover connection config (preview / sandbox / production)

**Files:**
- Modify: `src/lib/pickup-card/config.ts`, `src/lib/pickup-card/payment-clover.ts`, `src/lib/pickup-card/catalog.ts` (only `cloverRead`'s base URL), `.env.example`
- Test: `src/lib/pickup-card/config.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type CloverEnv = 'sandbox' | 'production'
  type CardConfig =
    | { mode: 'preview' }
    | { mode: 'clover'; env: CloverEnv; merchantId: string; publicKey: string;
        privateKey: string; restToken: string; orderTypeId: string }
  getCardConfig(env?: NodeJS.ProcessEnv): CardConfig   // throws CardError(…, 404) when PICKUP_MODE unset
  cloverUrls(env: CloverEnv): { platform: string; ecommerce: string; sdk: string }
  cardClientConfig(config): CardClient                 // CardClient gains `env` and `sdkUrl`
  ```
- `mapping` leaves the config (dish links move to the CMS in Task 4).

- [ ] **Step 1: Write failing tests**

  `config.test.ts`:
  - `PICKUP_MODE` unset → throws with status 404.
  - `PICKUP_MODE=preview` → `{ mode: 'preview' }`.
  - `PICKUP_MODE=clover`, `CLOVER_ENV=production` with all five vars → `mode: 'clover'`, `env: 'production'`.
  - Missing `CLOVER_PRIVATE_KEY` → status 503.
  - `CLOVER_ENV` unset → `'sandbox'`.
  - `cloverUrls('sandbox').platform === 'https://apisandbox.dev.clover.com/v3/merchants/'`, `.ecommerce === 'https://scl-sandbox.dev.clover.com/v1/orders/'`, `.sdk === 'https://checkout.sandbox.dev.clover.com/sdk.js'`.
  - `cloverUrls('production')` → `https://api.clover.com/v3/merchants/`, `https://scl.clover.com/v1/orders/`, `https://checkout.clover.com/sdk.js`.
- [ ] **Step 2:** `pnpm vitest run src/lib/pickup-card/config.test.ts`. Expect FAIL.
- [ ] **Step 3: Implement.** Env names: `PICKUP_MODE`, `CLOVER_ENV`, `CLOVER_MERCHANT_ID`, `CLOVER_PUBLIC_KEY`, `CLOVER_PRIVATE_KEY`, `CLOVER_API_TOKEN`, `CLOVER_PICKUP_ORDER_TYPE_ID`. Replace every hard-coded sandbox host in `payment-clover.ts`, `catalog.ts` and `PickupCardFields.tsx` with `cloverUrls(config.env)` / `client.sdkUrl`. Rename `mode: 'sandbox'` to `mode: 'clover'` across the spike and its tests. Update `.env.example`: drop the `*_SPIKE_*` and `CLOVER_SANDBOX_*` names and document the new ones (names only, with blank values).
- [ ] **Step 4:** `pnpm vitest run src/lib/pickup-card`. All PASS (spike tests updated for the rename).
- [ ] **Step 5: Commit.** `git add src/lib/pickup-card .env.example src/components/order/PickupCardFields.tsx && git commit -m "Pickup: one Clover config for sandbox and production"`

### Task 2: Durable checkout store (Postgres) + Web orders collection

**Files:**
- Create: `src/lib/pickup-card/store.ts` (interface + memory impl), `src/lib/pickup-card/store-payload.ts`, `src/payload/collections/CheckoutSteps.ts`, `src/payload/collections/WebOrders.ts`, migration via `pnpm migrate:create web_orders`
- Modify: `src/lib/pickup-card/payment-store.ts` (becomes the file impl of the interface), `src/lib/pickup-card/payment.ts`, `src/payload.config.ts`
- Test: `src/lib/pickup-card/store.test.ts`; existing `payment.test.ts` switches to `memoryStore()`

**Interfaces:**
- Produces:
  ```ts
  interface CheckoutStore {
    /** Write once. False when this step already exists for the attempt (someone else won). */
    claim(attemptId: string, step: string, value: unknown): Promise<boolean>
    read<T>(attemptId: string, step: string): Promise<T | null>
    /** Upsert the admin-facing summary; best effort, never throws into checkout. */
    summarize(attemptId: string, summary: WebOrderSummary): Promise<void>
  }
  type WebOrderSummary = {
    status: 'pending' | 'paid' | 'declined' | 'review' | 'stopped'
    printStatus: 'requested' | 'unconfirmed' | 'not-requested'
    cloverOrderId?: string; totalCents?: number; pickupName?: string; phone?: string;
    email?: string; lines?: { name: string; quantity: number }[]; readyAt?: string; ipHash?: string
  }
  memoryStore(): CheckoutStore           // tests
  fileStore(root: string): CheckoutStore // dev without DB (today's journal)
  payloadStore(): Promise<CheckoutStore> // when cmsEnabled
  checkoutStore(): Promise<CheckoutStore> // payload when cmsEnabled, else file
  ```
- `submitCardPayment`, `lookupCardPayment` and `reconcileCardPayment` take `(config, store, …)` in place of the directory.
- Collections:
  - `checkout-steps`: `admin.hidden: true`; all access `() => false` (local API uses `overrideAccess`). Fields: `key` (text, unique, `${attemptId}:${step}`), `attemptId` (text, index), `step` (text), `value` (json).
  - `web-orders`: labels "Web order"/"Web orders"; `admin.group: 'Orders'`; read: authenticated; create/update/delete: `() => false`. Fields: `attemptId` (unique), `status` (select), `printStatus` (select), `cloverOrderId`, `totalCents` (number, cell shows dollars), `pickupName`, `phone`, `email`, `lines` (json), `readyAt` (date), `ipHash` (text, hidden). Default sort `-createdAt`. Columns: createdAt, pickupName, totalCents, status, printStatus.

- [ ] **Step 1: Write failing tests** (`store.test.ts`, run against `memoryStore()` and `fileStore(tmpdir)`):
  - `claim` returns true then false for the same step.
  - `read` returns the first value after a losing claim.
  - Twenty concurrent `claim`s of one step → exactly one `true`.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement** the interface and the memory/file stores. Then refactor `payment.ts` to use step names instead of milestone files; the names stay the same (`attempt`, `order`, `paid`, …). Call `store.summarize` after each step that changes status. Swap `payment.test.ts` to `memoryStore()` with no assertion changes.
- [ ] **Step 4:** `pnpm vitest run src/lib/pickup-card`. All PASS, including the existing double-submit and lost-response tests.
- [ ] **Step 5: Implement `payloadStore`.** `claim` = `payload.create({ collection: 'checkout-steps', overrideAccess: true })`. Catch the unique-key violation and return false; rethrow anything else. Register both collections, run `pnpm migrate:create web_orders`, then `pnpm generate:types`.
- [ ] **Step 6: Verify against Docker Postgres.** Add a gated test `store-payload.test.ts`, skipped unless `DATABASE_URL` is set, with the same three cases. Run: `DATABASE_URL=postgres://postgres:check@127.0.0.1:55432/albeik pnpm vitest run src/lib/pickup-card/store-payload.test.ts`. Expect PASS.
- [ ] **Step 7: Commit** the store, collections, migration, `payload-types.ts` and config.

### Task 3: Catalog v2: Clover items + modifier groups with min/max

**Files:**
- Modify: `src/lib/pickup-card/types.ts`, `src/lib/pickup-card/catalog.ts`, `src/lib/pickup-card/checkout.ts`
- Test: `src/lib/pickup-card/catalog.test.ts` (rewrite for the new shapes)

**Interfaces:**
- Consumes: `CardConfig` (Task 1); dish links `{ slug, options: { label: string; cloverItemId: string }[] }` (shape fixed here, filled by Task 4).
- Produces:
  ```ts
  type PickupLink = { slug: string; options: { label: string; cloverItemId: string }[] }
  type CardModifierGroup = { id: string; name: string; min: number; max: number | null;
                             modifiers: { id: string; name: string; priceCents: number }[] }
  type CardOption = { id: string /* Clover item id */; label: string; priceCents: number;
                      available: boolean; stockLimit?: number; groups: CardModifierGroup[] }
  type CardProduct = { slug: string; name: string; description: string | null;
                       image: ImageVM | null; options: CardOption[] }
  type CardLine = { optionId: string; modifierIds: string[]; quantity: number }
  loadCardProducts(config, links: PickupLink[], items: MenuItemVM[]): Promise<CardProduct[]>
  quoteCardBasket(config, products, input: unknown): Promise<{ quote: CardQuote; orderCart }>
  validateModifiers(option: CardOption, modifierIds: string[]): void // throws CardError 409
  ```
- Clover reads: `items?expand=modifierGroups,itemStock&filter=id in (…)` (batched by 100, as now), plus `modifier_groups?expand=modifiers&limit=1000` once per load. Group `minRequired` → `min`, `maxAllowed` → `max` (absent or 0 = no max). Preview mode keeps a fixture menu with one required group ("Choose a side": Fries / Salad, min 1 max 1) and one optional group ("Extras": Extra sauce +$0.75, min 0, no max).

- [ ] **Step 1: Write failing tests:**
  - Required group missing → 409 with "Choose a side".
  - Two picks in a max-1 group → 409.
  - A modifier from another item's group → 409.
  - Valid line → `orderCart.lineItems[n].modifications` lists each modifier with its Clover price.
  - Unit price = item + modifiers.
  - An item with `minRequired` > 0 now stays on sale (this reverses the spike's rule).
  - Keep the spike's cases: price change re-quotes, sold-out rejected, stock across lines, Clover outage → 503.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.** Error copy for a missing required group: `Choose ${group.name.toLowerCase()} for ${option.label}.`
- [ ] **Step 4:** `pnpm vitest run src/lib/pickup-card`. PASS.
- [ ] **Step 5: Commit.**

### Task 4: CMS fields, view models, opening-hours gate

**Files:**
- Modify: `src/payload/collections/MenuItems.ts`, `src/payload/globals/SiteSettings.ts` (Ordering tab), `src/lib/data/types.ts`, `src/lib/data/mappers.ts`, `src/lib/data/demo.ts` + `src/seed/content.ts` (preview links for 3 dishes), `src/lib/hours/index.ts`
- Create: migration via `pnpm migrate:create online_pickup`
- Test: `src/lib/hours/pickup.test.ts`, `src/lib/data/mappers.test.ts` (new or extend)

**Interfaces:**
- CMS:
  - MenuItems gets a collapsible "Online ordering" with `pickupOptions` (array, max 6, fields `label` text required + `cloverItemId` text required, pattern `^[A-Z0-9]{13}$`).
  - SiteSettings → Ordering gets:
    - `onlinePickup`: checkbox, default false, label "Online pickup on the website".
    - `prepMinutes`: number, default 20, min 5, max 90.
    - `orderAlertEmail`: email, optional.
- Produces:
  ```ts
  MenuItemVM.pickup: { options: { label: string; cloverItemId: string }[] } | null
    // null unless onlinePickup is on AND the dish has ≥1 option
  SiteVM.pickup: { enabled: boolean; prepMinutes: number } // enabled = onlinePickup && PICKUP_MODE set
  pickupWindow(hours: OpeningHours[], timeZone: string, prepMinutes: number, now: Date):
    { open: true; lastOrderAt: Date } | { open: false; opensAt: Date | null }
  ```
- Display price rule (spec "Calls settled after review"): when `item.pickup` is set, `dealPrice` maps to null and `price` shows even if `showPrices` is off.

- [ ] **Step 1: Write failing tests:**
  - `pickupWindow`, with Mon–Thu 11:00–21:00 Chicago and prep 20:
    - Mon 20:39 → open.
    - Mon 20:41 → closed, `opensAt` Tue 11:00.
    - Mon 10:59 → closed, `opensAt` same day 11:00.
    - Fri–Sun 11:00–02:00 row, Sat 01:00 → open (belongs to Fri).
    - Empty hours → closed, `opensAt: null`.
  - Mapper: `pickup` is null when `onlinePickup` is false; with links, `dealPrice` → null and `price` stays shown when `showPrices` is false.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.** Timezone math via `Intl.DateTimeFormat` (no new dependency). Run `pnpm migrate:create online_pickup` and `pnpm generate:types`.
- [ ] **Step 4:** `pnpm test && pnpm typecheck`. PASS.
- [ ] **Step 5: Commit.**

### Task 5: "Link dishes to Clover" admin tool

**Files:**
- Create: `src/lib/pickup-card/clover-match.ts`, `src/app/(payload)/api/clover-sync/route.ts`, `src/payload/admin/CloverSync.tsx` (button + result list, shown on the Site settings Ordering tab as a `ui` field)
- Test: `src/lib/pickup-card/clover-match.test.ts`

**Interfaces:**
- Produces:
  ```ts
  matchDishes(dishes: { id: number; name: string; hasLinks: boolean }[],
              items: { id: string; name: string; price: number }[]):
    { linked: { dishId: number; options: { label: string; cloverItemId: string; priceCents: number }[] }[];
      unmatched: string[] /* dish names */ }
  ```
  - Normalized names compare lowercase with punctuation and "the" removed. `"<Dish> Combo"` becomes an option labeled "Combo"; the exact name match is labeled by category ("Sandwich" for the Sandwiches section, otherwise "Regular"). Dishes that already have links are skipped.
- `POST /api/clover-sync` (admin session required; 401 otherwise):
  - Reads all Clover items.
  - Writes `pickupOptions` for newly matched dishes.
  - Copies Clover prices into `price` / `comboPrice` for every linked dish, which revalidates pages through the existing hooks.
  - Returns `{ linked: number; pricesUpdated: number; unmatched: string[] }`.

- [ ] **Step 1: Write failing tests:**
  - "Chicken Tawouk Sandwich" + "Chicken Tawouk Sandwich Combo" → two options, Sandwich/Combo.
  - "AlBeik Smashed Burger" matches "Albeik smashed burger".
  - Unknown dish → in `unmatched`.
  - Dish with links → untouched.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement** the matcher, route and admin button. Button copy: "Link dishes to Clover and update prices". The result lists unmatched dishes so the owner can paste item IDs by hand.
- [ ] **Step 4:** `pnpm vitest run src/lib/pickup-card/clover-match.test.ts && pnpm typecheck`. PASS.
- [ ] **Step 5: Commit.**

### Task 6: Bag + Add buttons on the real menu

**Files:**
- Create: `src/components/order/bag/bag.ts` (pure reducer + storage), `src/components/order/bag/BagProvider.tsx`, `src/components/order/bag/AddButton.tsx`, `src/components/order/bag/AddSheet.tsx` (lazy), `src/components/order/bag/BagBar.tsx`, `src/app/(frontend)/order/pickup/options/route.ts`
- Modify: `src/app/(frontend)/layout.tsx` (wrap in `BagProvider`), `src/components/menu/MenuItemCard.tsx`, `src/components/menu/MenuItemRow.tsx`, `src/views/ItemView.tsx`, `src/components/shell/StickyOrderBar.tsx`, `src/theme/copy.ts`
- Remove: `src/components/order/PickupCardMenu.tsx` (its Combo chip styling moves into `AddSheet`)
- Test: `src/components/order/bag/bag.test.ts`

**Interfaces:**
- Consumes: `CardLine`, `CardProduct` (Task 3), `MenuItemVM.pickup`, `SiteVM.pickup` (Task 4).
- Produces:
  ```ts
  type BagLine = CardLine & { slug: string; name: string; label: string; unitCents: number; modifierNames: string[] }
  bagReducer(state: BagLine[], action:
    | { type: 'add'; line: BagLine } | { type: 'quantity'; index: number; quantity: number }
    | { type: 'remove'; index: number } | { type: 'clear' } | { type: 'replace'; lines: BagLine[] }): BagLine[]
  restoreBag(raw: string | null): BagLine[]   // drops malformed lines; max 50 lines, qty 1–20
  useBag(): { lines: BagLine[]; count: number; subtotalCents: number; dispatch: Dispatch }
  GET /order/pickup/options?slug=<slug> → CardProduct | 404 (not linked) | 503 (Clover down); Cache-Control: no-store
  ```
- Behavior:
  - Adding an identical line (same option + same modifiers) merges quantities.
  - The bag persists in `localStorage` key `albeik.bag.v1` inside try/catch.
  - Cards/rows/item page show `AddButton` when `item.pickup && site.pickup.enabled`. Otherwise they show today's `OrderButton`.
  - `AddButton` opens `AddSheet`:
    - option chips, then one section per modifier group ("Required" or "Optional · up to N")
    - quantity
    - "Add · $X", disabled until required groups are filled
  - On phones, `BagBar` replaces the site StickyOrderBar when the bag is non-empty: "View bag (n) · $x" → `/order/pickup`.

- [ ] **Step 1: Write failing tests** (`bag.test.ts`):
  - Identical add merges quantities.
  - Same option with different modifiers → two lines.
  - Quantity capped at 20.
  - `restoreBag('garbage')` → `[]`.
  - `restoreBag` drops a line with a non-string modifier.
  - `subtotalCents` sums `unitCents × quantity`.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement** the reducer, provider, route, button, sheet and bar. The sheet is a `next/dynamic` import, so menu pages ship only `AddButton`. A 503 from `/options` shows the busy message with call/app links (Review Focus 5).
- [ ] **Step 4:** `pnpm test && pnpm typecheck && pnpm lint`. PASS.
- [ ] **Step 5: Browser check.**
  - Run `PICKUP_MODE=preview pnpm dev`, with the local DB seeded and Online pickup ticked.
  - On `/menu` at 375px and 1280px: add the preview dish with a required side, the bag bar appears, and a reload keeps the bag.
- [ ] **Step 6: Commit.**

### Task 7: One-screen checkout, wallet button, confirmation

**Files:**
- Create: `src/views/PickupCheckoutView.tsx`, `src/app/(frontend)/order/pickup/quote/route.ts`, `src/app/(frontend)/order/pickup/pay/route.ts`, `src/app/(frontend)/order/pickup/status/route.ts`, `src/app/(frontend)/order/pickup/done/page.tsx`
- Modify: `src/app/(frontend)/order/[mode]/page.tsx` (pickup + `site.pickup.enabled` → `PickupCheckoutView`; else today's `OrderView`; pickup becomes dynamic), `src/components/order/EmbeddedPickup.tsx` → rename `PickupCheckout.tsx` (bag lines from `useBag`, no product list), `src/components/order/PickupCardFields.tsx` (fields: CARD_NUMBER, CARD_DATE, CARD_CVV, CARD_POSTAL_CODE only + wallet button), `src/components/order/PickupWaiting.tsx` (moves to `/order/pickup/done`), `src/lib/pickup-card/checkout.ts` (`readPayment` adds phone/email; quote/pay refuse when closed or disabled)
- Test: `src/lib/pickup-card/checkout.test.ts`

**Interfaces:**
- Consumes: `checkoutStore()` (Task 2), `quoteCardBasket` / `loadCardProducts` (Task 3), `pickupWindow` (Task 4), `useBag` (Task 6).
- Produces:
  ```ts
  readPayment(body, config, request): { attemptId; pickupName; phone: string /* E.164 +1XXXXXXXXXX */;
                                        email: string | null; source; fingerprint; clientIp }
  assertOrderingOpen(site: SiteVM, now: Date): void // CardError 409 code 'closed' with "We open at …"
  ```
- Pay body: `{ attemptId, quoteId, lines: CardLine[], pickupName, phone, email?, source }`.
- Clover order note: `Pickup for <name> · <phone> · ready ~<h:mm a>`, and the title `Pickup · <name>`. `payOrder` sends the customer's email when given; otherwise it omits the field (drop the spike's fixed test address).
- Wallet: mount Clover's payment-request button (Apple Pay / Google Pay) above the card fields. Follow docs.clover.com "Apple Pay" and "Google Pay" iframe pages for the exact element name and events. The wallet's token goes through the same `/pay`. Hide the button when the SDK reports no wallet.
- Confirmation copy: "Order #<last 4 of Clover id> is in." / "Ready around <h:mm a>." plus the address, map link and tap-to-call. It never shows print status.

- [ ] **Step 1: Write failing tests** (`checkout.test.ts`):
  - Phone `(816) 216-1703` → `+18162161703`; `12345` → 400.
  - Empty email → null; bad email → 400.
  - Name over 80 characters → 400.
  - The fingerprint changes when the phone changes.
  - `assertOrderingOpen` throws code `closed` outside the window and when `site.pickup.enabled` is false.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement** the routes (reusing `checkoutResponse` / `readCheckoutBody`), the view, the field changes and the done page. Remove the spike's "Review checkout" step: bag lines, details and payment sit on one page, with "Pay $X" disabled until a quote is fresh.
- [ ] **Step 4:** `pnpm test && pnpm typecheck && pnpm lint`. PASS.
- [ ] **Step 5: Browser check** in preview mode at 375px and 1280px:
  - add → `/order/pickup` → pay → done page
  - decline path via the preview's "decline" fixture source
  - closed state, by temporarily setting hours that exclude now
- [ ] **Step 6: Commit.**

### Task 8: Abuse limits and order alerts

**Files:**
- Create: `src/lib/pickup-card/limits.ts`, `src/lib/pickup-card/alert.ts`
- Modify: `src/lib/pickup-card/payment.ts` (after `paid`: claim step `alerted`, then send), `src/app/(frontend)/order/pickup/pay/route.ts`, `.env.example` (`RESEND_API_KEY`, `ORDER_ALERT_FROM`)
- Test: `src/lib/pickup-card/limits.test.ts`, `src/lib/pickup-card/alert.test.ts`

**Interfaces:**
- Produces:
  ```ts
  checkPayLimit(store: CheckoutStore, ipHash: string, now: Date): Promise<void>
    // CardError 429 "Too many payment attempts. Please call us." when ≥5 attempts from ipHash in 10 min
  hashIp(ip: string, secret: string): string // sha256(PAYLOAD_SECRET || 'dev' + ip), hex, first 32
  sendOrderAlert(order: WebOrderSummary, to: string | null, fetchImpl = fetch): Promise<'sent' | 'off' | 'failed'>
  ```
- `CheckoutStore` gains `countRecent(ipHash: string, since: Date): Promise<number>`. The memory and file stores implement it naively; Payload counts `web-orders` by `ipHash` and `createdAt`.
- Alert: `off` unless both `RESEND_API_KEY` and `orderAlertEmail` are set. Sent at most once per attempt (claim `alerted`). Subject `New pickup order · <name> · $<total>`. The body lists the lines, ready time and phone. It never blocks or fails the checkout (wrap in `after()`, then check the Next docs).

- [ ] **Step 1: Write failing tests:**
  - 5 attempts → 6th throws 429; attempts older than 10 min don't count.
  - `sendOrderAlert` → `off` without a key; posts once to `https://api.resend.com/emails` with the key; a non-2xx response → `failed` without throwing.
  - A double `finish()` of a paid attempt alerts once.
- [ ] **Step 2:** Run. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** `pnpm vitest run src/lib/pickup-card`. PASS.
- [ ] **Step 5: Commit.**

### Task 9: Admin: live Web orders screen + dashboard tile

**Files:**
- Create: `src/payload/admin/WebOrdersView.tsx` (server shell) + `src/payload/admin/WebOrdersLive.tsx` (client), styles in `src/payload/admin/dashboard.scss`
- Modify: `src/payload.config.ts` (`admin.components.views.webOrders = { Component: '/payload/admin/WebOrdersView#WebOrdersView', path: '/web-orders' }`), `src/payload/admin/Dashboard.tsx` (tile "Web orders today: n · $total" → `/admin/web-orders`, and a quick action), `pnpm generate:importmap`

**Interfaces:**
- Consumes: the `web-orders` collection (Task 2).
- Live screen:
  - Today's orders (site timezone), newest first, polled every 15 s via `GET /api/web-orders?where[createdAt][greater_than]=…&sort=-createdAt&depth=0` (cookie auth).
  - Columns: time, name, phone (tap to call), items, total, status, kitchen ("Printed" / "Print it from Clover Orders").
  - A new paid order flashes red and plays a short chime (`/sounds/new-order.mp3`, generated or royalty-free, under 30 KB). A "Sound on" toggle is needed because browsers block audio until a click.
  - Orders in `review` show "Check this order in Clover before making it".

- [ ] **Step 1:** Implement both files and register the view. Run `pnpm generate:importmap`.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint`. PASS.
- [ ] **Step 3: Browser check.**
  - Log in to `/admin` locally and open Web orders.
  - Place a preview order in another tab; it appears within 15 s with the chime (after "Sound on").
  - The dashboard tile counts it.
- [ ] **Step 4: Commit.**

### Task 10: Wire site-wide ordering, remove spike scaffolding

**Files:**
- Modify: `src/lib/order/index.ts` (`linksForMode(links, 'pickup', { online })` returns `[]` when online, so callers send pickup to `/order/pickup`), `src/lib/order/order.test.ts`, `src/components/order/OrderMenu.tsx`, `src/components/order/OrderSheet.tsx`, `src/components/order/OrderButton.tsx` (the Pickup choice links to `/order/pickup` when online)
- Delete: `src/app/(frontend)/order/pickup-spike/`, `src/app/(frontend)/order/pickup-card-spike/`, `src/lib/pickup-spike/` (move `MAX_ITEM_QUANTITY = 20` into `src/lib/pickup-card/types.ts`), `src/components/order/PickupBasket.tsx`, `src/components/order/pickupCardClient.ts` (its helpers move to `bag/`), `vercel.json` (the spike-branch deploy switch)
- Modify: `docs/clover-pickup-handoff.md`, adding a top note that the spike is superseded by this plan.

- [ ] **Step 1: Update `order.test.ts`:**
  - Online pickup → the header's Pickup goes to `/order/pickup`.
  - Online off → today's behavior.
  - Delivery is unchanged in both.
- [ ] **Step 2:** Run. Expect FAIL. Implement. Run `pnpm test && pnpm typecheck && pnpm lint`. PASS.
- [ ] **Step 3:** `grep -rn "pickup-card-spike\|pickup-spike\|PICKUP_CARD_SPIKE" src .env.example` returns nothing.
- [ ] **Step 4: Commit.**

### Task 11: Whole-branch verification

- [ ] `pnpm test && pnpm typecheck && pnpm lint && pnpm build` (demo mode, no env). All pass. `/order/pickup` falls back to the app links.
- [ ] `PICKUP_MODE=preview` against the local Docker DB: full flow at 375px and 1280px, the admin Web orders screen, and the closed state.
- [ ] Lighthouse mobile on `/menu`, run 3×, within the current 92–97 band.
- [ ] Sandbox run (`PICKUP_MODE=clover`, `CLOVER_ENV=sandbox`) needs the partner's sandbox values in `.env.local`. Paid order + decline/retry + refresh mid-payment, each producing one order and one charge in the sandbox. If the values aren't available, say so and leave this unchecked.
- [ ] Write the launch checklist into the spec's "Launch gates" (on-site Station Duo test, live keys in Vercel, Apple Pay domain verification, turn on Site settings → Online pickup).
