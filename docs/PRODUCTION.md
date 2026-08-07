# Production cutover notes

UniformDesk runs on **SQLite locally and in CI**. Before a live pilot, move to **Postgres**.

## 1. Environment

Copy `.env.example` → production secrets store:

- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — long random value (rotate if ever leaked)
- `NEXT_PUBLIC_APP_URL` — public HTTPS origin (proof links / QR)

Do **not** seed demo passwords in production.

## 2. Switch Prisma to Postgres

1. In `prisma/schema.prisma`, set:

   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

2. Install the Postgres driver adapter:

   ```bash
   npm install @prisma/adapter-pg pg
   ```

3. Point `src/lib/db.ts` at the `pg` adapter (replace the better-sqlite3 adapter).

4. Create a fresh Postgres migration history for the target DB (or baseline from the current schema), then:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

5. Deploy the Next.js app behind HTTPS. Session cookies already set `secure` when `NODE_ENV=production`.

## 3. Ops checklist

- [ ] CI green on `main`
- [ ] Staging smoke: login → issue → void → receive DN → invoice → mark paid → open `/v/[token]`
- [ ] Database backup + restore drill
- [ ] Error monitoring (e.g. Sentry) and uptime on `/login`
- [ ] Demo accounts disabled / passwords rotated

## 4. Auth layers

| Layer | Role |
|-------|------|
| `src/middleware.ts` | Edge gate: valid JWT cookie required (except public proof/API/offline paths) |
| `requireSchoolUser` / `requireSupplierUser` | Tenant + RBAC after DB lookup |

Middleware alone is not enough for tenancy — layouts and actions still enforce school vs supplier.
