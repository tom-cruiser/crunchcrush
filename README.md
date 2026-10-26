# Crunch Crust — ordering PWA (frontend)

Customer ordering app, admin dashboard and rider view for Crunch Crust (tacos and roll-eggs, Kigali). Frontend only: all data comes from a mock API in `src/api/` with simulated latency, persisted to `localStorage`.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build with service worker
npm run preview      # serve the build (needed to test install/offline)
npm run placeholders # regenerate placeholder icons and menu images
```

## Demo data

- Staff login at `/admin/login`: `owner@`, `manager@`, `cashier@`, `kitchen@`, `rider1@crunchcrust.rw`, password `demo1234` (buttons on the login page fill these in).
- Customer phone OTP: any Rwandan number, code `123456`.
- Mobile money numbers ending in `0000` and cards ending in `0002` simulate a declined payment.
- `/table/7` starts a dine-in order for table 7.
- `/dev/ui` shows the UI kit and lets you reset the demo data.

## Structure

```
src/api         Mock API. The UI imports only from `@/api`; each function notes the REST endpoint it stands in for.
src/api/mock    Seed data and the in-memory db (never imported by components).
src/components  Shared UI (ui/) and layouts (layout/).
src/features    Feature logic: auth/permissions, store hours, PWA hooks…
src/pages       Route screens, lazy-loaded.
src/store       Zustand stores: cart, auth, preferences, toasts.
src/types       Domain types.
src/i18n        i18next setup; English complete, French/Kinyarwanda fall back to English.
src/lib         Formatting (RWF, dates in Africa/Kigali), pricing, geo, data hook.
```

## Connecting a real backend

Replace the body of each function in `src/api/*.ts` with a `fetch` to the endpoint named in its comment. Signatures and types stay the same, so screens don't change. The service worker already caches `/api/menu*` and `/api/orders*` responses (network-first) for offline use.

## Brand

Black and white for now. Colours are tokens in `src/styles/index.css` (`@theme`); change them there to re-skin the app.
