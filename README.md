# UniformDesk

**Supplier-owned** uniforms platform: stock · co-issue at admission · proof & reports.

Phase 1 is **supplier-operated**: `supplier_admin` (super user) and `supplier_staff` (issue desk). Schools are campus data sites — school operational login is closed; follow-up reports come later.

**Docs:** [`docs/ADMIN_USER_MANUAL.md`](./docs/ADMIN_USER_MANUAL.md) (admin) · [`docs/STAFF_USER_MANUAL.md`](./docs/STAFF_USER_MANUAL.md) (staff / issue desk) · [`docs/DESK_GUIDE.md`](./docs/DESK_GUIDE.md) (ops reference) · [`docs/RAILWAY.md`](./docs/RAILWAY.md) (deploy) · [`docs/PRODUCTION.md`](./docs/PRODUCTION.md) (go-live) · [`docs/presentation/`](./docs/presentation/)

## Stack

- Next.js (App Router) + TypeScript
- Prisma + **PostgreSQL** (Docker locally, GitHub Actions CI, Railway in production)
- Session auth (JWT cookie) + edge middleware + RBAC
- GitHub Actions CI on `main` / PRs

## Setup

```bash
docker compose up -d          # Postgres on localhost:5432
cp .env.example .env          # set AUTH_SECRET (DATABASE_URL already points at Docker)
npm install
npx prisma migrate deploy
npm run db:seed
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Railway deploy:** see [`docs/RAILWAY.md`](./docs/RAILWAY.md).

### Roles

| Role | Who | Access |
|------|-----|--------|
| `supplier_admin` | Supplier HQ (super user) | Schools, products, kits, supply docs, team, branding, co-issue, monitor |
| `supplier_staff` | Supplier issue desk | Co-issue, still owed, basic reports |

Default theme: **National** (institutional green & gold).

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Supplier admin | `supply@uniformdesk.co` | `desk1234` |
| Supplier staff | `staff@uniformdesk.co` | `desk1234` |

## Phase 1 routes (school)

- `/` — desk home
- `/issue` — issue desk (payment method + reference)
- `/receive` — manual receive stock
- `/stock` — balances + stock take (**Print stock**)
- `/students` — roster
- `/catalog` — items & sizes (school admin)
- `/kits` — issue kits (school admin)
- `/users` — desk accounts & roles (school admin)
- `/reports` — issued today + shortages (**Print report**)
- `/incomplete` — still to receive (**Print list**)
- `/slips/[id]` — issue record / void (browser printable)

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
- Reports & lists also print (Phase 23): school `/reports`, `/incomplete`, `/stock`; supplier `/supplier/reports`, `/supplier/incomplete`

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

## Phase 18 (supplier co-issue)

- `/supplier/issue` — linked-school admission issue desk (supplier admin/staff)
- Uses school stock + roster; slip stays on the school; issuer recorded as supplier user
- New student key-in (admission no, name, class) at co-issue desk
- `/supplier/slips/[id]` — view/print slip after co-issue
- Supplier activity includes co-issue events for slips issued by the supplier team

## Phase 19 (supplier-first roles)

- Active roles: `supplier_admin`, `supplier_staff`, `school_reporter`
- School desk simplified to **stock + issue + reports** (plus students / receive DN)
- School purchase routes (orders, reorder, invoices, catalog admin) retired → redirect home
- Legacy school roles migrated to `school_reporter`

## Phase 20 (still to receive)

- Incomplete admission kits tracked as a simple “still to receive” list
- Opened when a kit/items are issued and some quantities are short or not yet given
- `/incomplete` (school) and `/supplier/incomplete` — queue with **Issue what’s left**
- Issue desk shows owed items per student; void puts quantities back on the list

## Phase 21 (simple desk payment)

- Issue records **payment method + reference only** (no amount, no live rails)
- Parent slip / signature **not required** — issue completes with an on-screen confirmation
- Internal issue record kept for stock, still-to-receive, and staff audit

## Phase 22 (supplier reports)

- `/supplier/reports` — issued today and **read-only** campus stock for linked schools
- Links through to Still owed; school reporters keep doing stock take / adjust
- School reports/stock copy clarified (no retired reorder CTA)

## Phase 23 (printable reports + desk guide)

- **Print report / Print list / Print stock** on school and supplier report surfaces
- Print CSS: hide nav/pickers/CTAs; show report title banner; long lists can page-break
- [`docs/DESK_GUIDE.md`](./docs/DESK_GUIDE.md) — roles, issue/stock/reports, print packs

Sample student CSV: [`/sample-students.csv`](./public/sample-students.csv)
