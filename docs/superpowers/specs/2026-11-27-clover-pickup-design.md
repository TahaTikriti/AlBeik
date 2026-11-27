# Online pickup ordering with Clover: design

Date: 2026-11-27. Builds on the partner's proof of concept, branch `codex/clover-pickup-spike` (commit 0a30f92) and its `docs/clover-pickup-handoff.md`.

## Why

AlBeik runs on Clover (a Station Duo in the shop). Today every "Order" button on AlBeik.us sends people to DoorDash or Uber Eats: a second app, marked-up prices and 15–30% commission per order. The owner wants customers to order pickup **on AlBeik.us itself**, in **three steps at most**, with the order landing in Clover and the kitchen like any counter order.

## Goals

- Order pickup without leaving AlBeik.us: menu → bag & pay → confirmation.
- Prices, sold-out status, extras and tax come from Clover, so the site always matches the register.
- Each checkout produces exactly one itemized Clover order and one payment, and a kitchen ticket.
- Card details never touch our servers (Clover's hosted card fields only).
- Apple Pay / Google Pay so step 2 can be one tap on a phone.

## Non-goals (this version)

- Delivery. The DoorDash / Uber Eats buttons stay for delivery. A DoorDash Drive or Uber Direct hookup is a later project.
- Customer accounts, saved cards, loyalty, reorder history.
- Ordering ahead for a later time, or ordering while closed.
- Catering orders online (catering stays call-to-order).

## Anti-goals (a failure even if it "works")

- The customer bounces to another site or app at any point.
- An order is paid but the kitchen never sees it.
- A customer is charged twice, or charged without an order.
- Menu and dish pages get slower or heavier on phones (see the motion/perf rules already in place).

## Approaches considered

| | Approach | Verdict |
|---|---|---|
| **A** | AlBeik's own bag and checkout; Clover hosted card fields (iframe) inside our page; server creates an itemized Clover order and pays that order. | **Chosen.** Only option that keeps the customer on the site and gives the kitchen an itemized ticket. Proven in the sandbox by the spike (`/order/pickup-card-spike`). |
| B | Our bag, then redirect to Clover Hosted Checkout. | Rejected. Leaves the site, and Hosted Checkout doesn't use Clover inventory, so the payment and the kitchen order don't line up (the spike confirmed this). |
| C | Link to AlBeik's existing Clover Online Ordering storefront (albeik-kansas-city.cloveronline.com, currently paused). | Rejected as the product, since it's a second site with Clover's look. Kept as an emergency fallback the owner can switch on. |

## The customer flow (three steps)

```
1  MENU     /menu and dish pages: "Add" on each dish → small sheet for size/combo/extras
            → sticky "View bag (2) · $24.30" bar on phones, bag panel on desktop
2  BAG+PAY  one screen: bag lines (edit qty) · name · phone ·
            [ Apple Pay / Google Pay ] · or card (number, expiry, CVV, ZIP) · [ Pay $26.24 ]
3  DONE     "Order #142 is in. Ready around 6:40 PM." · address + map link · tap to call
```

Decisions inside the flow (my calls, open to correction):

- **Add to bag lives on the real menu**, not on a separate pickup page. The spike's standalone page with 6 dishes was a test harness; customers already browse `/menu`. Dishes not mapped to Clover show no Add button (they can still order those by phone or via the apps).
- **Bag and payment are one screen.** The spike has bag → "Review checkout" → checkout; that becomes one page.
- **Wallet button first, card fields below.** Clover's iframe supports Apple Pay and Google Pay. Apple Pay needs domain verification in the Clover dashboard.
- **Fewest card fields Clover accepts.** Drop "name on card" and billing street unless the merchant's Clover fraud settings require them; keep ZIP.
- **Phone is required** (staff can call about a problem). Email is optional, for a Clover receipt. Wallet payments fill these in where possible.
- **Ready time** = now + prep minutes (Site settings, default 20).
- **When closed**, Add buttons stay but the bag says "We open at 11 AM" and Pay is off. Uses the existing Site settings hours and timezone.
- **Owner switch:** Site settings → Ordering → "Online pickup on/off". Off sends Pickup buttons back to the apps (and optionally to the Clover storefront link the spike already added).

## How it works

**Menu link to Clover.** Each MenuItems entry gets a Clover item ID, and each size/combo/extra maps to a Clover item variant or modifier. These are admin fields, filled once by a matching script (by name) and corrected by hand. This replaces the spike's `CLOVER_SANDBOX_PICKUP_MAPPING` env JSON. For mapped dishes, Clover is the price source: the Add sheet and checkout read live Clover prices, and the admin tool "Link dishes to Clover and update prices" copies Clover prices into the CMS so the static menu pages agree. Menu pages stay static, so they stay fast. The CMS price stays as the fallback for unmapped dishes.

**Quote → order → pay.** Reuse the spike's server flow (`src/lib/pickup-card/`):

1. Re-quote the bag against Clover (atomic order checkout). Reject stale prices, sold-out items and invalid extras, and keep the bag.
2. Create the itemized Clover order (pickup order type, customer name and phone in the note).
3. Verify it, then pay that order ID with the card token through the Ecommerce API.

Decline → fresh card fields with the bag kept, as in the spike.

**Order records.** Replace the spike's local-file journal (it won't work on Vercel) with a Payload collection **Online orders** in the existing Neon database: attempt ID (unique), status, Clover order and payment IDs, total, name, phone, timestamps, print status. It is read-only in the admin so the owner can see today's web orders. Retries look up the attempt first, so one attempt can never create two orders or two charges. Uncertain outcomes go to "needs review" and are never retried blindly.

**Kitchen.** After payment, request a print through Clover (`print_event`). The confirmation page never shows print status to the customer. A failed or unconfirmed print marks the record "print unconfirmed" in the admin.

**Secrets and abuse.** Clover keys live only in Vercel env vars (the repo is public). The pay and quote endpoints get rate limits per IP and per attempt, plus bot protection, against card testing. Review the live merchant's Clover fraud settings (CVV/ZIP checks).

## Launch gates (all must pass before the Pickup button switches over)

The code is built and checked in preview mode. Online pickup shows only where **Site settings → Online pickup on the website** is on *and* that deployment has `PICKUP_MODE` set, so the setting can be turned on early: customers see nothing new until step 6.

1. **Sandbox keys in Vercel (Preview environment only):** `PICKUP_MODE=clover`, `CLOVER_ENV=sandbox`, `CLOVER_MERCHANT_ID`, `CLOVER_PUBLIC_KEY`, `CLOVER_PRIVATE_KEY`, `CLOVER_API_TOKEN`, `CLOVER_PICKUP_ORDER_TYPE_ID`. Never in the repo. Turn on **Site settings → Online pickup on the website** (production stays off: it has no `PICKUP_MODE` yet).
2. **Full sandbox run on a preview deployment:** a paid order, a declined card then a retry, and a refresh mid-payment. Each must leave exactly one order and one charge in the sandbox dashboard. Also Google Pay in Chrome with a test card.
3. **Apple Pay domain verification:** register `albeik.us` for Apple Pay in the Clover dashboard (Clover's iframe Apple Pay guide names the screen) and serve the domain-association file it gives under `public/.well-known/`. Then pay once with Apple Pay in Safari.
4. **Order alert email:** `RESEND_API_KEY` and `ORDER_ALERT_FROM` (a sender on a domain verified in Resend) in Vercel; fill **Site settings → Email new orders to**. Place a preview order and confirm the email arrives.
5. **On-site print test before launch:** at the shop, during opening hours, with the live keys on a preview deployment (`CLOVER_ENV=production`), place one real small order with an extra. Check the Station Duo prints a correct kitchen ticket automatically and the admin **Web orders** screen shows "Printed". Refund it in Clover. If it doesn't print, stop here and fix printing. The spike could not prove automatic printing (sandbox: "default printing device is missing").
6. **Go live:** the same live `CLOVER_*` values plus `CLOVER_ENV=production` and `PICKUP_MODE=clover` in Vercel **Production**, then redeploy. The header's Pickup, the order sheet and the menu's Add buttons switch over together. To switch off instantly, turn the Site setting off: the app links come back at once.
7. **Staff know the fallback:** web orders appear in the Clover Orders app; the admin **Web orders** screen (sound on) lists today's orders; "Print it from Clover Orders" means the ticket did not print.
8. **Phone check and speed:** all three steps at phone width on a real phone. Lighthouse mobile on `/menu` three times, inside the current 92–97 band.

## Calls settled after review (mine, open to correction)

- **Deal prices on linked dishes:** Clover's price is what the site shows and charges. The CMS `dealPrice` (crossed-out price + "Deal" sticker) is hidden for dishes linked to Clover; a deal on those dishes is set in Clover. Unlinked dishes keep today's behaviour.
- **"Show prices" switch:** when online pickup is on, linked dishes always show their price (you can't sell without one). The switch still governs unlinked dishes.

## Owner decisions (2026-11-27)

The owner approved this design and said "go with what you recommend", including the admin dashboard and payment integration.

- **Kitchen backup is built from the start.** Every paid web order shows on a live **Web orders** screen in the admin: newest first, a sound and a highlight for new orders, and a "Printed in kitchen? yes/unconfirmed" column. It is also reachable from the admin dashboard. An email alert to the shop goes out once an email provider key and an address are set in Site settings → Ordering. It stays off until then, because no email sender is configured today. Staff print unconfirmed orders from the Clover Orders app. A failed automatic print on the Station Duo therefore doesn't block launch, but the on-site test still has to show the order arrives in Clover with the right items.
- **Live menu setup in Clover is unknown.** The partner will send screenshots or a read-only Inventory key. The mapping must therefore handle: one Clover item per dish, or separate Clover items per size/combo; modifier groups with min/max (required choices like "pick a side"); and paid extras. Dishes whose mapping is incomplete simply show no Add button.

## Left to the builder

- How much of the spike's UI and code to reuse vs. restyle (its look already matches the brand).
- Component structure, bag state handling, cache timing for Clover prices.
- Exact rate-limit numbers and which bot-protection tool.
- Live Clover authentication. Clover's docs allow a merchant-generated token for a single-merchant integration, while the handoff assumes OAuth. Confirm with Clover's docs and pick the simpler one that's allowed.

## Needs answers from the owner / Clover (not blockers for building)

- Tips online: yes or no (default no).
- Normal prep time (default 20 min).
- Live merchant: fraud settings, an Ecommerce key pair ("Hosted iFrame + API/SDK"), and Apple Pay domain verification.
- Whether online prices equal in-store prices in Clover.
