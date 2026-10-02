# SME Delivery Tracker

A lightweight dispatch and last-mile delivery tracking app for small businesses and distributors. An admin/dispatcher creates orders and assigns riders, riders update delivery status from their phone, and customers get a public tracking link — no account required — showing live status, a map, and a simulated notification log.

Built as a portfolio project targeting a real pain point for SMEs in Sierra Leone / West Africa, who typically coordinate deliveries over WhatsApp and phone calls with no visibility for anyone involved.

## Stack

- **Next.js 16** (App Router, TypeScript) — single full-stack app, Route Handlers for the API
- **PostgreSQL** via **Prisma 7** (new TypeScript client + `@prisma/adapter-pg` driver adapter)
- **NextAuth v4** (Credentials provider, JWT sessions) for staff/rider auth
- **Tailwind CSS 4**
- **Leaflet + OpenStreetMap** for maps (no API key required)

### Realism level (by design)

- **Notifications** (SMS/WhatsApp) are **real when configured, simulated otherwise** — see "Real SMS/WhatsApp" below.
- **GPS tracking** is **simulated** — no device geolocation or background workers. A rider's live position is computed on every read by interpolating between pickup/dropoff coordinates based on elapsed time since `IN_TRANSIT` started (see [lib/tracking.ts](lib/tracking.ts)).
- **Proof-of-delivery photos** are stored on the local filesystem under `public/uploads/proofs`. This **will not persist on ephemeral hosts** like Vercel — fine for local demo/screen-recording; swap in S3/Cloudinary before deploying for real.

## Phase 1 features (on top of the core dispatch/tracking MVP)

- **Ratings & reviews** — customers rate a delivery (1-5 stars + comment) from the public tracking page once it's `DELIVERED`; rider average rating shows on the dashboard and rider detail pages.
- **In-app chat** — a polling-based (~5s, no websockets) message thread per order, shared by staff, the assigned rider, and the customer (via their tracking-code page, no login).
- **CSV batch order upload** — `/dashboard/orders/import`: download the template, fill many rows, upload — each row reuses the same `createOrder()` path as the single-order form, so tracking codes, notifications, and events all work identically.
- **Scheduled delivery** — an optional `scheduledFor` time on order creation, shown as a badge in the order list.
- **Address autocomplete** — `LocationPicker` proxies through `/api/geocode` to OpenStreetMap's Nominatim (free, no API key), server-side only per Nominatim's usage policy (proper `User-Agent`, never called directly from the browser).
- **Driver earnings** — each order gets a `deliveryFee` (auto-suggested from distance via [lib/earnings.ts](lib/earnings.ts), editable by staff); riders see a running total at `/rider/earnings`.
- **Real SMS/WhatsApp (optional)** — see below.

### Real SMS/WhatsApp

[lib/smsProvider.ts](lib/smsProvider.ts) wraps Twilio. With no credentials set, every notification stays simulated exactly as before — nothing to configure for local dev. To send real messages, set in `.env`:
```
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_SMS_FROM="+1..."          # a Twilio SMS-capable number
TWILIO_WHATSAPP_FROM="+1..."     # a Twilio WhatsApp sender (e.g. the sandbox number)
```
Each `Notification` row records what actually happened via `deliveryMode` (`SIMULATED` / `SENT` / `FAILED`), shown as a small badge next to the message in the notification log.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start a local Postgres instance (no Docker needed — Prisma 7 ships its own local dev server):
   ```bash
   npx prisma dev
   ```
   This prints a `DATABASE_URL`. The one already in `.env` matches the default port (`51214`); if it ever changes, run `npx prisma dev ls` and update `.env`.

3. Push the schema and generate the client:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
   (Use `db push` rather than `migrate dev` — the shadow-database step in `migrate dev` currently errors against Prisma's local dev server. `db push` is fine for a project at this stage.)

4. Seed demo data (admin, dispatcher, 3 riders, 4 customers, 6 orders covering every status):
   ```bash
   npm run db:seed
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (or pass `-p 3001` etc. if that port's already taken by something else on your machine).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin123! |
| Dispatcher | dispatcher@example.com | Admin123! |
| Rider | ibrahim.rider@example.com | Admin123! |
| Rider | fatmata.rider@example.com | Admin123! |
| Rider | mohamed.rider@example.com | Admin123! |

Customers don't have accounts — track any seeded order from the landing page using its tracking code (visible in the dashboard's order list, format `TRK-XXXXXXXX`).

## App structure

- `/` — landing page with a "track your order" box
- `/login` — staff/rider sign-in
- `/track/[trackingCode]` — public tracking page (no auth): status, map, timeline, chat, rating, notification log
- `/dashboard` — admin/dispatcher: overview, order list/detail/create/import (CSV), rider list/detail/create
- `/rider` — rider: assigned deliveries, status updates, proof-of-delivery upload, chat, `/rider/earnings`

Order lifecycle: `PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED` (or `FAILED`/`CANCELLED` at various points). See [lib/permissions.ts](lib/permissions.ts) for exactly who can perform which transition.

## Notes on the Next.js 16 / Prisma 7 upgrade

This was scaffolded with `create-next-app` on a version newer than typical AI training data, so a couple of things differ from older Next.js/Prisma tutorials you might find:

- Route/page `params` (and `searchParams`) are `Promise`s everywhere — always `await params`.
- Middleware was renamed: `middleware.ts` → **`proxy.ts`**, exporting `proxy()` instead of `middleware()`.
- Prisma's new TypeScript client generator (`provider = "prisma-client"`) outputs to a custom path (`lib/generated/prisma`, gitignored) and **requires a driver adapter** — see [lib/prisma.ts](lib/prisma.ts) using `@prisma/adapter-pg`.

## Known limitations (intentional, for a v1 portfolio build)

- No real GPS — see "Realism level" above (SMS/WhatsApp *can* be real if Twilio is configured).
- Proof-of-delivery photos use local disk storage.
- No multi-tenancy, payments, USSD/SMS order fallback, or websockets — polling is used instead of real-time push. See the product roadmap for what's next (Phase 2: mobile money, USSD fallback, offline-first rider app).

### `prisma dev` stability

Prisma's local dev Postgres server (early-access tooling as of Prisma 7) occasionally drops its connection under sustained load — you may see a `P1017`/"Connection terminated unexpectedly" error in a long-running session. It's harmless; just re-run the request. If it happens often, restart the server:
```bash
npx prisma dev rm default --force
npx prisma dev -d
npx prisma db push
```
For a more stable long-running setup, swap in a real local Postgres (Docker `postgres:16` or a free Neon/Supabase instance) and point `DATABASE_URL` at it instead — no other code changes needed.
