# AlBeik pickup checkout handoff

## Handoff to Hive

This is AlBeik’s local proof of concept for direct pickup. It verified on-site checkout, one Clover sandbox payment on the same itemized order, sync to a virtual Clover register, and a manually printed kitchen ticket. The implementation and test cases are available as reference. Hive can choose the production architecture and how much of the spike to reuse.

### Approaches tried

| Approach | What we built or checked | Result |
| --- | --- | --- |
| Clover Online Ordering link | Added a configurable [Clover pickup link](../src/payload/globals/SiteSettings.ts) to the site’s ordering settings. The link opens Clover’s full merchant storefront for menu selection and payment. We also looked at Clover’s linked and branded storefront options. | The authenticated dashboard showed the [AlBeik storefront](https://albeik-kansas-city.cloveronline.com), with pickup configured and ordering paused at the time. The local website linked to it. An unpublished red accent was saved in Clover, and the logo upload stalled. We did not place an order through the storefront. Website routing and marketplace fallback are covered by tests. |
| AlBeik bag with Clover Hosted Checkout | Built [`/order/pickup-spike`](../src/app/(frontend)/order/pickup-spike/page.tsx) with a server-side basket quote, a local dry run, and an optional [Clover sandbox checkout-session request](../src/lib/pickup-spike/clover-sandbox.ts). Considered ordinary Clover payment links for staff-entered orders and per-basket Hosted Checkout links for the site. | The dry run and quote validation were exercised on desktop and mobile. A paid redirect checkout and an itemized POS sync through this route were not verified. A redirect implementation would need to reconcile Clover’s checkout session and payment with the itemized kitchen order. |
| AlBeik checkout with embedded Clover fields | Built [`/order/pickup-card-spike`](../src/app/(frontend)/order/pickup-card-spike/page.tsx) with AlBeik’s bag, checkout, and waiting page. Clover hosted fields tokenize the card, and the server uses the token to pay the same Clover order. | Verified in the sandbox through payment, virtual POS sync, and manual kitchen printing. Automatic remote printing failed with a missing default printing device. |

### How the embedded spike worked

- **Menu and photos.** The site supplies photos and descriptions. A mapping links published AlBeik menu slugs and variants to Clover item and modifier IDs. Clover supplies prices, stock, available modifiers, and taxes. The server revalidates the cart and total before payment. The sandbox used six menu options, an Extra sauce modifier, an 8% test tax, and the **AlBeik Test Pickup** order type. The live menu has yet to be mapped and checked.
- **Payment and order sync.** The server calculates the Clover cart, creates an itemized Platform API order, checks the order type, lines, modifiers, and total, then pays that order ID through the Ecommerce API. Clover hosted fields handle raw card entry. The waiting page checks the same attempt after a refresh. On a decline, the bag and pickup name survive, Clover provides fresh card fields, and the customer can call the restaurant. The proof of concept stores attempt milestones in a local filesystem journal. [Catalog and quoting](../src/lib/pickup-card/catalog.ts) · [Payment orchestration](../src/lib/pickup-card/payment.ts) · [Waiting page](../src/components/order/PickupWaiting.tsx)
- **Kitchen and recovery.** The website requests a kitchen ticket after payment is confirmed. It shows a paid confirmation even when the print is unconfirmed. The emulator’s Orders app received the itemized order and payment. A manual re-fire printed the correct kitchen ticket and synced the item’s **Printed** status. Clover’s own remote test and the direct Platform Print API call both failed while the sandbox had no default firing device. No production order or payment was used.

### Agent work and review findings

| Workstream | Contribution and findings |
| --- | --- |
| Payload settings | Added the optional Clover pickup link, shared validation for supported URLs, generated Payload types, and generated a nullable-column migration without connecting to a database. The public link opens the full Clover storefront. [URL validation](../src/lib/order/clover.ts) · [Payload settings](../src/payload/globals/SiteSettings.ts) |
| Pickup entry points | Audited the home and visit pages, header, sticky bar, menu cards and rows, item pages, and `/order/pickup`. Recommended the shared pickup resolver with Clover when configured and DoorDash and Uber Eats for delivery and fallback pickup. The public-listing review did not locate an active Clover link. The merchant dashboard later identified the paused storefront. [Ordering resolver](../src/lib/order/index.ts) · [Routing tests](../src/lib/order/order.test.ts) |
| Checkout design | Explored the existing AlBeik menu cards, colors, typography, and Clover’s hosted-field styling. The integrated UI uses dark branded controls and a **Combo** button that expands itself on hover, keyboard focus, or selection. The selected state stays expanded for touch users. [Menu variants](../src/components/order/PickupCardMenu.tsx) · [Hosted card fields](../src/components/order/PickupCardFields.tsx) |
| Catalog sync | Implemented the inventory mapping and server quote. Five targeted tests cover price changes, sold-out items, invalid or unavailable extras, stock across customized units, and preview or provider failure. [Catalog tests](../src/lib/pickup-card/catalog.test.ts) |
| Order sync and payment review | Reviewed Clover’s order, payment, and print contracts. The review identified that a decline can arrive as HTTP 400, a pre-payment validation error could strand the waiting page, and an uncertain order create or failed POS lookup could leave an order needing reconciliation. The integrated flow checks Clover’s explicit decline code, redirects recoverable validation back to the bag, and preserves the attempt for review when the order cannot be verified. [Payment implementation](../src/lib/pickup-card/payment.ts) · [Payment tests](../src/lib/pickup-card/payment.test.ts) |

### Loading, success, and error states

| Scenario | Behavior in the spike | Evidence |
| --- | --- | --- |
| Initial route, bag quote, secure fields, or payment in progress | Uses the branded **Loading pickup details…**, **Checking prices and availability…**, **Loading secure card fields…**, and **Submitting your payment…** states. The relevant actions are disabled while processing, and the progress indicator respects reduced motion. | Implemented in the [route loader](../src/app/(frontend)/order/pickup-card-spike/loading.tsx), [checkout](../src/components/order/EmbeddedPickup.tsx), and [shared progress component](../src/components/order/PickupProgress.tsx). |
| Sold out, changed price, invalid modifier, or quote mismatch | Keeps the bag for review. The server blocks payment on stale or invalid selections and re-quotes the current valid bag, including taxes. | Sandbox price and stock checks plus catalog and payment tests. |
| Secure script unavailable or card input invalid | Pay stays disabled until Clover’s fields are ready. Hosted validation displays field messages. The site keeps the bag and pickup name when the fields need to load again. | Browser test with the payment script blocked. The sandbox verification challenge also yielded a return to checkout with empty card fields and the bag and pickup name intact. Clover had no order or payment from that attempt. |
| Still checking, timed-out status check, or refreshed page | The waiting page resumes the same attempt after refresh. It polls in a bounded loop and offers **Check payment status** if still pending. The customer sees guidance to check that payment before paying again. | Refresh checked in the browser. Simulated lost responses and payment rate limits verified in tests. |
| Declined card | **Try another card** restores the saved bag and pickup name, re-quotes, and loads fresh Clover card fields. A tap-to-call AlBeik fallback is available. | Observed a real sandbox decline and a successful retry, `1058BHCHW03KP`. |
| Order rejected before payment, ambiguous order creation, or POS lookup failure | A definite rejection shows a recoverable checkout error with no payment submitted. Uncertain creation or order lookup produces a review state and keeps the attempt, plus the Clover ID if known. Hive should ensure a support reference is visible when Clover never returns an order ID. | Mocked provider and recovery tests. |
| Paid, print requested, or print unconfirmed | Confirmation shows the paid order ID and total. The website reports **Printing requested** for an acknowledged request and **Print unconfirmed** for an ambiguous or failed print. The Clover Orders app is the tested manual fallback. | Paid browser flow, sandbox POS, verified kitchen ticket PNG, and mocked print failures. |

The initial design feedback led to dark styled payment fields, visible inline labels and validation, and combo details inside the selector itself. Visual QA covered desktop and mobile. Hardee’s and Chipotle were provided as ordering UX references. [Checkout field styling](../src/components/order/PickupCardFields.tsx)

### What the production implementation should cover

1. **Checkout and menu.** Keep the pickup experience on AlBeik’s site with the existing design system. Verify the live menu mapping, photo coverage, prices, taxes, sold-out changes, modifiers, and pickup hours. Cover card validation, loading, declines, abandoned verification, and re-entry without losing the bag or pickup information.
2. **Payment and reconciliation.** Verify that each checkout produces one Clover order and one payment. Use durable state that works across production instances. Reconcile uncertain outcomes before retrying, keep secrets server-side, review Clover’s actual fraud settings, and add checkout abuse limits. Verify the refund and staff recovery flows.
3. **Kitchen delivery.** On the restaurant’s Station Duo, verify the default firing device and online kitchen order printer. Confirm one paid website order produces the expected automatic kitchen ticket, including modifiers. Have staff verify the manual fallback for an unconfirmed print. [Clover Print API](https://docs.clover.com/dev/docs/printing-orders-rest-api)

### Clover access and token setup

The existing worktree has the sandbox configuration in `.env.local`. The public iFrame key, Ecommerce private key, Platform REST test token, sandbox merchant ID, pickup order type, and item mapping were checked for presence. Hive can start with the code, tests, and preview mode without requesting another token. For a connected run in a separate environment, provide access to the same sandbox configuration through your approved secrets manager. The [environment template](../.env.example) lists the variable names.

| If Hive needs | What the Clover merchant admin does |
| --- | --- |
| A separate sandbox Platform REST token | In **Global Developer Dashboard → Sandbox → Test Merchants → Launch Dashboard**, open **Settings → View all settings → Business Operations → API tokens → Create new token**. The spike uses **Inventory Read** and **Orders Read/Write** for catalog, order reconciliation, and printing. Scope any added permissions to the operations Hive actually uses. [Clover test token guide](https://docs.clover.com/dev/docs/gdp-create-merchant-specific-api-token) |
| Ecommerce keys for embedded card fields | In the **correct merchant’s** dashboard, open **Settings → View all settings → Ecommerce → Ecommerce API Tokens**. If a key pair is needed and none exists, choose **Create New Token → Hosted iFrame + API/SDK**. The public key goes into the hosted-fields integration. Store the private key in the server’s secrets manager. Clover documents one Ecommerce token per merchant, so check existing integrations before any rotation. [Clover Ecommerce key guide](https://docs.clover.com/dev/docs/create-ecommerce-api-tokens) |
| Production Platform API access | If Hive uses the Platform API for the live inventory, orders, or printing, Hive sets up the Clover OAuth integration and the restaurant owner authorizes it for the live merchant. The backend stores and refreshes the scoped tokens. [Clover Platform API authentication](https://docs.clover.com/dev/docs/using-api-tokens) · [Clover OAuth flow](https://docs.clover.com/dev/docs/merchant-dashboard-left-navigation-oauth-flow) |

The sandbox already has the credentials this spike used. No new credentials were generated for the handoff. If Hive needs owner action, ask him to specify **sandbox or live**, **Ecommerce keys or Platform API access**, and the operations he needs to perform.

## Sandbox setup and observations

The US sandbox test merchant ID is configured in `CLOVER_SANDBOX_MERCHANT_ID`.

Android Studio Rabbit 2 Patch 3 was installed on the QA Mac. The Apple Silicon installer matched Google’s published SHA-256. The Android SDK includes `platform-tools`, `emulator`, and `system-images;android-29;default;arm64-v8a`. The Clover developer dashboard shows the US test merchant under **Sandbox → Test Merchants**. [Clover Developer Dashboard](https://www.clover.com/global-developer-home) · [Android Studio download](https://developer.android.com/studio/)

The `AlBeik_Clover_Station_Solo` virtual device was created with the official hardware profile and booted as `emulator-5554`. Clover Engine is installed, and the user signed in with a scoped emulator token. Android listed one Clover account and the sandbox merchant’s Devices API reported one registered device. Clover’s installer added Orders, Printers, and Register. The documented image-print driver was enabled. Clover Printers initially brought up Android’s permissions review. The standalone emulator window required manual interaction.

The emulator initially stopped at Clover’s employee passcode keypad. On November 27, 2026, the sandbox API confirmed a six-digit device passcode policy, one registered emulator, and only the existing owner employee. The emulator had an active network connection, and Clover logged failed employee passcode attempts. In regular Chrome, the owner record stayed on the verification dialog’s disabled **Loading** button. Chrome logged `Unexpected end of JSON input`. The cause of the verification response remains unconfirmed.

The dashboard’s **New employee** form also failed after Save with `Unexpected non-whitespace character after JSON at position 27 (line 1 column 28)`. A fresh sandbox API check still returned only the original employee. With user approval, the official sandbox API created **AlBeik Emulator QA** with the **Employee** role and a six-digit device passcode. Both creation and readback returned HTTP 200. The record has no email or invitation. [Clover employee API](https://docs.clover.com/dev/reference/employeecreateemployee)

The emulator synced **AlBeik Emulator QA** before subsequent keypad rejections. For this test record, Clover returned a six-digit PIN value different from the value submitted in the create request. The PIN returned by the sandbox API matched the PIN field in the employee record synced to the emulator. The user used that value to unlock the emulator, and Android diagnostics confirmed the launcher was in the foreground. Clover’s Image driver was enabled and the Printers app opened successfully. The merchant API still listed only its built-in printer.

The user configured **Image 384px** as an online **Order printer** on the emulator and submitted a fresh checkout. Order `Z8A9HXHFPT9MR` had one successful **$19.43** sandbox payment, the Tawouk combo, and the Extra sauce modifier. Android's Orders provider logged the order and its payment. Clover still reported `printed: false`, and the emulator had no receipt PNG. Checkout recorded a print attempt without an acknowledged print event. A single direct print-only diagnostic against older sandbox order `1058BHCHW03KP` returned HTTP 400, `The default printing device is missing`. The merchant reports the emulator with a generic Android model. Open **Setup → Devices** to check whether Clover offers the emulator as the default firing device. Once a device is selected, verify printing with an existing paid sandbox order before running another checkout. If the emulator is ineligible, the Orders app can test a manual re-fire to the local Image order printer. [Clover printing FAQ](https://docs.clover.com/dev/docs/faqs#devices-and-printers) · [Clover Print API](https://docs.clover.com/dev/docs/printing-orders-rest-api)

An attempt to open **Setup** returned to Printers. Android logged repeated `NullPointerException` crashes in Clover’s Online Ordering preferences app (`com.clover.figleaf`). Default device eligibility remains unverified.

The manual kitchen print succeeded from the emulator’s **Orders** app for `Z8A9HXHFPT9MR`. The Orders screen and sandbox API both reported the line item as printed. The Clover Image 384px driver logged successful completion at 4:11:51 p.m. on November 27, 2026. The PNG showed the pickup name, order type, Chicken Tawouk Sandwich Combo, Extra sauce, and the matching Clover order ID. The driver on this version wrote to `/storage/emulated/0/Android/data/com.clover.engine/files/receipts/`, which differed from the path in Clover’s guide. Automatic printing remains blocked by the missing default firing device.

The user opened Clover’s **Manage printing preferences for Online Ordering**, selected **Image 384px** for **Print an expo receipt with full order**, and ran **Print Test Receipt**. Clover’s own `print_event` call still displayed `The default printing device is missing`. This independently reproduces the automatic routing error with the local order and expo printer configured. The next verification is the default firing device and online kitchen order printer on the restaurant’s physical Station Duo.

The user also configured **Image 384px** as an online **Receipt printer**. The local printer test wrote a generic Clover test PNG at 4:16:27 p.m. Subsequent Online Ordering `print_event` calls at 4:17 p.m. all returned HTTP 499 in the Clover app and produced no new PNG. Local printing therefore works with both printer categories configured. The remote routing error remains.

An earlier sandbox order, `HS2N39F0W1G7R`, was placed while the emulator was connected and still locked. Clover recorded one successful **$19.43** payment with the Tawouk combo and Extra sauce. The print attempt received no acknowledgement, Clover showed `printed: false`, and the emulator produced no receipt file for that order.

## Files already downloaded

| File | What to use it for |
| --- | --- |
| `clover-device-profiles.zip` | Import `clover-device-profiles/clover-station-solo.xml` into Android Studio Device Manager. The archive listing was verified. |
| `com.clover.engine-2480.apk` | Install the Clover Engine on the virtual device. Its SHA-256 matched Clover’s download URL. |

Engine SHA-256 is `140ac61fe5971193baeec8c7743ef8e02d179e5ded603c7cee7e98ec69260545`. [Clover virtual devices and Engine setup](https://docs.clover.com/dev/docs/setting-up-an-android-emulator)

Google’s SDK catalog listed an ARM64 Android 10 system image, and `avdmanager list device` recognized the Clover Station Solo profile extracted from the ZIP.

## Connect the virtual register and verify printing

1. Boot the **Station Solo** AVD from Device Manager or run `emulator -avd AlBeik_Clover_Station_Solo -port 5554` with the Android SDK’s emulator executable on your path. Confirm `emulator-5554` with `adb devices`. The AVD uses Android 10/API 29, `arm64-v8a`, 2 GB RAM, and 16 GB device storage. [Clover emulator setup](https://docs.clover.com/dev/docs/setting-up-an-android-emulator)
2. In Clover Global Developer Dashboard, confirm **Sandbox** is on. Open **Test Merchants** and generate a short-lived emulator token for the configured test merchant. In the emulator, open **Settings → Accounts → Add account → Clover** and enter the developer email and emulator token. This token is separate from the ecommerce key in the website’s local config. The merchant owner must have access to generate it. [Clover emulator authentication](https://docs.clover.com/dev/docs/authenticate-gde-accounts-on-android-emulator)
3. Install the Clover merchant apps using Clover’s official setup steps. Confirm that the Orders app loads the existing sandbox merchant’s orders. Enable the Clover image print driver and add its printer in the Printers app. Check whether it can serve as the merchant’s order printer. [Clover app installation](https://docs.clover.com/dev/docs/setting-up-an-android-emulator) · [Image print driver](https://docs.clover.com/dev/docs/testing-with-printer-receipt-images)
4. Once there is a default firing device, run a fresh sandbox checkout for the **Chicken Tawouk Sandwich Combo + Extra sauce**. Check that one paid order with the correct items and total appears in the virtual register. Verify automatic printing by looking for a PNG in the Image driver’s output path after the website submits the print request. On this emulator, check `/storage/emulated/0/Android/data/com.clover.engine/files/receipts/`. Clover’s guide also lists `/sdcard/receipts/`. Record automatic routing and manual printing as separate results. [Clover REST printing](https://docs.clover.com/dev/docs/printing-orders-rest-api) · [Receipt image output](https://docs.clover.com/dev/docs/testing-with-printer-receipt-images)

Clover supports the Station Solo emulator. Physical Station Duo routing and the restaurant’s actual kitchen printer require an on-site test against the restaurant merchant. [Clover emulator support and hardware limits](https://docs.clover.com/dev/docs/authenticate-gde-accounts-on-android-emulator)

## Run the website

Run this command from the repository root.

```bash
PICKUP_CARD_SPIKE_MODE=sandbox pnpm dev --webpack --hostname 127.0.0.1 --port 3102
```

Open [the pickup spike](http://127.0.0.1:3102/order/pickup-card-spike). If port 3102 is already serving the spike, reuse it. Sandbox keys, menu mapping, and pickup order type are already in the ignored `.env.local`. The file contains credentials and should stay local. Use `PICKUP_CARD_SPIKE_MODE=preview` to run the same UI with simulated payment. The checkout and sandbox logic live in `src/lib/pickup-card/` and `src/app/(frontend)/order/pickup-card-spike/`. The order attempt journal lives in the ignored `.pickup-card-spike/` directory.

## Verified so far

- Clover POS order `DRJ390EJZHDWP` is paid for **$19.43** with the Chicken Tawouk Sandwich Combo, extra sauce, and one successful payment.
- Clover POS order `1058BHCHW03KP` is paid for **$12.58** with the Falafel Sandwich and one successful payment. This was the successful retry after a sandbox decline. Retry restored the bag and pickup name, quoted the current total, and opened new Clover card fields. The decline page offered the restaurant’s tap-to-call link.
- Those initial orders were placed before the emulator was connected. A later order, `Z8A9HXHFPT9MR`, appeared in the emulator with one successful **$19.43** payment. A manual re-fire produced an inspected kitchen ticket PNG, and Clover marked the line item printed.
- A real Clover sandbox price change updated the quote. A stale quote and sold-out item were rejected before payment. The test item’s original price and availability were restored.
- Browser checks covered mobile and desktop checkout, expandable Combo details, waiting-page refresh recovery, and a blocked Clover payment script with Pay disabled.
- All **53 tests passed** again on November 27, 2026, along with typecheck, ESLint, and `git diff --check`. Tests cover duplicate submits, lost payment responses, declined cards, price changes, print failures, and two simulated Clover `429` cases.

## Remaining launch checks

The sandbox charge responses omitted AVS and CVV result fields. Review the actual merchant’s online fraud configuration once signed in. The checkout also needs its own abuse limits before opening it to public traffic. For the on-site Station Duo test, verify the paid order, the exact kitchen ticket, and the staff fallback if printing fails. [Clover fraud checks](https://docs.clover.com/dev/docs/confirming-customer-information-with-ecommerce-fraud-tools) · [Clover fraud controls](https://docs.clover.com/dev/docs/protect-ecommerce-merchants-from-card-testing-fraud)
