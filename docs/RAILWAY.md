# Deploy UniformDesk on Railway

UniformDesk is a Next.js app with **Postgres** (Prisma). Use this checklist after the repo is on GitHub.

## 1. Prerequisites in the repo

- `prisma/schema.prisma` → `provider = "postgresql"`
- `src/lib/db.ts` → `@prisma/adapter-pg`
- Postgres migrations under `prisma/migrations/`
- `railway.toml` build runs `prisma migrate deploy` then `next build`

## 2. Create the Railway project

1. Open [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub** → `nashmashkenya/UniformDesk` → branch `main`
3. **Add Service → Database → PostgreSQL**

## 3. Link Postgres to the web service

On the **web** service → **Variables**:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Reference the Postgres plugin variable (Railway UI: add reference / `${{Postgres.DATABASE_URL}}`). Prefer a URL with `sslmode=require` if Railway does not add it. |
| `AUTH_SECRET` | Long random string (e.g. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your public HTTPS URL (set after generating a domain) |
| `NODE_ENV` | `production` |

## 4. Build / start

`railway.toml` already sets:

- **Build:** `npx prisma generate && npx prisma migrate deploy && npm run build`  
  (Nixpacks installs deps first — do **not** add `npm ci` here or builds can fail with `EBUSY` on `node_modules/.cache`)
- **Start:** `npm run start`
- **Health check:** `/login`

If the Railway UI has a custom build command, match the same string (or clear it so `railway.toml` wins). Railway injects `PORT`; Next.js uses it automatically.

## 5. Public domain

1. Web service → **Settings → Networking → Generate Domain**
2. Set `NEXT_PUBLIC_APP_URL` to that HTTPS origin (no trailing slash)
3. Redeploy so the client picks up the URL

## 6. First admin user

Do **not** use demo seed passwords in a live school pilot.

Options:

- Temporary: run seed once from Railway shell / one-off job, then **change all passwords** and deactivate unused users
- Preferred: a private bootstrap script that creates only your supplier admin

Local seed (dev only):

```bash
docker compose up -d
cp .env.example .env   # set AUTH_SECRET
npx prisma migrate deploy
npm run db:seed
```

## 7. Smoke test

- [ ] `/login` loads over HTTPS  
- [ ] Supplier admin can sign in  
- [ ] Team / campus assignment works  
- [ ] Co-issue creates a slip  
- [ ] Print report / DN  
- [ ] Cookies persist (secure session)

## 8. Local Postgres (dev)

```bash
docker compose up -d
# DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/uniformdesk?schema=public
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Legacy SQLite migrations are kept under `prisma/migrations_sqlite_legacy/` for history only — do not apply them to Postgres.
