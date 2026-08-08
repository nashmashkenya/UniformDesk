# UniformDesk — Supplier meeting walkthrough

Use this script to take a **supplier** through the live product.  
Companion slides (screenshots): [`presentation/UniformDesk_User_Manual.pptx`](./presentation/UniformDesk_User_Manual.pptx)  
Full ops reference: [`DESK_GUIDE.md`](./DESK_GUIDE.md)

**Time:** ~20–25 minutes live · ~10 minutes if you skip print demos  
**App:** `http://localhost:3000` (or your demo URL)  
**Password (all demo accounts):** `desk1234`

---

## Demo accounts

| Who | Email | Use for |
|-----|--------|---------|
| Supplier admin | `supply@uniformdesk.co` | Full supplier story (create school, branding, catalog) |
| Supplier staff | `staff@uniformdesk.co` | Day-to-day ops (no branding) |
| School reporter | `report@greenfield.school` | Optional: show school side of receive / stock take |

Seed school codes: **GFS** (Greenfield), **RVA** (Riverside).

---

## One-sentence pitch

UniformDesk is **supplier-led**: you own the catalog, link schools, deliver stock, co-issue on admission day, invoice, and see issued + campus stock — while the school reporter runs stock take and receives DNs.

---

## Suggested agenda (click path)

### 1. Sign in as supplier admin (2 min)

1. Open `/login` → `supply@uniformdesk.co` / `desk1234`
2. Land on **Supplier home** (`/supplier`)
3. Point out: co-issue, schools, reports, deliveries, invoices

**Say:** “This portal is yours. Schools get a simpler desk for issue and stock.”

---

### 2. Schools portfolio (3 min) — `/supplier/schools`

1. Show linked schools (GFS / RVA cards)
2. **Create school** (admin only): name + code + reporter login  
   - Or explain **link existing school** by code
3. Open **Co-issue** from a school card

**Say:** “Each school is a separate tenant. You only see schools you create or link.”

---

### 3. Catalog (2 min) — `/supplier/catalog`

1. Show SKUs, sizes, prices
2. Emphasize: **SKU must match** what the school receives into stock

**Say:** “Your catalog drives deliveries and invoices. Matching SKUs keep receive clean.”

---

### 4. Orders → Delivery note → Invoice (5 min)

| Step | Where | What to show |
|------|--------|----------------|
| Orders | `/supplier/orders` | Create / open a PO for a linked school |
| Deliveries | `/supplier/deliveries` | Pack / dispatch DN |
| DN detail | `/supplier/deliveries/[id]` | Lines, status → **Print DN** |
| Invoices | `/supplier/invoices` | Invoice from delivery |
| Invoice detail | `/supplier/invoices/[id]` | Totals → **Print invoice** |

**Say:** “Paper packs print from the browser — compact A4 portrait. School receives the DN into stock on their desk.”

*(Optional 1 min)* Log in as `report@greenfield.school` → **Deliveries** → open DN → **Receive into stock**.

---

### 5. Co-issue on campus (5 min) — `/supplier/issue`

1. Pick linked school (if more than one)
2. New student or find roster student
3. Load kit / adjust lines
4. Payment **method + reference** (no amount)
5. Confirm issue

**Say:** “Same issue flow as the school desk, against that school’s stock. The slip stays on the school; you are recorded as issuer. Use this when your team is at admission.”

Follow-up:

- **Still owed** `/supplier/incomplete` — incomplete kits → **Print list**
- Or finish remaining lines from co-issue / school issue

---

### 6. Supplier reports (3 min) — `/supplier/reports`

1. Select school if needed
2. **Issued today** — who got what, payment ref, issuer
3. Switch to **Stock on hand** — read-only campus balances  
   - School does stock take; you only view
4. **Print report** on the active view

**Say:** “Daily visibility without owning their stock take. Low stock and still owed are on the summary.”

---

### 7. Branding & staff (2 min) — admin only

1. `/supplier/branding` — name, mark, accent, support contacts  
2. Mention staff login `staff@uniformdesk.co` — same ops, **no** branding menu

---

### 8. Close (1 min)

Recap the supplier loop:

```text
Create/link school → Catalog → Order/DN → School receives
       ↓
  Co-issue at admission → Still owed → Reports + Print
       ↓
     Invoice & collect
```

Offer next steps: real school codes, branding assets, go-live checklist in [`PRODUCTION.md`](./PRODUCTION.md).

---

## Talking points (objections)

| Question | Answer |
|----------|--------|
| Do we replace the school system? | No — school reporters keep issue, stock take, receive. You own supply + co-issue. |
| Can we see other suppliers’ schools? | No. Only schools you create or link. |
| Who owns stock numbers? | The school. You view balances; they adjust / stock take. |
| Parent slips? | Not required. Method + reference only for audit. |
| Printing? | Browser print on reports, still owed, DN, invoice — A4 portrait, compact standard layout. |

---

## If the app isn’t seeded

```bash
# Prefer Node 22 in this project
.tools/node22/node.exe -v
npm run db:seed   # or your seed script
npm run dev       # with Node 22 on PATH
```

Then open `http://localhost:3000/login`.

---

## Materials to open in the meeting

| Material | Path | Use |
|----------|------|-----|
| **PDF (download)** | [`UniformDesk_Supplier_Guide.pdf`](./UniformDesk_Supplier_Guide.pdf) | Printable meeting pack |
| **This script** | `docs/SUPPLIER_DEMO.md` | Live click-through |
| **User Manual PPT** | `docs/presentation/UniformDesk_User_Manual.pptx` | Screen tour with callouts |
| **System Overview PPT** | `docs/presentation/UniformDesk_System_Overview.pptx` | Optional architecture / stakeholder brief |
| **Desk guide** | `docs/DESK_GUIDE.md` | Leave-behind ops reference |

Rebuild PDF: `python docs/build-supplier-guide-pdf.py`
