# Production cutover notes

UniformDesk uses **PostgreSQL** (local Docker, CI, and Railway). SQLite is no longer the runtime database; old SQLite migrations live in `prisma/migrations_sqlite_legacy/` for reference only.

## 1. Environment

Copy `.env.example` → secrets store:

- `DATABASE_URL` — Postgres connection string (`sslmode=require` on managed hosts)
- `AUTH_SECRET` — long random value (rotate if ever leaked)
- `NEXT_PUBLIC_APP_URL` — public HTTPS origin (proof links / QR)

Do **not** ship demo passwords (`desk1234`) to a live pilot without rotating them.

## 2. Database

```bash
docker compose up -d                 # local
npx prisma migrate deploy
npx prisma generate
# optional demo data:
npm run db:seed
```

Runtime client: `src/lib/db.ts` (`@prisma/adapter-pg` + `pg` Pool).

## 3. Railway

See the full checklist: [`RAILWAY.md`](./RAILWAY.md).

## 4. Ops checklist

- [ ] CI green on `main`
- [ ] Staging smoke: login → co-issue → still owed → DN/invoice → print
- [ ] Train staff using [`DESK_GUIDE.md`](./DESK_GUIDE.md)
- [ ] Database backup + restore drill
- [ ] Error monitoring and uptime on `/login`
- [ ] Demo accounts disabled / passwords rotated

## 5. Auth layers

| Layer | Role |
|-------|------|
| `src/middleware.ts` | Edge gate: valid JWT cookie required (except public proof/API/offline paths) |
| `requireSchoolUser` / `requireSupplierUser` | Tenant + RBAC after DB lookup |
| Staff campus assignments | Staff may only issue/report on assigned schools |

Middleware alone is not enough for tenancy — layouts and actions still enforce school vs supplier.
