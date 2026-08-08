# UniformDesk — desk & supplier guide

Day-to-day operations for **school reporters** and **supplier** staff. For go-live / Postgres, see [`PRODUCTION.md`](./PRODUCTION.md). For the analyst PPT, see [`presentation/README.md`](./presentation/README.md).

**Supplier meeting walkthrough:** [`SUPPLIER_DEMO.md`](./SUPPLIER_DEMO.md) (live demo script + logins).  
**Downloadable PDF:** [`UniformDesk_Supplier_Guide.pdf`](./UniformDesk_Supplier_Guide.pdf) — rebuild with `python docs/build-supplier-guide-pdf.py`.

Demo password for all seed users: `desk1234`.

| Role | Login | Home |
|------|-------|------|
| Supplier admin | `supply@uniformdesk.co` | `/supplier` |
| Supplier staff | `staff@uniformdesk.co` | `/supplier` |
| School reporter | `report@greenfield.school` | `/` |

---

## Roles at a glance

| Role | Owns | Typical work |
|------|------|----------------|
| `supplier_admin` | Server, catalog, school links, branding | Catalog, schools portfolio, deliveries, invoices, co-issue, reports |
| `supplier_staff` | Ops under the supplier | Pack/dispatch, invoices, co-issue, reports |
| `school_reporter` | Campus stock & admission issue | Issue desk, stock take, receive DN, campus reports |

School purchase routes (orders / reorder / school invoices / catalog admin) are **retired** — they redirect home. Supply buying stays on the supplier side.

---

## School desk

### Issue (`/issue`)

1. Find or key in a student (admission no, name, class).
2. Choose kit / lines and quantities.
3. Record **payment method + reference** (no amount).
4. Confirm — no parent signature / slip required.
5. Stock decreases; shortages open **Still to receive**.

### Still to receive (`/incomplete`)

- Queue of incomplete kits.
- **Issue what’s left** returns to the issue desk for that student.
- **Print list** for a paper follow-up queue.

### Stock (`/stock`)

- On-hand balances + recent ledger.
- **Stock take / adjust** with a reason (e.g. `Stock take`, `Damage`).
- **Print stock** for counting sheets.
- Supplier can **view** these balances (read-only) under supplier reports.

### Reports (`/reports`)

- Issued today (with payment method/ref when recorded).
- Shortage lines.
- Audit CSV export (when the role allows).
- Links to Still owed and Stock take.
- **Print report** — browser print; nav and export form are hidden.

### Deliveries (`/deliveries`)

- Receive against a supplier DN (posts ledger).
- **Print DN** on the detail page.

---

## Supplier portal

### Co-issue (`/supplier/issue`)

- Same admission flow as the school desk, against a **linked** school’s stock and roster.
- Slip stays on the school; issuer is the supplier user.
- Use when supplier staff are on campus at admission.

### Reports (`/supplier/reports`)

Pick a linked school, then:

| View | Contents |
|------|----------|
| Issued today | Who received what, payment method/ref, issuer |
| Stock on hand | Read-only campus balances (school does stock take) |

- Summary chips: issued today, still owed, stock lines, low stock.
- Link to **Still owed** for the full incomplete list.
- **Print report** prints the active view (issued or stock) plus summary.

### Still owed (`/supplier/incomplete`)

- Incomplete kits for a linked school.
- **Print list** for campus follow-up.

### Supply docs (print packs)

| Document | Where | Button |
|----------|-------|--------|
| Delivery note | `/supplier/deliveries/[id]` | Print DN |
| Invoice | `/supplier/invoices/[id]` | Print invoice |

Browser print hides nav, payments, and action buttons. Same pattern as reports.

---

## Printing

All printable surfaces use the shared **Print** control (`window.print()`):

1. Open the report or document.
2. Choose school / view if needed (supplier).
3. Click **Print report**, **Print list**, **Print stock**, **Print DN**, or **Print invoice**.
4. Use the browser print dialog (PDF or paper).

Printed pages include a title banner (tenant, school, timestamp). Screen-only chrome (nav, school picker, view toggles, CTAs, audit export) is hidden.

---

## Payment & audit notes

- Desk payment stores **method + reference only** — no live payment rails or amount field.
- Internal issue records remain for stock, still-to-receive, and staff audit.
- School `/reports` can export a CSV of issue lines (date range) for auditors.

---

## Quick route map

| Need | School | Supplier |
|------|--------|----------|
| Issue uniforms | `/issue` | `/supplier/issue` |
| Incomplete kits | `/incomplete` | `/supplier/incomplete` |
| Stock / stock take | `/stock` | (view via `/supplier/reports` → Stock) |
| Daily reports | `/reports` | `/supplier/reports` |
| Receive / pack DN | `/deliveries` | `/supplier/deliveries` |
| Invoices | — | `/supplier/invoices` |
