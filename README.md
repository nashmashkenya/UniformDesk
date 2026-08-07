# UniformDesk

Supplier supply · School issue · Proof for every student.

Phases 1–11: … → activity → low-stock reorder → desk search.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (local / CI); Postgres cutover guide in [`docs/PRODUCTION.md`](./docs/PRODUCTION.md)
- Session auth (JWT cookie) + edge middleware + RBAC
- GitHub Actions CI on `main` / PRs

## Setup

```bash
cp .env.example .env   # set AUTH_SECRET
npm install
npx prisma migrate dev
npm run db:seed
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Storekeeper | `store@greenfield.school` | `desk1234` |
| School admin | `admin@greenfield.school` | `desk1234` |
| Auditor | `audit@greenfield.school` | `desk1234` |
| Riverside storekeeper | `store@riverside.school` | `desk1234` |
| Supplier admin | `supply@uniformdesk.co` | `desk1234` |
| Supplier staff | `staff@uniformdesk.co` | `desk1234` |

## Phase 1 routes (school)

- `/` — desk home
- `/issue` — issue desk + signature
- `/receive` — manual receive stock
- `/stock` — balances
- `/students` — roster
- `/catalog` — items & sizes (school admin)
- `/kits` — issue kits (school admin)
- `/users` — desk accounts & roles (school admin)
- `/reports` — issued today + shortages
- `/slips/[id]` — printable proof / void

## Phase 2 routes

### Supplier (`/supplier`)

- `/supplier` — supply home
- `/supplier/catalog` — products (SKU must match school catalog)
- `/supplier/orders` — create / view orders
- `/supplier/deliveries` — pack & dispatch
- `/supplier/invoices` — invoice from delivery, mark paid

### School supply

- `/orders` — place / view supply orders
- `/deliveries` — receive against delivery (posts ledger + receipt)
- `/invoices` — view supplier invoices

Receive mapping: supplier product SKU → school catalog item SKU.

## Phase 3 routes (trust)

- `/v/[token]` — public guardian proof (no login); QR on issue slip
- Slip page — copy link / WhatsApp / SMS share
- `/reports` — audit CSV export (school admin & auditor)
- `GET /api/audit-export?from=YYYY-MM-DD&to=YYYY-MM-DD`

Set `NEXT_PUBLIC_APP_URL` (e.g. `https://your-host`) so shared proof links and QR codes use the correct base URL.

## Phase 4 routes (ecosystem)

### School Master

- `/integrations` — API key, external ID, endpoint docs (school admin)
- `POST /api/v1/roster/sync` — Bearer `udsk_…` roster upsert
- `POST /api/v1/sso/exchange` — returns short-lived `/sso?token=…` login URL
- `/sso` — consume SSO token into a desk session

### Supplier white-label + multi-school

- `/supplier/branding` — mark, color, support contacts
- `/supplier/schools` — portfolio cards + link school by code
- List pages accept `?schoolId=` filter from the portfolio

## Phase 5 routes (payments)

- Invoice detail — record cash/bank payment or start M-Pesa STK (sandbox)
- Invoice auto-marks `paid` when completed payments cover the balance
- `GET|POST /api/v1/payments/mpesa/callback` — Daraja-shaped webhook + sandbox simulate link
- Payment provider port in `src/modules/payments/provider.ts` (swap for live Daraja later)

## Phase 6 (offline / PWA)

- Installable PWA (`/manifest.webmanifest`, production service worker)
- Issue desk queues slips in IndexedDB when offline or the server is unreachable
- Desk banner shows queue count + **Sync now**; auto-syncs on `online`
- `POST /api/v1/issue` — JSON issue API used by live submit and queue flush
- `/offline` fallback page when navigation fails without cache

## Phase 7 (domain tests)

```bash
npm test
```

Vitest suite under `tests/` covers the spine invariants:

- Issue requires signature; stock down + ledger `issue`
- Partial issue records shortage
- Void requires reason; stock restored + ledger `void`
- Cross-school void blocked
- Receive-against-delivery posts stock; double-receive blocked
- Manual payment settles invoice when balance covered
- Stock adjust requires reason; cannot go negative

## Phase 8 (desk polish)

- `/students/[id]` — student issue history (slips, shortages, voids)
- `/stock` — adjust stock (+/−) with required reason + recent ledger feed

## Phase 9 (activity timeline)

- `/activity` — school audit feed (issue, void, receive, delivery receive, adjust, shortage)
- Each row includes a **correlation id** (slip no / ledger id / delivery ref) for support

## Phase 10 (low-stock reorder)

- `/reorder` — suggest PO lines for low stock, match school SKU → supplier product, create order
- Stock page CTA: **Reorder low stock**
- Unmatched sizes (no supplier SKU/size) are listed but not orderable

## Phase 11 (desk search)

- `/search?q=` — students, slips, deliveries, orders, invoices
- Top-bar search (desktop) + Ops → Search

## Phase 12 (print packs)

- Delivery detail — printable delivery note (supplier + school) with sign-off lines
- Invoice detail — printable invoice sheet (supplier + school)
- Browser print hides nav, payments, and receive actions (`Print DN` / `Print invoice`)

## Phase 13 (supplier search)

- `/supplier/search?q=` — schools, products, orders, deliveries, invoices
- Top-bar search on supplier portal + More → Search

## Phase 14 (cold offline issue)

- Desk home + issue page cache roster/kits/stock into IndexedDB
- `GET /api/v1/issue-desk` — JSON snapshot used for prefetch
- `/issue-offline` — cached issue desk (no server round-trip)
- `/offline` offers **Open cached issue desk** when a snapshot exists
- Offline queue adjusts local on-hand so successive issues see updated stock

## Phase 15 (notifications)

- `/notifications` — school attention feed (low stock, unpaid invoices, inbound DNs, open orders)
- `/supplier/notifications` — dispatch, collect, open orders
- Top-bar bell badge + home **Needs attention** strip

## Phase 16 (supplier activity)

- `/supplier/activity` — supply timeline (orders, pack/dispatch/delivered, invoices, payment confirmations)
- Correlation IDs (PO / DN / INV / PAY) for support
- More menu → Activity

## Phase 17 (production hardening)

- `.env.example` — required env vars documented
- Edge middleware — JWT session gate (public: login, proof, offline, School Master / M-Pesa APIs)
- GitHub Actions CI — `prisma migrate deploy` + `npm test` + `npm run build`
- [`docs/PRODUCTION.md`](./docs/PRODUCTION.md) — Postgres cutover + go-live checklist

Sample student CSV: [`/sample-students.csv`](./public/sample-students.csv)
