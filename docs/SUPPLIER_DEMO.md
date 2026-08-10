# UniformDesk — Supplier meeting walkthrough

Use this script to take a **supplier** through the live product.  
Companion slides (screenshots): [`presentation/UniformDesk_User_Manual.pptx`](./presentation/UniformDesk_User_Manual.pptx)  
Full ops reference: [`DESK_GUIDE.md`](./DESK_GUIDE.md)

**Time:** ~20–25 minutes live · ~10 minutes if you skip print demos  
**App:** `http://localhost:3000` (or your demo URL)  
**Password (all demo accounts):** `desk1234`  
**Default theme:** National (institutional green & gold)

---

## Demo accounts

| Who | Email | Use for |
|-----|--------|---------|
| Supplier admin | `supply@uniformdesk.co` | Full story (schools, team, branding, supply docs) |
| Supplier staff | `staff@uniformdesk.co` | Issue desk only (co-issue, still owed, reports) |

School operational login is closed. Seed school codes remain **GFS** / **RVA** as campus data.

---

## One-sentence pitch

UniformDesk is **supplier-owned**: your admins run schools, catalogues, deliveries, and invoices; your staff co-issue on admission day; schools are sites in the data — follow-up reports come later.

---

## Suggested agenda (click path)

### 1. Sign in as supplier admin (2 min)

1. Open `/login` → `supply@uniformdesk.co` / `desk1234`
2. Land on **National supply monitor** (`/supplier`)
3. Point out: co-issue, schools, reports, team, deliveries, invoices
4. Optional: theme menu shows **National** as the institutional default

**Say:** “This portal is yours. Admin monitors everything; staff only get the issue desk.”

---

### 2. Team (2 min) — `/supplier/team`

1. Show directory (admin + staff)
2. Point at staff campus chips (demo staff is **GFS only**)
3. Assign a second campus (RVA) or create staff with several campuses
4. Reset password / deactivate (keep ≥1 admin)

**Say:** “Staff only see schools you assign. One campus — no picker. Several — picker of those only.”

---

### 3. Schools portfolio (3 min) — `/supplier/schools`

1. Show linked schools (GFS / RVA cards)
2. **Create school** (admin): name + code only — auto-linked, no school login
3. Open **Catalogue & kits** — each school has its own items/kits
4. Open **Co-issue** from a school card

**Say:** “Each school is a separate campus with its own catalogue. Your team operates the desk.”

---

### 4. Catalogues (3 min)

1. **School catalogue** `/supplier/schools/[id]/catalog` — items + admission kits  
2. **Supplier products** `/supplier/catalog` — master SKUs/prices for DNs & invoices  
3. Emphasize: **school item SKU must match** supplier product SKU for DN receive

**Say:** “Girls’ and boys’ kits can differ per school. Your product list drives supply documents.”

---

### 5. Orders → Delivery note → Invoice (5 min) — admin

| Step | Where | What to show |
|------|--------|----------------|
| Orders | `/supplier/orders` | Create / open a PO for a linked school |
| Deliveries | `/supplier/deliveries` | Pack / dispatch DN |
| DN detail | `/supplier/deliveries/[id]` | Lines → **Print DN** |
| Invoices | `/supplier/invoices` | Invoice from delivery |
| Invoice detail | `/supplier/invoices/[id]` | Totals → **Print invoice** |

**Say:** “Paper packs print from the browser — compact A4 portrait. Stock lands on the campus ledger when you receive against the DN in ops.”

---

### 6. Co-issue on campus (5 min) — `/supplier/issue`

1. Pick linked school (if more than one)
2. New student or find roster student
3. Load kit / adjust notes
4. Payment **method + reference** (no amount)
5. Confirm issue

Also show staff login briefly: same issue paths, **no** schools / team / invoices menus.

Follow-up:

- **Still owed** `/supplier/incomplete`
- **Reports** `/supplier/reports` — issued today + stock view

---

### 7. Branding (1 min) — admin only

`/supplier/branding` — name, mark, accent, support contacts

---

### 8. Close (1 min)

```text
Create/link school → Catalogue → Order/DN → Invoice
       ↓
  Co-issue at admission → Still owed → Reports + Print
       ↓
     Team & branding (admin)
```

Offer next steps: real school codes, branding assets, go-live checklist in [`PRODUCTION.md`](./PRODUCTION.md).

---

## Talking points

| Question | Answer |
|----------|--------|
| Do schools log in every day? | Not in Phase 1 — your admin/staff run the desk. School follow-up reports come later. |
| Who is the super user? | `supplier_admin` — create users, reset passwords, deactivate, full monitor. |
| What can staff do? | Co-issue, still owed, basic reports — not schools, products, or billing. |
| Can we see other suppliers’ schools? | No. Only schools you create or link. |
| Printing? | Browser print on reports, still owed, DN, invoice — A4 portrait. |

---

## If the app isn’t seeded

```bash
# Prefer Node 22 in this project
.tools/node22/node.exe -v
npm run db:seed
npm run dev
```

Then open `http://localhost:3000/login`.
