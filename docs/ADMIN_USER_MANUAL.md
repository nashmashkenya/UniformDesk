# UniformDesk — Supplier Admin User Manual

**PDF:** [`UniformDesk_Admin_User_Manual.pdf`](./UniformDesk_Admin_User_Manual.pdf) — rebuild with `python docs/build-admin-manual-pdf.py`.

A simple guide for the **supplier admin** (super user).  
Use this for first setup, training, or looking up a setting.

**Who this is for:** people who log in as **supplier admin**  
**App home after login:** `/supplier`  
**Live example:** `https://your-domain/login`

---

## Contents

1. [What UniformDesk is](#1-what-uniformdesk-is)
2. [Abbreviations and terms](#2-abbreviations-and-terms)
3. [The short path (use this)](#3-the-short-path-use-this)
4. [Sign in and find your way around](#4-sign-in-and-find-your-way-around)
5. [First-time setup (do this once)](#5-first-time-setup-do-this-once)
6. [Team and campus access](#6-team-and-campus-access)
7. [Schools](#7-schools)
8. [School catalogue and kits](#8-school-catalogue-and-kits)
9. [Supplier products](#9-supplier-products)
10. [Deliveries and campus stock](#10-deliveries-and-campus-stock)
11. [Orders and invoices (optional)](#11-orders-and-invoices-optional)
12. [Co-issue on admission day](#12-co-issue-on-admission-day)
13. [To finish](#13-to-finish)
14. [Reports](#14-reports)
15. [Activity, notifications, and search](#15-activity-notifications-and-search)
16. [Branding and look](#16-branding-and-look)
17. [Printing](#17-printing)
18. [Daily rhythm (recommended)](#18-daily-rhythm-recommended)
19. [Common questions](#19-common-questions)
20. [Quick menu map](#20-quick-menu-map)

---

## 1. What UniformDesk is

UniformDesk is your **supplier operations portal** for school uniforms.

As **admin**, you:

- Own the schools linked to your organisation
- Set up products, school catalogues, and admission kits
- Create and manage your team (admins and staff)
- Decide which campuses each staff member can work on
- Create delivery notes and **post stock to campus**
- Co-issue uniforms on admission day
- Monitor stock and issued reports
- (When needed) run orders and invoices

**Important Phase 1 rule:** schools do **not** log in for day-to-day work. Your supplier team runs the desk. Schools are campuses in the data.

| Role | What they can do |
|------|------------------|
| **Admin (you)** | Setup, team, stock posting, supply documents, monitor, issue |
| **Staff** | Issue, still owed, basic reports — only on campuses you assign |

---

## 2. Abbreviations and terms

UniformDesk uses short labels on screens, search, and printouts. Meanings:

| Abbreviation / term | Meaning |
|---------------------|---------|
| **SKU** | **S**tock **K**eeping **U**nit — the product code (e.g. `BLZ-NVY`). School catalogue SKUs should match supplier product SKUs. |
| **DN** | **D**elivery **N**ote — the packing document. Numbers look like `DN-2026-…`. |
| **Post to campus stock** | Admin action on a DN that posts lines to the school ledger so co-issue can draw stock. **Required for issue.** No school login needed. |
| **PO** | **P**urchase **O**rder — optional planning document before a DN. Search may show `PO-…`. Menu: **Orders**. |
| **INV** | **Inv**oice — optional bill for a delivery. Numbers look like `INV-…`. Not required for co-issue. |
| **KES** | Kenyan Shilling — currency for unit prices and invoice amounts. |
| **M-Pesa** | Mobile money. On issue you store method + reference; on invoices you can send an **STK** prompt. |
| **STK** | **S**IM **T**oolkit prompt — M-Pesa push to a phone (invoice collection). |
| **Campus** | A **school** linked to your organisation — where stock and co-issue happen. |
| **Co-issue** | Issuing the admission kit to a student at the campus. |
| **To finish** | Students whose kit is not fully given yet |
| **Kit** | A named admission set (e.g. Form 1 Girls) with default items and quantities. |
| **Slip** | The issue record / printout created when you co-issue a student. |
| **Ref / reference** | Receipt number, M-Pesa code, or bank reference stored with payment method (not an amount on issue). |

School **codes** (e.g. `GFS`, `NHS`) are short IDs you choose — not fixed system abbreviations.

---

## 3. The short path (use this)

You do **not** need the full Orders → Deliveries → Invoices loop to run admission day.

**Golden path for go-live**

```text
Login → Create school → Products → Select products onto school + 1 kit
     → Delivery note → Post to campus stock
     → Team (if staff will issue) → Test Issue
```

**Admission day**

```text
Staff (or you): Issue → Student → Kit → Method/Ref → Confirm
             → To finish only if short
```

| Needed for issue day | Can wait |
|----------------------|----------|
| School + catalogue SKUs + kit | Branding polish |
| Products (matching SKUs) | Purchase orders (PO) |
| DN + **Post to campus stock** | Invoices / M-Pesa STK |
| Staff campus assignment (if not you issuing) | |

Standards that stay: campus ledger, slip with issuer name, payment method at the desk, admin vs staff roles, campus access for staff.

---

## 4. Sign in and find your way around

### Sign in

1. Open the app login page (for example `https://your-domain/login`)
2. Enter your **admin** email and password
3. You land on **Home** (`/supplier`) — the operations monitor

If login fails with a message about school desk being closed, you are using a school account. Use a supplier admin or staff account instead.

### Main navigation (admin)

Menus follow the work: **daily desk** on the top bar, **setup in order** under More.

**Top / primary links** (daily desk)

| Menu | Purpose |
|------|---------|
| **Home** | Setup path + overview |
| **Issue** | Co-issue uniforms at a campus |
| **To finish** | Students with leftover kit items |
| **Reports** | Issued today and campus stock |

**More menu** (setup → optional billing → team)

| Menu | Purpose |
|------|---------|
| **Schools** | 1. Create/link schools, open catalogues |
| **Products** | 2. Master SKUs and prices |
| **Deliveries** | 3. Create DNs and **post to campus stock** |
| **Orders** | Optional purchase orders |
| **Invoices** | Optional billing and collection |
| **Team** | Users, passwords, campus access |
| **Branding** | Logo mark, colours, support contacts |
| **Activity** | Timeline of what happened |
| **Notifications** | Alerts (e.g. DNs waiting for stock post) |
| **Search** | Find schools, SKUs, orders, DNs, invoices |

### Theme

Use the **theme** control in the header to switch look (default is **National** — institutional green and gold). Personal display preference only.

### Sign out

Open your account menu → **Sign out**.

---

## 5. First-time setup (do this once)

Follow this order the first time you go live. Skip steps you already finished. Branding and team can wait until after stock is posted if you will issue yourself.

### Step A — Add a school

1. Open **Schools**
2. **Create a school** — name + short code (e.g. `NHS`) → auto-linked  
   or **Link an existing school** by code
3. Open that school’s **Catalogue & kits** next

### Step B — Add supplier products

1. Open **More → Products**
2. Add each **SKU** (stock keeping unit / product code):
   - SKU (must match school item SKU later)
   - Name, category, sizes, unit price (**KES**)
3. Click **Add product**

### Step C — School catalogue and kits

1. **Schools** → school → **Catalogue & kits**
2. **Items** — tick products from your master list → **Add … to school**  
   (SKU, name, and sizes copy automatically — no retyping)
3. **Kits** — create at least one admission kit; pick lines from those school items

### Step D — Delivery note + post stock

1. **More → Deliveries** → create a DN for the school (lines = products, sizes, qty)
2. Open the DN → click **Post to campus stock**
3. Confirm **Reports → Stock on hand** shows the sizes

Optional: create an **Order** first, then “Create delivery from order”. Not required.

### Step E — Team (if staff will issue)

1. **More → Team** → add staff with temporary password
2. Tick campuses → **Create user** / **Save campuses**
3. Share the password securely

### Step F — Branding (optional)

**More → Branding** — brand name, mark, colour, support contacts → **Save branding**.

### Step G — Smoke test

1. **Issue** → pick school → test student → kit → method/ref → confirm  
2. Check **Reports → Issued today**  
3. Check **To finish** if you left a shortage  

You are ready for live admission. Invoice when you are ready to bill — not before.

---

## 6. Team and campus access

**Path:** More → **Team**

### Create a user

| Field | Notes |
|-------|--------|
| Full name | Display name on slips/activity |
| Email | Login email (unique) |
| Role | Admin = full system · Staff = issue desk |
| Temporary password | At least 8 characters |
| Campus access (staff only) | Tick one or more linked schools |

Staff **must** have at least one campus when you create them.

### Assign or change campuses (staff)

On each staff card:

1. Tick / untick campuses under **Campus access**
2. Click **Save campuses**

| Staff campuses | What they see on Issue / To finish / Reports |
|----------------|-----------------------------------------------|
| **One** | That school only — no school picker |
| **Several** | Picker shows only their schools |
| **None** | Cannot issue until you assign campuses |

Admins always see **all linked schools**. You do not assign campuses to admins.

### Reset a password

On the person card → enter **New password** → **Reset**.

### Activate / deactivate

Use **Deactivate** / **Activate** on the card.  
You cannot deactivate yourself.  
The system keeps at least **one active admin**.

---

## 7. Schools

**Path:** **Schools**

### Create a school

1. Enter school name and code (2–12 letters/numbers, e.g. `GFS`)
2. Click **Create school**
3. Open **Catalogue & kits** next

Creating a school **auto-links** it to your organisation. No school login is created.

### Link an existing school

1. Enter the school code  
2. Click **Link school**

### School cards

Each linked school shows open work plus shortcuts to catalogue, co-issue, and supply screens.

---

## 8. School catalogue and kits

**Path:** Schools → [school] → **Catalogue & kits**

Each school has its **own** items and kits.

### Items

1. Open the **Items** tab
2. Under **Add from products**, tick the products this school uses
3. Click **Add … to school** — SKU, name, and sizes copy from Products
4. Products already on the school are hidden from the list
5. To change an item later: open **Edit item** on the card → update SKU / name / category → **Save item**
6. Add extra sizes with **Add size**, or use **Add a custom item** only for a school-only SKU

### Kits (admission sets)

1. Open the **Kits** tab
2. Name the kit (e.g. `Form 1 Girls`), set academic year
3. Add lines: **select** a school item (dropdown) + default quantity → save
4. To change a kit later: open **Edit kit** on the card → change name, year, or lines → **Save kit**
5. Use **Deactivate** if the kit should no longer appear on Issue

Kits are what the co-issue desk loads quickly for a new student.

---

## 9. Supplier products

**Path:** More → **Products**

Master price list for delivery notes (and for orders/invoices when you use them).

Add: SKU, name, category, sizes (comma-separated), unit price (KES).

Keep SKUs aligned with school catalogue items.

---

## 10. Deliveries and campus stock

**Path:** More → **Deliveries** (`/supplier/deliveries`)

This is the **critical supply step** for admission day.

### Create a delivery note (DN)

1. Choose school (or create from an order if you used one)  
2. Add product lines (size + qty)  
3. Optionally tick **Mark as in transit**  
4. **Create delivery**

### Post to campus stock (required)

1. Open the DN  
2. Check catalogue match (every line needs a matching school **SKU**)  
3. Optional note → click **Post to campus stock**

What happens:

- An inbound receipt is created (your name as poster)  
- Campus stock balances increase  
- DN status becomes **delivered**  
- Co-issue can draw those sizes  

You do **not** need a school login. Staff cannot post stock — only admin.

If posting fails with a SKU error, add the matching item under **Catalogue & kits**, then try again.

### Other DN actions

| Action | When |
|--------|------|
| **Mark in transit** | Optional tracking while still packed |
| **Print DN** | Paper pack / proof |
| **Create invoice** | When you are ready to bill (not required for issue) |

**Notifications** may show **Post stock DN-…** for DNs that are not yet posted.

---

## 11. Orders and invoices (optional)

These support planning and billing. They are **not** required before co-issue.

### Orders (`/supplier/orders`) — purchase orders (PO)

1. Choose school → add lines → **Create order**  
2. Later: open order → create a delivery from it, or cancel  

Skip Orders if you prefer to create a DN directly.

### Invoices (`/supplier/invoices`) — bills (INV)

1. From a DN → **Create invoice**, or open Invoices  
2. Print if needed  
3. Collect: **Record payment** (cash / bank / other + reference) or **M-Pesa STK** (sandbox/test)  

Desk payment on **Issue** (method + reference) is separate from invoice collection.

---

## 12. Co-issue on admission day

**Path:** **Issue**

### Before you start

- School linked; catalogue + kit exist  
- DN posted to campus stock for the sizes you will issue  
- Staff (if not you) assigned to that campus  

### Issue steps

1. Open **Issue**  
2. Pick campus if you manage several schools  
3. Find or enter the student (optional parent name / phone)  
4. Load a kit or adjust lines  
5. Tick **Issue now** or untick to **Hold** per line  
6. Enter **payment method**, **reference**, optional **KES amount**  
7. Confirm  

What happens: slip with your name as issuer; issued lines reduce stock; held/short lines open **To finish** with reason. Slip shows a **parent receipt summary** (received vs pending).

### Reports for fulfilment

- **Paid not collected** — paid/deposit lines still owed (aging)  
- **Cash-up** — today’s desk payments by method / amount

---

## 13. To finish

**Path:** **To finish** (top bar) — also from Reports

Students who have not received their full uniform.

1. Search or filter the list  
2. Tap **Finish**  
3. Give remaining items, then you return to the list  
4. **Print list** for paper follow-up  

If the chip says **No stock**, post a DN to campus stock first.  

---

## 14. Reports

**Path:** **Reports**

| View | What you see |
|------|----------------|
| **Issued today** | Who received what, payment method/ref, issuer |
| **Stock on hand** | Campus balances (view-only) |

Use **Print report** for clean A4 (nav hidden).

---

## 15. Activity, notifications, and search

### Activity

**More → Activity** — timeline of supply and co-issue events.

### Notifications

**More → Notifications** — open work such as DNs waiting for **Post stock**, unpaid invoices, open orders.

### Search

**More → Search** — type at least 2 characters for schools, products by **SKU**, or **PO-…** / **DN-…** / **INV-…** numbers.

---

## 16. Branding and look

**Path:** More → **Branding**

| Setting | Effect |
|---------|--------|
| Brand name | Portal display name |
| Mark | Short letters in nav / documents |
| Primary colour | Accent colour |
| Support email / phone | Shown on slips/documents when set |

Theme (National / Fluent / etc.) is separate — header theme menu.

---

## 17. Printing

Use the on-page **Print** button (hides menus). Prefer **A4 portrait**.

| Document | Where |
|----------|--------|
| Issue slip | Slip detail |
| To finish list | To finish |
| Issued / stock report | Reports |
| Delivery note (DN) | Delivery detail |
| Invoice (INV) | Invoice detail |

---

## 18. Daily rhythm (recommended)

### Morning / prep

1. Notifications — post any DNs still waiting for stock  
2. Reports → Stock — note tight sizes  
3. Confirm staff campus assignments  

### During admission

1. Staff (or you) on **Issue**  
2. Watch **To finish**  
3. Admin monitors Home / Activity  

### End of day

1. Reports → **Issued today** → print if required  
2. To finish → print follow-up list  
3. Plan next DN + **Post to campus stock** for shortages  
4. Invoices — only if you are collecting B2B payments today  

---

## 19. Common questions

**What is the minimum to issue on a campus?**  
School + matching catalogue SKUs + kit + DN with **Post to campus stock**.

**Do I need an order before a delivery?**  
No. Orders are optional.

**Do I need an invoice before admission?**  
No. Invoice when you bill. Stock posting is what unlocks issue.

**Who posts stock — school or supplier?**  
**You (supplier admin)** on the DN. School login is closed in Phase 1.

**Can staff post stock?**  
No. Ask an admin to open the DN and **Post to campus stock**.

**Why did post stock fail?**  
Usually a missing school catalogue item for that **SKU**. Add it under Catalogue & kits, then retry.

**Can more than one staff issue at the same school?**  
Yes. Assign them all to that campus. Prefer separate queues.

**Why can’t my staff see a school?**  
Not assigned. **Team** → save campuses.

**Do SKUs have to match?**  
Yes for stock post. School item SKU = supplier product SKU.

**Where do school logins go?**  
Closed in Phase 1. Your team operates the desk.

**Can I delete the last admin?**  
No.

**I forgot a password**  
Another admin resets it on **Team**.

**Is stock shared across schools?**  
No. Each school has its own campus stock and catalogue.

---

## 20. Quick menu map

| Menu | Admin | Typical job |
|------|-------|-------------|
| Home | Yes | Setup path + monitor |
| Issue | Yes | Co-issue |
| To finish | Yes | Leftover kit items |
| Reports | Yes | Issued + stock |
| Schools | Yes (More) | 1. Create/link + catalogue |
| Products | Yes (More) | 2. Master SKUs |
| Deliveries | Yes (More) | 3. DN + **post campus stock** |
| Orders | Yes (More) | Optional POs |
| Invoices | Yes (More) | Optional bill / collect |
| Team | Yes (More) | Users + campus access |
| Branding | Yes (More) | White-label |
| Activity | Yes (More) | Timeline |
| Notifications | Yes (More) | Alerts (incl. post stock) |
| Search | Yes (More) | Find records |

---

## Setup checklist (print this)

- [ ] School created or linked  
- [ ] Supplier products added  
- [ ] School items (matching SKUs) + at least one kit  
- [ ] First DN created  
- [ ] **Post to campus stock** done — stock visible on Reports  
- [ ] Staff created + campuses assigned (if not issuing alone)  
- [ ] Branding saved (optional)  
- [ ] Test co-issue completed  
- [ ] Print test on the admission printer  
- [ ] Invoice later (when billing)  

---

*UniformDesk — Supplier Admin User Manual*  
Related docs: [`STAFF_USER_MANUAL.md`](./STAFF_USER_MANUAL.md) · [`DESK_GUIDE.md`](./DESK_GUIDE.md) · [`SUPPLIER_DEMO.md`](./SUPPLIER_DEMO.md) · [`RAILWAY.md`](./RAILWAY.md)
