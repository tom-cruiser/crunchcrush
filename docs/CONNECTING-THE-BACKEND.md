# Connecting the backend: step by step

This guide explains how to replace the demo data with a real backend, one piece at a
time, without rewriting the screens.

- **What the backend must provide** (every endpoint, rule and error code):
  [`BACKEND.md`](BACKEND.md).
- **How to plug it into the frontend, and in what order:** this guide.

---

## How the frontend gets its data today

Every screen gets data the same way: it calls a function from `src/api/`. No screen reads
or writes storage directly.

```
Screens (about 35 files)
   │  import { ordersApi } from '@/api'
   ▼
src/api/*.ts   ← 66 functions, each with a comment naming its REST route
   │  return mock(() => …)
   ▼
src/api/mock/  ← fake database kept in the browser (localStorage "cc-mockdb")
```

The rule that makes this easy: **if a function keeps its name, its inputs and its return
type, the screens never notice what is behind it.** So you replace the inside of each
function with an HTTP call, one group at a time.

| What | Where | Notes |
|---|---|---|
| Data functions | `src/api/auth.ts`, `menu.ts`, `orders.ts`, `payments.ts`, `places.ts`, `promotions.ts`, `reports.ts`, `settings.ts`, `staff.ts`, `customers.ts` | The only files you rewrite. Each function's comment gives its route, e.g. `/** POST /api/orders */`. |
| Shared helpers | `src/api/client.ts` | `mock()` fakes network delay. `ApiError` is the error type screens understand. `isOffline()` checks the connection. |
| Fake database | `src/api/mock/` | Deleted at the end. Until then, good seed data. |
| Data shapes | `src/types/index.ts` | Your JSON must match these. |
| Sign-in tokens | `src/store/auth.ts` | Holds `customerToken` and `staffToken` after sign-in. |
| Price formula | `src/lib/pricing.ts` | The server must calculate prices exactly the same way. |
| Opening hours and slots | `src/features/store/hours.ts` | Kigali time rules the server must repeat. |

Functions per file:

| File | Functions | Group |
|---|---|---|
| `menu.ts` | 9 | Menu (public and admin) |
| `settings.ts` | 6 | Settings and delivery zones |
| `places.ts` | 2 | Address search |
| `orders.ts` | 17 | Orders (customer and staff) |
| `auth.ts` | 9 | Sign-in and customer account |
| `payments.ts` | 2 | Payments |
| `promotions.ts` | 7 | Promo codes and combos |
| `staff.ts` | 10 | Staff and riders |
| `customers.ts` | 3 | Customers and feedback |
| `reports.ts` | 1 | Sales report |

---

## Step 1. Create the backend project

1. **Pick a stack.** Anything that serves JSON over HTTPS works. A good default is Node.js
   with Express or NestJS, PostgreSQL, and Prisma.
2. **Create the tables** from `src/types/index.ts`:
   - Money is a whole number of Rwandan francs (`6500`, never `65.00`).
   - Timestamps are stored in UTC. Opening hours, holiday dates and report days are Kigali
     time (UTC+2, no daylight saving).
   - IDs are strings. Order IDs must be impossible to guess (use UUIDs).
3. **Seed the database** from the demo data:
   - Menu: `src/api/mock/menu.ts`
   - Settings and zones: `src/api/mock/settings.ts`
   - Staff, riders and sample customers: `src/api/mock/people.ts`
   - Promo codes: `src/api/mock/promos.ts`
4. **Images:** the food pictures and cover photo are static files in `public/images/`. At
   first an item's `imageUrl` can keep pointing there (`/images/menu/taco-beef.svg`).
5. **Errors:** every error response is `{ "code": "...", "message": "..." }`, where
   `message` is written for the customer or staff member, since the app shows it as is.
   The codes are listed in `BACKEND.md` §6.

**Done when:** `GET http://localhost:4000/api/menu` returns the seeded menu.

---

## Step 2. Add an HTTP client to the frontend

Create **`src/api/http.ts`**. Every converted function will use it.

```ts
import { useAuth } from '@/store/auth'
import { ApiError, isOffline } from './client'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

/** Staff screens (admin, rider, staff sign-in) use the staff token; everything else the customer's. */
const isStaffPath = (path: string) => /^\/(admin|riders|staff)\b/.test(path)

export async function http<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  if (method !== 'GET' && isOffline()) throw new ApiError('offline', 'You are offline. Reconnect and try again.')

  const auth = useAuth.getState()
  const token = isStaffPath(path) ? auth.staffToken : auth.customerToken

  let res: Response
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('network', 'Could not reach Crunch Crust. Check your connection and try again.')
  }

  if (res.status === 401) {
    // Expired or invalid sign-in: forget it so the app shows the sign-in screen again.
    if (isStaffPath(path)) auth.signOutStaff()
    else auth.signOutCustomer()
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new ApiError(err?.code ?? 'server_error', err?.message ?? 'Something went wrong. Please try again.')
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
```

Build query strings with `URLSearchParams`, for example
`http('GET', '/admin/orders?' + new URLSearchParams({ search: 'CC-10' }))`.

**Done when:** `npx tsc -b` passes. Nothing uses the file yet.

---

## Step 3. Point the dev server at your backend

In **`vite.config.ts`**, add a proxy so the app and the API share one address during
development:

```ts
export default defineConfig({
  // …existing settings…
  server: {
    proxy: { '/api': 'http://localhost:4000' },
  },
})
```

Why a proxy rather than calling `http://localhost:4000` directly:

- No CORS setup is needed in development.
- The offline cache for `/api/menu` and `/api/orders` (in `vite.config.ts`, under
  `runtimeCaching`) keeps working, because the paths stay the same.

For the live site, either serve the API on the same domain under `/api` (simplest), or
build with `VITE_API_URL=https://api.your-domain.rw/api` and enable CORS on the API for
the app's domain, allowing the `Authorization` header.

**Done when:** with both servers running, `http://localhost:5173/api/menu` in the browser
shows your backend's JSON.

---

## Step 4. Convert the functions, one group at a time

For each function: keep the name, inputs and return type; replace the body with an
`http()` call to the route written in its comment.

```ts
// Before (src/api/menu.ts)
/** GET /api/menu */
export function getMenu(): Promise<MenuResponse> {
  return mock(() => ({ categories: …, items: … }))
}

// After
/** GET /api/menu */
export function getMenu(): Promise<MenuResponse> {
  return http('GET', '/menu')
}
```

```ts
// Before (src/api/orders.ts)
export function acceptOrder(id: ID, prepTimeMinutes: number): Promise<Order> {
  return mock(() => { … }, { write: true })
}

// After
export function acceptOrder(id: ID, prepTimeMinutes: number): Promise<Order> {
  return http('POST', `/admin/orders/${id}/accept`, { prepTimeMinutes })
}
```

**Convert in this order.** Each group is a complete slice, so customers and staff never
end up on different data (for example, an order placed on the real API while the staff
board still reads the demo data).

| # | Group | Functions | Test in the app |
|---|---|---|---|
| 1 | **Menu and settings** (read-only) | `menu.getMenu`, `menu.getMenuItem`, `settings.getSettings`, `settings.getDeliveryZones`, `settings.checkDeliveryZone`, `places.searchPlaces`, `places.reverseGeocode`, `promotions.validatePromoCode` | Menu loads; categories and search work; checkout accepts an address and a promo code. |
| 2 | **Orders, cash only** | `orders.placeOrder`, `getOrder`, `listOrdersByIds`, `cancelOrder`, `rateOrder`, `reportProblem`, `getOrderRider` | Place a cash order as a guest; it appears in Orders and tracking works. |
| 3 | **Staff sign-in and Live orders** | `auth.staffLogin`, `orders.listOrders`, `acceptOrder`, `rejectOrder`, `updateOrderStatus`, `assignRider`, `updatePrepTime`, `staff.listRiders`, `settings.updateSettings` (Open/Busy switches) | Sign in as staff, accept the order from step 2, move it to delivered; the customer's tracking follows. |
| 4 | **Customer account** | `auth.requestOtp`, `verifyOtp`, `loginWithEmail`, `getProfile`, `updateProfile`, `saveAddress`, `deleteAddress`, `toggleFavourite`, `orders.listCustomerOrders` | Sign in with a real SMS code; save an address; favourite an item; earlier guest orders with the same phone appear. |
| 5 | **Payments** | `payments.initiatePayment`, `getPaymentStatus` | MoMo or Airtel prompt arrives on the phone; the app shows paid; the order reaches the board only once paid. |
| 6 | **Rest of admin** | Remaining functions in `menu.ts` (save, delete, availability, reorder), `settings.ts` (zones), `promotions.ts`, `staff.ts` (staff), `customers.ts`, `reports.ts` | Each admin page loads and saves; reports match the orders. |
| 7 | **Rider app** | `staff.getMyRider`, `setRiderStatus`, `updateRiderLocation`, `listRiderOrders`, `listRiderHistory`, `saveRider` | Rider signs in, sees an assigned order, shares location, marks it delivered. |

Tip: until a group is converted, you can keep using the demo version. Converted and
unconverted functions live side by side in the same files.

---

## Step 5. Signed-in identity

Some functions take the signed-in person's ID as an argument, for example
`getProfile(userId)`, `listCustomerOrders(customerId)` and `listRiderOrders(staffId)`.
The real API takes identity from the token instead.

For now, **keep the argument and ignore it** (rename it `_userId`), so no screen changes.
Later you can remove it and update the few callers.

Sign-in itself already works with real tokens: `verifyOtp`, `loginWithEmail` and
`staffLogin` return `{ token, user }`, and the screens store the token in `src/store/auth.ts`.

One special case: the customer **Email** sign-in also signs staff in. If
`loginWithEmail` fails with the code `staff_account`, the screen retries with
`staffLogin`. Make your `POST /api/auth/email` return `staff_account` for a staff email,
or the screen will show "Email or password is incorrect."

---

## Step 6. Rules the server must enforce

The demo trusts the browser because it **is** the browser. A real server must check
everything again. Full details are in `BACKEND.md` §7 and §8; the essentials:

- **Recompute every price** from the database with the formula in `src/lib/pricing.ts`.
  Never trust prices or totals sent by the app.
- **Validate promo codes fully** when the order is placed (dates, usage limit, minimum).
  Count a use only when the order is created, and do it atomically.
- **Check the order** before creating it: store open (or a valid scheduled slot), items
  available, options valid, address inside a delivery zone, minimum order reached.
- **Enforce the order status flow** and who may change it (`BACKEND.md` §7.4).
- **Protect orders:** unguessable IDs; only the customer (or guest holding the order)
  may cancel, rate or report it.
- **Sign-in safety:** real SMS codes that expire, attempt and send limits, hashed
  passwords. The demo code `123456` and password `demo1234` must not exist.
- **Payments:** confirm only through the provider's webhook or a server-side check,
  never because the app says so. Refund paid orders that are rejected or cancelled.
- **Return the exact error codes** the screens react to. The most important:
  `sold_out` (checkout sends the customer back to the cart), `not_found`,
  `staff_account`, `duplicate`, `duplicate_email`, `last_owner`.

---

## Step 7. Remove the demo extras

Once everything is converted:

| Remove | Where |
|---|---|
| "Demo: auto-advance" switch on Live orders, and the simulation behind it (`tickSimulation`, `getSimulationEnabled`, `setSimulationEnabled`) | `src/pages/admin/LiveOrdersPage.tsx`, `src/api/orders.ts` |
| "Reset demo data" button and its confirmation | `src/pages/admin/SettingsPage.tsx` |
| "Demo accounts not working? Reset demo data" link and the demo account buttons | `src/pages/admin/AdminLoginPage.tsx` |
| Demo account buttons on the customer Email sign-in | `src/pages/customer/LoginPage.tsx` |
| Demo account list | `src/features/auth/demoAccounts.ts` |
| "Demo: the code is 123456." and the demo account texts | `src/i18n/locales/en.ts` (`auth.demoCode`, `auth.demoEmail`, `auth.demoAccounts`) |
| `resetDemoData` export | `src/api/index.ts` |
| Developer UI kit page | `src/pages/dev/UiKitPage.tsx` and its route |
| The `mock()` helper and the whole fake database | `src/api/client.ts` (keep `ApiError`, `isOffline`), `src/api/mock/` |

Then search the code for `mock`, `demo` and `123456` to catch anything left.

**Done when:** `npx tsc -b` and `npm run build` pass with `src/api/mock/` deleted.

---

## Step 8. Live updates

No change is needed to start. The screens already refresh themselves:

| Screen | Refreshes every | File |
|---|---|---|
| Live orders (staff) | 5 s | `src/features/admin/orders/useLiveOrders.ts` |
| Order tracking | 4 s | `src/pages/customer/OrderTrackingPage.tsx` |
| Active order banner and status alerts | 8 s while an order is active | `src/features/orders/useOrderWatcher.ts` |
| Payment waiting screen | 1.5 s | `src/pages/customer/PaymentPage.tsx` |
| Rider position on the map | 15 s | `src/features/orders/components/RiderCard.tsx` |
| Rider deliveries | 10 s | `src/pages/rider/RiderPage.tsx` |

That is fine for one restaurant. Later, to cut delay and server load, add Server-Sent
Events or a WebSocket and replace the timers in those files. For alerts when the app is
closed, add Web Push (`BACKEND.md` §9).

---

## Step 9. Deploy

1. `npm run build` creates a static `dist/` folder. Host it on any static host or behind
   the same server as the API.
2. Serve the app and the API over **HTTPS**. The installable app, offline mode and "use my
   location" all require it.
3. Make every unknown path return `index.html` (single-page app), except `/api/*`.
4. After each release, the app shows an "update available" prompt to people who have it
   open, so they pick up the new version.

---

## Troubleshooting

| Problem | Likely cause |
|---|---|
| The app still shows demo data after converting a function | The browser has the old demo database saved. Clear the site's data (localStorage key `cc-mockdb`), or check that the function really calls `http()`. |
| "Could not reach Crunch Crust" | The backend is not running, or the proxy in `vite.config.ts` points to the wrong port. |
| Staff screens say you are signed out | The API returned `401`: the staff token is missing, expired or not accepted on `/admin` routes. |
| CORS errors in the console | The app and API are on different addresses without CORS enabled. Use the dev proxy (step 3) or enable CORS. |
| Old menu or orders keep showing | The offline cache is serving a saved copy because the request timed out (4 s). Check the API's speed, or clear the site's data. |
| A screen shows a generic error instead of a specific message | The API returned a different `code` than the screen expects. Compare with `BACKEND.md` §6. |

---

## Checklist

- [ ] Backend serves `/api/menu` with seeded data (step 1)
- [ ] `src/api/http.ts` added (step 2)
- [ ] Dev proxy set up (step 3)
- [ ] Group 1: menu and settings (step 4)
- [ ] Group 2: orders, cash only
- [ ] Group 3: staff sign-in and Live orders
- [ ] Group 4: customer account
- [ ] Group 5: payments
- [ ] Group 6: rest of admin
- [ ] Group 7: rider app
- [ ] Server rules from step 6 in place
- [ ] Demo extras removed (step 7)
- [ ] Deployed over HTTPS (step 9)
