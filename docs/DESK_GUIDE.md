# UniformDesk — supplier desk guide

Day-to-day operations for **supplier admin** and **supplier staff**. For go-live / Postgres, see [`PRODUCTION.md`](./PRODUCTION.md). For the analyst PPT, see [`presentation/README.md`](./presentation/README.md).

**Admin user manual (start here):** [`ADMIN_USER_MANUAL.md`](./ADMIN_USER_MANUAL.md) — full supplier admin guide from first setup to daily ops.  
**Admin manual PDF:** [`UniformDesk_Admin_User_Manual.pdf`](./UniformDesk_Admin_User_Manual.pdf) — rebuild with `python docs/build-admin-manual-pdf.py`.  
**Staff user manual:** [`STAFF_USER_MANUAL.md`](./STAFF_USER_MANUAL.md) — issue desk guide for supplier staff.  
**Staff manual PDF:** [`UniformDesk_Staff_User_Manual.pdf`](./UniformDesk_Staff_User_Manual.pdf) — rebuild with `python docs/build-staff-manual-pdf.py`.  
**Supplier meeting walkthrough:** [`SUPPLIER_DEMO.md`](./SUPPLIER_DEMO.md) (live demo script + logins).  
**Meeting / ops PDF:** [`UniformDesk_Supplier_Guide.pdf`](./UniformDesk_Supplier_Guide.pdf) — rebuild with `python docs/build-supplier-guide-pdf.py`.

Demo password for seed users: `desk1234`.

| Role | Login | Home |
|------|-------|------|
| Supplier admin | `supply@uniformdesk.co` | `/supplier` |
| Supplier staff | `staff@uniformdesk.co` | `/supplier` |

School operational login is closed in Phase 1. Schools are data sites; your team co-issues and runs supply. Follow-up school reports can come later.

---

## Roles at a glance

| Role | Owns | Typical work |
|------|------|----------------|
| `supplier_admin` | Full system (super user) | Schools, products, kits, deliveries, invoices, team, branding, monitor, co-issue |
| `supplier_staff` | Issue desk | Co-issue, still owed, basic reports / activity / search |

Default visual theme: **National** (institutional green & gold). Switch anytime from the theme menu.

---

## Supplier portal

### Home (`/supplier`)

- **Admin** — national supply monitor: schools, open deliveries, unpaid invoices, team size, portfolio.
- **Staff** — issue desk focus with co-issue / still owed / reports shortcuts.

### Team (`/supplier/team`) — admin only

- Create admin or staff users.
- Reset passwords.
- Deactivate users (keep at least one active admin).
- **Assign campuses to staff** (one or many). Staff only issue / still owed / report on assigned schools.
  - One campus → no school picker (auto-selected)
  - Several → picker shows only those schools
  - None → issue blocked until assigned
- Admins always see all linked schools.

### School catalogue & kits (`/supplier/schools/[id]/catalog`) — admin

- Each linked school has its **own** items, sizes, and admission kits.
- SKUs should match supplier products so DN **Post to campus stock** maps cleanly.
- After **Create school**, set up the catalogue here.

### Co-issue (`/supplier/issue`) — admin + staff

- Admission issue against a **linked** school’s stock and roster.
- Payment method + reference (no amount).
- Stock decreases; shortages open **Still owed**.

### Still owed (`/supplier/incomplete`)

- Queue of incomplete kits.
- **Issue what’s left** returns to the issue desk for that student.

### Reports (`/supplier/reports`)

- Issued today and campus stock (view-only).
- Links to Still owed.
- **Print report** — browser print; nav is hidden.

### Products (`/supplier/catalog`) — admin

- Master SKUs and prices for deliveries and invoices.

### Orders / Deliveries / Invoices — admin

On a delivery note, **Post to campus stock** (supplier admin) posts the same inbound receipt + ledger increments previously done by school receive. Required before co-issue can draw those lines. Invoice remains optional for admission day.

- School POs, pack & dispatch, bill & collect (including M-Pesa sandbox).

### Branding (`/supplier/branding`) — admin

- White-label mark, color, and support contacts.

---

## Print notes

- Prefer **A4 portrait** for slips, DNs, invoices, and report lists.
- Use the on-page **Print** control; chrome UI is hidden in print CSS.

---

## Quick route map

| Path | Who |
|------|-----|
| `/login` | Supplier admin / staff |
| `/supplier` | Both |
| `/supplier/issue` | Both |
| `/supplier/incomplete` | Both |
| `/supplier/reports` | Both |
| `/supplier/team` | Admin |
| `/supplier/schools` | Admin |
| `/supplier/catalog` | Admin |
| `/supplier/orders` | Admin |
| `/supplier/deliveries` | Admin |
| `/supplier/invoices` | Admin |
| `/supplier/branding` | Admin |
