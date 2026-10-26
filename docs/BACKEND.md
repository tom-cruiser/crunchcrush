# Crunch Crust backend guide

This document describes everything the Crunch Crust frontend expects from a backend:
the endpoints, the data they send and return, the rules the server must enforce, and
the parts of the current mock that must **not** be copied into production.

Read it alongside the code. When the two disagree, the code wins:

| What | Where |
|---|---|
| Every data shape (source of truth) | [`src/types/index.ts`](../src/types/index.ts) |
| Every call the UI makes, with its intended HTTP route in a comment | [`src/api/*.ts`](../src/api) |
| Price calculation | [`src/lib/pricing.ts`](../src/lib/pricing.ts) |
| Opening hours, Kigali time, schedule slots | [`src/features/store/hours.ts`](../src/features/store/hours.ts) |
| Role permissions | [`src/features/auth/permissions.ts`](../src/features/auth/permissions.ts) |
| Sample data (good seed data for the real database) | [`src/api/mock/`](../src/api/mock) |

---

## 1. How the frontend talks to data today

All data access goes through the functions in `src/api/`. Components never touch storage
directly. Each function is a stand-in for one HTTP endpoint:

```ts
/** POST /api/orders — the server recalculates prices and checks every rule again. */
export function placeOrder(input: PlaceOrderInput): Promise<Order> {
  return mock(() => { /* reads and writes an in-browser database */ })
}
```

`mock()` (in `src/api/client.ts`) fakes network latency, refuses writes while the
device is offline, and stores everything in the browser's `localStorage` under
`cc-mockdb`. Nothing leaves the device.

**To connect a real backend, replace the body of each function with a `fetch` call and
keep its name, arguments and return type.** The screens only depend on those
signatures, so they should not need to change. Sections 4–6 list every function.

One exception: some mock functions take the signed-in user's id as an argument (for
example `getProfile(userId)`, `listRiderOrders(staffId)`). The real API should take
identity from the auth token instead. Keep the argument in the TypeScript signature
(and ignore it) or remove it and update the few callers. Both are small changes.

---

## 2. Conventions

### Base URL and format
- JSON over HTTPS. Suggested base path: `/api`. The frontend can read the origin from a
  `VITE_API_URL` environment variable.
- If the API is on a different origin from the app, enable CORS for the app's origin and
  allow the `Authorization` header.

### Money
- **Integer Rwandan francs (RWF), never decimals or floats.** `6500` means RWF 6,500.
- Menu prices **include** 18% VAT (`taxInclusive: true`). See [§7.2](#72-pricing).

### Dates and times
- Timestamps are ISO 8601 strings in UTC, e.g. `"2026-10-26T13:11:15.188Z"`.
- The business runs on **Kigali time, UTC+2 all year (no daylight saving)**. Opening
  hours, holiday dates, schedule slots and report days are Kigali local time:
  - `"HH:mm"` for times of day (`"07:00"`, `"22:00"`).
  - `"YYYY-MM-DD"` for calendar dates (`"2026-12-25"`).

### IDs
- Strings. The frontend never parses them, so UUIDs or database ids are both fine.
- Order ids and order numbers are different things: `id` is internal, and
  `orderNumber` is what people see and say (`"CC-1042"`). `GET /api/orders/:id`
  accepts either.
- **Order ids must be unguessable** (UUIDs or similar), because guests track orders by
  id. See [§8](#8-what-the-mock-does-that-production-must-not).

### Errors
Every error response has this body:

```json
{ "code": "out_of_zone", "message": "Sorry, we don’t deliver to this address yet." }
```

- `message` is shown to the user as is, so write it for customers and staff, not
  developers.
- `code` is machine-readable. Several screens branch on specific codes, so they must
  match exactly. The full list is in [§6](#6-error-codes).
- Use sensible HTTP statuses (400 validation, 401 not signed in, 403 wrong role,
  404 not found, 409 conflict). The frontend reads `code`, not the status.

### Lists
Lists currently return plain arrays. `Paginated<T> = { items, total }` exists in
the types for when pagination is needed (order history, customers, admin order search).

---

## 3. Authentication and roles

There are two separate kinds of session, and a device can hold both at once (for
example, a cashier testing the customer app on the counter tablet):

| Who | How they sign in | Endpoint |
|---|---|---|
| Customer | Phone number + SMS one-time code (main way) | `POST /api/auth/otp`, then `POST /api/auth/otp/verify` |
| Customer | Email + password (secondary) | `POST /api/auth/email` |
| Staff (all roles) | Email + password | `POST /api/staff/auth` |

All three return `{ token, user }`. The frontend stores the token and should send it as
`Authorization: Bearer <token>`. Guests can browse, order and track without signing in.

### Customer sign-in rules
- Phone numbers are normalised to `+2507XXXXXXXX`. The UI accepts `078…`, `78…`,
  `250…` and `+250…`.
- `verifyOtp` creates the customer on first sign-in, with an empty `name`. The app then
  asks for a name.
- **Guest orders are linked on sign-in:** orders placed earlier as a guest with the same
  phone number should get this customer's id (the mock does this in
  `listCustomerOrders`).
- Codes expire (the UI shows 120 s from `expiresInSeconds`). Rate-limit sending and
  checking codes ([§8](#8-what-the-mock-does-that-production-must-not)).

### Staff roles and permissions
Enforce these on the server. The UI hides what a role can't use, but that is not
security.

| Permission | Owner | Manager | Cashier | Kitchen | Rider |
|---|:-:|:-:|:-:|:-:|:-:|
| `orders.view`: see the order board | ✓ | ✓ | ✓ | ✓ | |
| `orders.manage`: accept, reject, update orders | ✓ | ✓ | ✓ | ✓ | |
| `menu.view` | ✓ | ✓ | ✓ | ✓ | |
| `menu.edit`: items, categories, prices | ✓ | ✓ | | | |
| `menu.availability`: mark sold out | ✓ | ✓ | ✓ | ✓ | |
| `delivery.manage`: zones, riders | ✓ | ✓ | | | |
| `settings.manage` | ✓ | ✓ | | | |
| `promotions.manage` | ✓ | ✓ | | | |
| `staff.manage` | ✓ | | | | |
| `reports.view` | ✓ | ✓ | | | |
| `customers.view`: customers, phone numbers, feedback | ✓ | ✓ | ✓ | | |
| `rider.app`: rider screens | ✓ | ✓ | | | ✓ |

- Deactivated staff (`isActive: false`) cannot sign in, and their existing tokens
  should stop working.
- Roles without `customers.view` (kitchen) do not see the customer's phone number, the prices or the receipt on the order detail. The API can leave those fields out for them.

---

## 4. Data model

The full definitions, with comments, are in `src/types/index.ts`. Summary:

| Entity | Key fields | Notes |
|---|---|---|
| `MenuCategory` | `name`, `sortOrder`, `isActive`, `availableFrom?`, `availableTo?` | The optional `"HH:mm"` window makes a category orderable only at those times (e.g. Breakfast 06:30–11:00). Hidden categories hide their items from customers. |
| `MenuItem` | `categoryId`, `name`, `price`, `imageUrl`, `prepTimeMinutes`, `isAvailable`, `isPopular`, `isRecommended`, `options[]`, `addOns[]`, `removableIngredients[]`, `dietaryTags[]`, `allergens[]`, `calories?`, `sortOrder` | `isAvailable: false` = sold out: still shown, can't be ordered. |
| `ItemOption` | `name`, `required`, `minSelect`, `maxSelect`, `choices[]` | A choice group, e.g. "Tortilla". Each `OptionChoice` has `priceDelta` and `isAvailable`. |
| `AddOn` | `name`, `price`, `maxQuantity`, `isAvailable` | Paid extras, each with a quantity. |
| `CartItem` | `itemId`, `quantity`, `selectedOptions[]`, `selectedAddOns[]`, `removedIngredients[]`, `note?`, `unitPrice` | One order line. Names and prices are copied in so old orders still read correctly after the menu changes. |
| `Order` | `orderNumber`, `customerId?`, `customerName`, `customerPhone`, `items[]`, `fulfillment`, `tableNumber?`, `address?`, `scheduledFor?`, `status`, `statusHistory[]`, `paymentMethod`, `paymentStatus`, `pricing`, `promoCode?`, `estimatedReadyAt?`, `prepTimeMinutes?`, `riderId?`, `rejectionReason?`, `cancellationReason?`, `rating?`, `problemReports[]` | See [§7.4](#74-order-status-flow). |
| `PriceBreakdown` | `subtotal`, `deliveryFee`, `serviceCharge`, `tax`, `discount`, `total` | Calculated by the server. |
| `User` (customer) | `name`, `phone`, `email?`, `addresses[]`, `favouriteItemIds[]` | |
| `Address` | `label`, `street`, `area`, `city`, `instructions?`, `coordinates`, `isDefault?` | Coordinates drive the delivery zone check. |
| `Staff` | `name`, `phone`, `email`, `role`, `isActive` | |
| `Rider` | `staffId`, `vehicle`, `plateNumber?`, `status`, `currentLocation?`, `activeOrderIds[]` | One per staff member with the `rider` role. |
| `DeliveryZone` | `name`, `radiusKm`, `fee`, `minOrder`, `estimatedMinutes`, `isActive` | Circles around the restaurant. |
| `PromoCode` | `code`, `type`, `value`, `minOrder`, `maxDiscount?`, `validFrom`, `validTo`, `usageLimit?`, `usedCount`, `isActive` | `type` is `percentage`, `fixed` or `free_delivery`. |
| `ComboDeal` | `name`, `itemIds[]`, `price`, `isActive` | Managed in admin; not sold to customers yet. |
| `RestaurantSettings` | contact details, `address`, `isOpen`, `busyMode`, `busyExtraMinutes`, `openingHours[]`, `holidayClosures[]`, `minimumOrder`, `taxRatePercent`, `taxInclusive`, `serviceChargePercent`, `defaultPrepTimeMinutes`, `enabledPaymentMethods[]`, `fulfillmentTypes[]`, `tableCount` | A single record. |

**Enumerations:**
- `OrderStatus`: `received`, `accepted`, `preparing`, `ready`, `out_for_delivery`,
  `delivered`, `rejected`, `cancelled`.
- `FulfillmentType`: `delivery`, `pickup`, `dine-in`.
- `PaymentMethod`: `mtn_momo`, `airtel_money`, `card`, `cash`.
- `PaymentStatus`: `pending`, `paid`, `failed`, `refunded`.
- `StaffRole`: `owner`, `manager`, `cashier`, `kitchen`, `rider`.
- `RiderStatus`: `available`, `on_delivery`, `offline`.
- `DietaryTag`: `vegetarian`, `vegan`, `spicy`, `halal`, `gluten-free`.
- `Allergen`: `gluten`, `eggs`, `dairy`, `nuts`, `soy`, `sesame`, `fish`.
- `ProblemReport.type`: `missing_item`, `wrong_item`, `late`, `quality`, `other`.

---

## 5. Endpoints

"Who" says who may call it: **public** (anyone), **customer** (signed-in customer),
**guest/customer** (anyone who has the order id), or a staff permission from
[§3](#staff-roles-and-permissions). The function column is the name in `src/api/`.

### 5.1 Auth and account (`src/api/auth.ts`)

| Method and path | Who | Function | Request | Response |
|---|---|---|---|---|
| `POST /api/auth/otp` | public | `requestOtp` | `{ phone }` | `{ phone, expiresInSeconds }` (normalised phone) |
| `POST /api/auth/otp/verify` | public | `verifyOtp` | `{ phone, code }` | `{ token, user: User }` |
| `POST /api/auth/email` | public | `loginWithEmail` | `{ email, password }` | `{ token, user: User }` |
| `POST /api/staff/auth` | public | `staffLogin` | `{ email, password }` | `{ token, user: Staff }` |
| `GET /api/me` | customer | `getProfile` | | `User` |
| `PATCH /api/me` | customer | `updateProfile` | `{ name, email? }` | `User` |
| `POST /api/me/addresses` | customer | `saveAddress` | `Address` without `id` | `User` (whole user, with addresses) |
| `PUT /api/me/addresses/:id` | customer | `saveAddress` | `Address` | `User` |
| `DELETE /api/me/addresses/:id` | customer | `deleteAddress` | | `User` |
| `POST /api/me/favourites/:itemId/toggle` | customer | `toggleFavourite` | | `User` |

Address rules: the first address is automatically the default, and setting
`isDefault: true` on one clears it on the others. Deleting the default makes the
first remaining address the default.

### 5.2 Menu, settings and places (public)

| Method and path | Function | Response | Notes |
|---|---|---|---|
| `GET /api/menu` | `menuApi.getMenu` | `{ categories, items }` | Active categories only, sorted by `sortOrder`. Includes sold-out items (flagged). Cached by the service worker for offline use. |
| `GET /api/menu/items/:id` | `menuApi.getMenuItem` | `MenuItem` | Used for shared item links. |
| `GET /api/settings` | `settingsApi.getSettings` | `RestaurantSettings` | Opening hours, fees, payment methods and so on. |
| `GET /api/delivery-zones` | `settingsApi.getDeliveryZones` | `DeliveryZone[]` | Sorted by `radiusKm`. |
| `POST /api/delivery-zones/check` | `settingsApi.checkDeliveryZone` | `{ deliverable, distanceKm, zone? }` | Body `{ lat, lng }`. Rule in [§7.3](#73-delivery-zones). |
| `GET /api/places?q=` | `placesApi.searchPlaces` | `Place[]` | Address search. Back with Google Places, Mapbox or similar. `Place = { id, name, area, city, coordinates }`. |
| `GET /api/places/reverse?lat=&lng=` | `placesApi.reverseGeocode` | `Place` | Names the spot when a customer uses "my location". |
| `POST /api/promos/validate` | `promotionsApi.validatePromoCode` | `PromoCode` | Body `{ code, subtotal }`. Errors: `promo_invalid`, `promo_used_up`, `promo_min_order`. |

### 5.3 Orders (customer side, `src/api/orders.ts`)

| Method and path | Who | Function | Request | Response |
|---|---|---|---|---|
| `POST /api/orders` | public | `placeOrder` | `PlaceOrderInput` (below) | `Order` |
| `GET /api/orders/:idOrNumber` | guest/customer | `getOrder` | | `Order` |
| `GET /api/orders?ids=a,b,c` | guest/customer | `listOrdersByIds` | | `Order[]`: the guest's own orders, ids remembered on the device |
| `GET /api/me/orders` | customer | `listCustomerOrders` | | `Order[]`, newest first; links guest orders by phone |
| `GET /api/orders/:id/rider` | guest/customer | `getOrderRider` | | `{ id, name, phone, vehicle, plateNumber?, currentLocation? }` or `null` |
| `POST /api/orders/:id/cancel` | guest/customer | `cancelOrder` | `{ reason }` | `Order`. Only while `received`, otherwise `too_late`. |
| `POST /api/orders/:id/rating` | guest/customer | `rateOrder` | `{ food: 1–5, delivery?: 1–5, comment? }` | `Order` |
| `POST /api/orders/:id/problems` | guest/customer | `reportProblem` | `{ type, message }` | `Order` |

```ts
interface PlaceOrderInput {
  items: CartItem[]            // see §8: recompute prices, don't trust unitPrice
  fulfillment: 'delivery' | 'pickup' | 'dine-in'
  tableNumber?: number         // dine-in, 1..tableCount (from a table QR code /table/:n)
  address?: Address            // delivery only
  scheduledFor?: string        // ISO; absent = as soon as possible
  paymentMethod: PaymentMethod
  promoCode?: string
  customer: { id?: string; name: string; phone: string }  // id when signed in
}
```

### 5.4 Payments (`src/api/payments.ts`)

| Method and path | Who | Function | Request | Response |
|---|---|---|---|---|
| `POST /api/orders/:id/payments` | guest/customer | `initiatePayment` | `{ method, phone?, cardLast4? }` | `PaymentSession` |
| `GET /api/payments/:id` | guest/customer | `getPaymentStatus` | | `PaymentSession` |

```ts
interface PaymentSession {
  id: string
  orderId: string
  method: PaymentMethod
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  instructions: string     // shown while waiting, e.g. "Approve the MTN MoMo prompt sent to 078…"
  failureReason?: string   // shown when status is failed; the customer can retry
}
```

The full flow is in [§7.6](#76-payments).

### 5.5 Admin: orders

| Method and path | Permission | Function | Request | Response |
|---|---|---|---|---|
| `GET /api/admin/orders` | `orders.view` | `listOrders` | query: `statuses`, `fulfillment`, `search`, `since` | `Order[]` |
| `POST /api/admin/orders/:id/accept` | `orders.manage` | `acceptOrder` | `{ prepTimeMinutes }` | `Order` |
| `POST /api/admin/orders/:id/reject` | `orders.manage` | `rejectOrder` | `{ reason }` | `Order` |
| `PATCH /api/admin/orders/:id/status` | `orders.manage` | `updateOrderStatus` | `{ status, note? }` | `Order` |
| `POST /api/admin/orders/:id/rider` | `orders.manage` | `assignRider` | `{ riderId }` | `Order` |
| `PATCH /api/admin/orders/:id/prep-time` | `orders.manage` | `updatePrepTime` | `{ prepTimeMinutes }` | `Order` |

- `search` matches order number, customer name or phone.
- The live board asks for active orders plus today's finished ones (`since` = start of
  the Kigali day).
- Rejection reasons the UI offers: "Kitchen too busy", "Item unavailable", "Outside
  delivery area", "Closing soon", "Suspected fake order", or free text.

### 5.6 Admin: menu (`src/api/menu.ts`)

| Method and path | Permission | Function | Notes |
|---|---|---|---|
| `GET /api/admin/menu` | `menu.view` | `getAdminMenu` | Every category, including hidden ones. |
| `POST /api/admin/categories` / `PUT /api/admin/categories/:id` | `menu.edit` | `saveCategory` | |
| `DELETE /api/admin/categories/:id` | `menu.edit` | `deleteCategory` | Refuse while items remain (return a code, e.g. `category_not_empty`). |
| `PUT /api/admin/categories/order` | `menu.edit` | `reorderCategories` | Body: ordered id list. Returns categories. |
| `POST /api/admin/items` / `PUT /api/admin/items/:id` | `menu.edit` | `saveMenuItem` | Whole `MenuItem`. |
| `DELETE /api/admin/items/:id` | `menu.edit` | `deleteMenuItem` | Past orders keep their copied names and prices. |
| `PATCH /api/admin/items/:id/availability` | `menu.availability` | `setItemAvailability` | `{ isAvailable }`, the sold-out switch. |
| `POST /api/admin/uploads` | `menu.edit` | *(new)* | Needed for item photos ([§8](#8-what-the-mock-does-that-production-must-not)). |

### 5.7 Admin: delivery, settings, promotions

| Method and path | Permission | Function |
|---|---|---|
| `PATCH /api/admin/settings` | `settings.manage` (`orders.manage` may toggle `busyMode` only) | `settingsApi.updateSettings` (partial `RestaurantSettings`) |
| `POST /api/admin/delivery-zones` / `PUT /api/admin/delivery-zones/:id` | `delivery.manage` | `settingsApi.saveDeliveryZone` |
| `DELETE /api/admin/delivery-zones/:id` | `delivery.manage` | `settingsApi.deleteDeliveryZone` |
| `GET /api/admin/riders` | `delivery.manage`, `orders.manage` | `staffApi.listRiders` |
| `PATCH /api/admin/riders/:id` | `delivery.manage` | `staffApi.saveRider` (`{ vehicle, plateNumber? }`) |
| `GET /api/admin/promos` | `promotions.manage` | `promotionsApi.listPromoCodes` |
| `POST /api/admin/promos` / `PUT /api/admin/promos/:id` | `promotions.manage` | `promotionsApi.savePromoCode` |
| `DELETE /api/admin/promos/:id` | `promotions.manage` | `promotionsApi.deletePromoCode` |
| `GET /api/combos` | public | `promotionsApi.listCombos` |
| `POST /api/admin/combos` / `PUT /api/admin/combos/:id` | `promotions.manage` | `promotionsApi.saveCombo` |
| `DELETE /api/admin/combos/:id` | `promotions.manage` | `promotionsApi.deleteCombo` |

On the live orders board, the Open/Closed switch needs `settings.manage`, and busy mode
needs `orders.manage`.

### 5.8 Admin: staff, customers, reports

| Method and path | Permission | Function | Notes |
|---|---|---|---|
| `GET /api/admin/staff` | `staff.manage` | `staffApi.listStaff` | |
| `POST /api/admin/staff` / `PUT /api/admin/staff/:id` | `staff.manage` | `staffApi.saveStaff` | Errors: `duplicate_email`, `last_owner`. Needs an invite or password-setup flow ([§8](#8-what-the-mock-does-that-production-must-not)). |
| `DELETE /api/admin/staff/:id` | `staff.manage` | `staffApi.deleteStaff` | Errors: `last_owner`, `rider_busy`. |
| `GET /api/admin/customers` | `customers.view` | `customersApi.listCustomers` | `User` plus `orderCount`, `totalSpent`, `lastOrderAt?` (delivered orders only). |
| `GET /api/admin/customers/:id/orders` | `customers.view` | *(currently `ordersApi.listCustomerOrders`)* | A staff version of "my orders" for the customer detail screen. |
| `GET /api/admin/feedback` | `customers.view` | `customersApi.listFeedback` | Orders with a rating or problem: `{ orderId, orderNumber, customerName, rating?, problems[], createdAt }`, newest first. |
| `PATCH /api/admin/orders/:orderId/problems/:problemId` | `customers.view` | `customersApi.setProblemResolved` | `{ resolved }` |
| `GET /api/admin/reports/sales?from=&to=` | `reports.view` | `reportsApi.getSalesReport` | Kigali dates, inclusive. Shape and definitions in [§7.8](#78-sales-report). |

### 5.9 Rider (`src/api/staff.ts`, permission `rider.app`)

| Method and path | Function | Notes |
|---|---|---|
| `GET /api/riders/me` | `getMyRider` | `404 not_found` when the staff member has no rider profile (the UI shows a message). |
| `GET /api/riders/me/orders` | `listRiderOrders` | Assigned orders that are `ready` or `out_for_delivery`. |
| `GET /api/riders/me/deliveries?since=` | `listRiderHistory` | Delivered today, for the "cash collected" total. |
| `PATCH /api/riders/:id/status` | `setRiderStatus` | `{ status: 'available' \| 'offline' }`. Also used by admins. |
| `POST /api/riders/me/location` | `updateRiderLocation` | `{ lat, lng }`, sent at most every 10 s while sharing. Shown on the customer's tracking map. |
| `PATCH /api/admin/orders/:id/status` | `ordersApi.updateOrderStatus` | Riders use it for "picked up" (`out_for_delivery`) and "delivered". Allow those two transitions for the assigned rider only. |

### 5.10 Demo-only functions: do not build

These exist only to make the mock behave like a busy restaurant:

- `getSimulationEnabled`, `setSimulationEnabled` (the "Demo: auto-advance" switch on the
  live board).
- `resetDemoData` (Settings → Reset demo data).
- The automatic order progression in `tickSimulation`, and the simulated rider movement.

Remove those controls when the real backend is connected.

---

## 6. Error codes

The UI either branches on these codes or shows their `message`. Keep the codes exactly.

| Code | When | Frontend behaviour |
|---|---|---|
| `not_found` | Any missing record | Order and payment screens show "not found" instead of a generic error. The rider app shows "no rider profile". |
| `offline` | Generated by the client itself | Not a server code. |
| `closed` | Placing an order "now" while the store is closed | Message shown; the customer can schedule instead. |
| `empty_cart` | Order with no items | Message. |
| `sold_out` | An item is sold out or missing | **Checkout sends the customer back to the cart.** |
| `address_required` | Delivery without an address | Message. |
| `out_of_zone` | Address outside every active zone | Message. |
| `min_order` | Below the zone minimum or the store minimum | Message. |
| `too_late` | Customer cancels after `received` | Message. |
| `promo_invalid` | Unknown, inactive or expired code | Shown under the promo field. |
| `promo_used_up` | Usage limit reached | Shown under the promo field. |
| `promo_min_order` | Subtotal below the code's minimum | Shown under the promo field. |
| `otp_invalid` | Wrong or expired code | Shown on the code field. |
| `invalid_credentials` | Wrong email or password | Shown on the form. |
| `staff_account` | A staff email used on the customer email sign-in | Shows a link to the staff login page. |
| `duplicate` | Promo code already exists | **Shown on the code field.** |
| `duplicate_email` | Staff email already used | **Shown on the email field.** |
| `last_owner` | Demoting or deleting the only owner | **Shown on the role field.** |
| `rider_busy` | Deleting a rider with active deliveries | Message. |

Suggested new codes for things the mock doesn't check: `category_not_empty`,
`slot_unavailable`, `payment_failed`, `forbidden`, `unauthenticated`, `rate_limited`,
`validation_error`.

---

## 7. Business rules the server must enforce

The frontend checks most of these to give fast feedback, but the server is the
authority. **Check everything again on the server.**

### 7.1 Placing an order (`POST /api/orders`)
In order, refusing with the code shown:

1. **Store closed:** `isOpen` is false and there is no `scheduledFor`. Return `closed`.
   For scheduled orders, check the slot is valid ([§7.5](#75-opening-hours-and-scheduled-orders)).
2. **Empty cart:** `empty_cart`.
3. **Every line orderable:** the item exists and `isAvailable`, its category is active
   and inside its time window, and every chosen option choice and add-on exists and is
   available. Otherwise `sold_out`.
4. **Options valid:** each option group's chosen count is between `minSelect` and
   `maxSelect`, required groups are filled, add-on quantities are within
   `maxQuantity`, and removed ingredients come from `removableIngredients`.
5. **Delivery:** an address is required (`address_required`). Find the zone
   ([§7.3](#73-delivery-zones)) or return `out_of_zone`. The subtotal must reach the
   zone's `minOrder` (`min_order`).
6. **Dine-in:** `tableNumber` must be between 1 and `tableCount`.
7. **Fulfilment and payment allowed:** `fulfillment` must be in `fulfillmentTypes`, and
   `paymentMethod` in `enabledPaymentMethods`. Cash is "pay the rider" for delivery and
   "pay at the counter" otherwise.
8. **Promo:** validate fully ([§7.7](#77-promo-codes)) and increase `usedCount` only
   when the order is actually placed.
9. **Price** with [§7.2](#72-pricing) from the **server's own menu prices**.
10. **Store minimum:** the subtotal must reach `settings.minimumOrder` (`min_order`).
11. **Create** the order with `status: 'received'`, `paymentStatus: 'pending'`, a
    `statusHistory` entry, the next order number (`CC-` + an increasing number), and
    `estimatedReadyAt = now + defaultPrepTimeMinutes (+ busyExtraMinutes if busyMode)`.

**When the kitchen sees it:** cash orders show on the board immediately. Prepaid orders
(MoMo, Airtel, card) should reach the kitchen only once payment succeeds.

### 7.2 Pricing
Implemented in `src/lib/pricing.ts`. Copy it exactly, or the customer's total and the
charged total will differ.

```
unitPrice     = item.price + Σ chosen option priceDelta + Σ (addOn.price × addOn quantity)
line total    = unitPrice × quantity
subtotal      = Σ line totals
deliveryFee   = zone.fee for delivery, otherwise 0
serviceCharge = round(subtotal × serviceChargePercent / 100) for dine-in only, otherwise 0
discount      = promo discount (§7.7)
taxable       = subtotal + serviceCharge − min(discount, subtotal)
tax           = taxInclusive ? round(taxable − taxable / (1 + taxRate/100))   // VAT already inside the prices
                             : round(taxable × taxRate / 100)
total         = max(0, subtotal + deliveryFee + serviceCharge − discount + (taxInclusive ? 0 : tax))
```

With inclusive tax (the default), `tax` only reports the VAT contained in the total for
the receipt; it is not added on top. All values are integer RWF, rounded with standard
rounding.

### 7.3 Delivery zones
- Zones are circles around `settings.address.coordinates`, measured as straight-line
  (great-circle) distance. See `distanceKm` in `src/lib/geo.ts`.
- **The customer gets the smallest active zone that contains the address.** Beyond the
  largest active zone there is no delivery.
- No two zones share the same `radiusKm` (the admin form enforces this).
- The zone decides `fee`, `minOrder` and the delivery estimate.

### 7.4 Order status flow

```
delivery:        received → accepted → preparing → ready → out_for_delivery → delivered
pickup, dine-in: received → accepted → preparing → ready → delivered
any active  → cancelled   (staff, with a reason)
received    → rejected    (staff, with a reason)
received    → cancelled   (customer, only before acceptance)
```

For pickup and dine-in, `delivered` is shown as "Collected" or "Served".

| Transition | Who | Side effects |
|---|---|---|
| → `accepted` | `orders.manage` | Save `prepTimeMinutes`. Set `estimatedReadyAt = now + prepTime` (+ busy minutes if busy). |
| prep time changed | `orders.manage` | `estimatedReadyAt = accepted time + new prepTime`. |
| → `rejected` | `orders.manage` | Save `rejectionReason`. If paid, refund (`paymentStatus: 'refunded'`). |
| → `cancelled` (staff) | `orders.manage` | Save `cancellationReason`, refund if paid, free the rider. |
| → `cancelled` (customer) | the order's owner, only in `received` | Same as above; otherwise `too_late`. |
| assign rider | `orders.manage` | Remove the order from any previous rider and add it to this rider's `activeOrderIds`; rider becomes `on_delivery`. |
| → `out_for_delivery` | `orders.manage` or the assigned rider | |
| → `delivered` | `orders.manage` or the assigned rider | Cash becomes `paid`. Remove from the rider's `activeOrderIds`; if none remain, the rider becomes `available`. |

- Append every change to `statusHistory` as `{ status, at, note? }`, and update
  `updatedAt`.
- Refuse transitions that skip backwards or jump over steps (the mock doesn't check
  this; the UI only offers valid next steps).

### 7.5 Opening hours and scheduled orders
- The store is open if `isOpen` is on, today (Kigali) is not in `holidayClosures`, the
  day isn't `closed`, and the time is between `open` and `close`. See `getOpenStatus` in
  `hours.ts`.
- **Schedule slots:** 15-minute slots for today and the next 2 days. They run from
  30 min after opening to 30 min before closing, and start at least 45 min from now.
  Closed days and holidays are skipped. The client sends the slot as an ISO time
  (`YYYY-MM-DDTHH:mm:00+02:00` → UTC).
- The server should accept `scheduledFor` only if it lands on such a slot, otherwise
  `slot_unavailable`.
- A scheduled order should reach the kitchen board a sensible time before its slot
  (e.g. slot time − prep time − delivery estimate). The board sorts by
  `scheduledFor ?? createdAt`.

### 7.6 Payments

**MTN MoMo and Airtel Money:**
1. Create the order with `POST /api/orders`; it starts with `paymentStatus: 'pending'`.
2. `POST /api/orders/:id/payments` with `{ method, phone }`. The server asks the
   provider to send an approval prompt (USSD push) to the phone, and returns a
   `PaymentSession` with `status: 'pending'` and the `instructions` to show.
3. The app polls `GET /api/payments/:id` every 1.5 s. The server learns the result from
   the provider's **callback/webhook** (or by checking with the provider).
4. On `paid`: set `order.paymentStatus = 'paid'` and send the order to the kitchen. On
   `failed`: set `failureReason`; the customer can retry, possibly with another method.

**Card:** the same, via the card processor. The app sends the last four digits only;
card details should go directly to the processor's own payment form or SDK, never
through this API.

**Cash:** no payment session is needed. The order goes to the kitchen straight away and
becomes `paid` on delivery or collection.

**Rules:**
- Make callbacks idempotent.
- Verify webhook signatures.
- Never mark an order paid from the client's word.
- Refund (or flag for a refund) when a paid order is rejected or cancelled.
- MTN numbers are `078`/`079`; Airtel numbers are `072`/`073`.

### 7.7 Promo codes
A code applies only if all of these are true:

- It exists. Codes are case-insensitive and stored in upper case.
- `isActive` is true.
- Now is between `validFrom` and `validTo`. The admin edits whole Kigali days: start is
  00:00 and end is 23:59:59 Kigali time.
- `usedCount < usageLimit` when a limit is set.
- `subtotal ≥ minOrder`.

Discount:
- `percentage`: `round(subtotal × value / 100)`, capped at `maxDiscount` if set.
- `fixed`: `min(value, subtotal)`.
- `free_delivery`: the delivery fee.

Codes must be unique (`duplicate`).

### 7.8 Sales report
`GET /api/admin/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD` (Kigali dates, inclusive).
Reference implementation: `src/api/reports.ts`.

- **In range:** orders whose `createdAt` falls on those Kigali dates.
- **Completed:** in-range orders with status `delivered` (this includes collected and
  served). Revenue = Σ `pricing.total` of completed orders.

```ts
interface SalesReport {
  from: string; to: string
  orderCount: number            // completed
  revenue: number
  averageOrderValue: number     // round(revenue / orderCount), 0 if none
  daily: { date: string; revenue: number; orders: number }[]          // every day in range, zeros included
  itemSales: { itemId: string; name: string; quantity: number; revenue: number }[]  // sorted by quantity desc; include unsold items with 0
  peakHours: { hour: number; orders: number }[]                       // 24 entries, Kigali hour of createdAt
  paymentBreakdown: { method: PaymentMethod; orders: number; revenue: number }[]
  cancellations: { cancelled: number; rejected: number; rate: number; reasons: { reason: string; count: number }[] }
}
```

`rate` = (cancelled + rejected) / all in-range orders. `reasons` groups
`cancellationReason ?? rejectionReason ?? 'No reason given'`.

### 7.9 Staff and riders
- Staff emails are unique (`duplicate_email`). There must always be at least one active
  owner (`last_owner`).
- **Every staff member with the `rider` role has a `Rider` record.** Create it when the
  role is set (vehicle `motorbike`, status `offline`). Keep `name` and `phone` in sync.
  When the role is removed or the person is deactivated, set the rider `offline`.
- A rider with active deliveries can't be deleted (`rider_busy`).
- Riders can only see and update their own assigned orders.

### 7.10 Menu
- A category with items can't be deleted.
- Items can be hidden in two ways: `isAvailable: false` (sold out, still listed) or by
  hiding their category (`isActive: false`, not listed).
- When a category has `availableFrom`/`availableTo`, its items show but can't be
  ordered outside that Kigali-time window.

---

## 8. What the mock does that production must not

The mock trusts the browser because it **is** the browser. A real server must not.

| Mock behaviour | What production needs |
|---|---|
| `placeOrder` prices lines from the client's `unitPrice`. | **Recompute every price from the database** ([§7.2](#72-pricing)). Never trust client prices or totals. |
| At order time a promo is checked only for `isActive`. | Full promo validation ([§7.7](#77-promo-codes)), with `usedCount` updated atomically so two orders can't both use the last allowed use. |
| Scheduled times aren't checked. | Validate against opening hours and slots ([§7.5](#75-opening-hours-and-scheduled-orders)). |
| Status transitions aren't checked. | Enforce the flow and who may move it ([§7.4](#74-order-status-flow)). |
| Anyone with an order id can read, cancel, rate or report it. | Order ids must be unguessable. For guests, also consider a per-order access token returned by `POST /api/orders`. Only the order's customer (or the guest holding it) may cancel, rate or report. |
| Every OTP is `123456`; every staff password is `demo1234`; customer email login accepts any password of 6+ characters. | Real SMS provider; hashed passwords; OTP expiry, attempt limits and send rate limits per phone and IP. |
| New staff get the demo password. | An invite or password-setup flow (email or SMS link), plus password reset. |
| Uploaded item photos are resized in the browser and saved as `data:` URLs in `imageUrl`. | An upload endpoint (or signed upload URL) storing images in object storage and returning a normal URL. Keep images around 480 px for the cards and sheet. |
| Payments succeed or fail after 5 s, based on the phone or card number. | Real MTN MoMo, Airtel Money and card integration with webhooks ([§7.6](#76-payments)). |
| `deleteCategory` throws a plain error without a code. | Return `category_not_empty`. |
| Everything lives in one browser. | A real database, so staff tablets, rider phones and customers share the same data. |

---

## 9. Real-time updates and notifications

The frontend currently **polls**. Every interval below is a constant in the named file,
so moving to push updates later only touches those hooks.

| Screen | What it calls | Every |
|---|---|---|
| Live orders board (staff) | `GET /api/admin/orders` | 5 s (`useLiveOrders.ts`) |
| Customer order tracking | `GET /api/orders/:id` | 4 s (`OrderTrackingPage.tsx`) |
| Active-order banner and status toasts (any customer screen) | `GET /api/orders?ids=` or `GET /api/me/orders` | 8 s while an order is active (16 s after an error); stops when none are active and restarts on sign-in or a new order (`useOrderWatcher.ts`) |
| Payment waiting screen | `GET /api/payments/:id` | 1.5 s (`PaymentPage.tsx`) |
| Rider map on tracking | `GET /api/orders/:id/rider` | 15 s (`RiderCard.tsx`) |
| Rider deliveries | `GET /api/riders/me`, `GET /api/riders/me/orders` | 10 s (`RiderPage.tsx`) |

This works for one restaurant. To cut load and delay later, add Server-Sent Events or a
WebSocket for "order changed" and "new order" events.

**New-order sound:** the admin board plays a chime when an order it hasn't seen appears
with status `received`. With polling, nothing is needed server-side.

**Push notifications:** today the app shows a system notification only while it is open
in the background and its polling sees a status change. For notifications when the app
is fully closed, add Web Push:
- A VAPID key pair.
- `POST /api/push/subscribe` to store a subscription for the order or customer.
- A push from the server on each status change. The service worker already handles
  showing notifications.

---

## 10. Offline and caching

- The app shell, code and menu images are cached by the service worker, so the app opens
  without a network.
- `GET` requests whose path starts with **`/api/menu`** or **`/api/orders`** are cached
  "network first" (4 s timeout, kept 7 days), so the menu and past orders still show
  offline. Keep those path prefixes, or update `runtimeCaching` in `vite.config.ts`.
- Any image the browser loads is cached "cache first" for 30 days. Give each new photo a
  new URL rather than replacing a file at the same URL.
- The app refuses to check out or save changes while offline, so the server doesn't need
  an offline write queue.
- `/api/*` is never answered with the app's HTML (`navigateFallbackDenylist`).

---

## 11. Connecting it: suggested steps

1. **Read-only first:** `GET /api/menu`, `GET /api/settings`, `GET /api/delivery-zones`.
   Point the menu screens at the real API and keep everything else on the mock.
2. **Orders and tracking:** `POST /api/orders`, `GET /api/orders/:id`, cash payment
   only.
3. **Staff sign-in and the live board:** staff auth, `GET /api/admin/orders`,
   accept/reject/status, rider assignment.
4. **Customer sign-in:** OTP via SMS, profile, addresses, favourites, order history
   with guest linking.
5. **Mobile money and card payments**, with webhooks.
6. **The rest of admin:** menu editing with photo upload, zones, settings, promotions,
   staff, customers and feedback, reports.
7. **Rider app:** assigned orders, status, location.
8. Remove the demo-only controls ([§5.10](#510-demo-only-functions-do-not-build)) and
   seed the database from `src/api/mock/` if useful.

**Before launch, check:**
- [ ] Prices and totals recomputed on the server and matching the app.
- [ ] Every [§6](#6-error-codes) code returned where the UI expects it.
- [ ] Role checks on every admin and rider endpoint.
- [ ] Order ids unguessable, and guest access limited to the order holder.
- [ ] OTP and login rate limits.
- [ ] Payment webhooks verified and idempotent; refunds on reject or cancel.
- [ ] All dates and reports in Kigali time.
- [ ] CORS and HTTPS configured.
