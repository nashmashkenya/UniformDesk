# UniformDesk — Supplier Staff User Manual

**PDF:** [`UniformDesk_Staff_User_Manual.pdf`](./UniformDesk_Staff_User_Manual.pdf) — rebuild with `python docs/build-staff-manual-pdf.py`.

A complete guide for **supplier staff** on the issue desk.  
Use this when you start work, on admission day, or when you need a quick reminder.

**Who this is for:** people who log in as **supplier staff**  
**App home after login:** `/supplier` (Issue desk)  
**Live example:** `https://your-domain/login`

---

## Contents

1. [Your role in UniformDesk](#1-your-role-in-uniformdesk)
2. [Abbreviations and terms](#2-abbreviations-and-terms)
3. [What you need before you can issue](#3-what-you-need-before-you-can-issue)
4. [Sign in and find your way around](#4-sign-in-and-find-your-way-around)
5. [Campus access (which schools you can work on)](#5-campus-access-which-schools-you-can-work-on)
6. [Co-issue on admission day](#6-co-issue-on-admission-day)
7. [Issue slips](#7-issue-slips)
8. [Still owed](#8-still-owed)
9. [Reports](#9-reports)
10. [Home (Issue desk)](#10-home-issue-desk)
11. [Activity, notifications, and search](#11-activity-notifications-and-search)
12. [Printing](#12-printing)
13. [What you cannot change (ask admin)](#13-what-you-cannot-change-ask-admin)
14. [Admission day rhythm](#14-admission-day-rhythm)
15. [Common problems and fixes](#15-common-problems-and-fixes)
16. [Quick menu map](#16-quick-menu-map)
17. [Desk checklist](#17-desk-checklist)

---

## 1. Your role in UniformDesk

UniformDesk is the **supplier operations portal** for school uniforms.

As **staff**, you run the **co-issue desk** at the campuses your admin assigns to you. You:

- Issue uniforms to students (full kit or partial)
- Record payment **method** and **reference** (not an amount)
- Follow up **still owed** students when stock or sizes were short
- Check **issued today** and **stock on hand** for your campuses
- Open issue slips to review or print

You do **not** set up schools, products, kits, deliveries, stock posting, invoices, team, or branding. That is the **supplier admin** job.

| Role | What they do |
|------|----------------|
| **Admin** | Setup, team, DN + **post to campus stock**, catalogues, optional orders/invoices |
| **Staff (you)** | Issue, still owed, reports, slips — only on assigned campuses |

**Phase 1 rule:** schools do **not** log in. Your supplier team runs the desk.

---

## 2. Abbreviations and terms

| Abbreviation / term | Meaning |
|---------------------|---------|
| **SKU** | **S**tock **K**eeping **U**nit — product code on stock and reports (e.g. `BLZ-NVY`). |
| **DN** | **D**elivery **N**ote — how stock is packed for a school (`DN-2026-…`). Admin manages these. |
| **Post to campus stock** | Admin action on a DN that puts sizes on the campus ledger. **You cannot do this** — ask admin if stock is zero. |
| **PO** | **P**urchase **O**rder — optional; admin only. |
| **INV** | **Inv**oice — optional bill; admin only. Not needed for your issue desk. |
| **KES** | Kenyan Shilling — optional amount on issue for **Cash-up**; method + reference still required. |
| **M-Pesa** | Mobile money. On issue, choose it as method and type the code in **reference**. |
| **Campus** | A **school** you are assigned to work at. |
| **Co-issue** | Issuing the admission kit — your main job. |
| **Still owed** | Students whose kit is not fully issued (incomplete). |
| **Kit** | Named admission set (e.g. Form 1 Girls). |
| **Slip** | Issue record / printout with your name as issuer. |
| **Ref / reference** | Receipt number, M-Pesa code, or similar — with payment method; amount (KES) is optional. |

School **codes** (e.g. `GFS`) are short school IDs.

---

## 3. What you need before you can issue

Your desk only works when admin has finished the short setup path:

```text
Admin: School → Products → Catalogue + kit
     → Delivery note → Post to campus stock
     → Assign you to that campus on Team

You:   Login → Issue → Student → Kit → Method/Ref → Confirm
```

| Ready? | Check |
|--------|--------|
| Campus assigned | School appears on **Issue** (or auto-selected) |
| Stock available | **Reports → Stock on hand** shows sizes |
| Kit ready | Kit loads on the issue form |

If stock is empty, ask admin to open the DN and click **Post to campus stock** — not Orders or Invoices.

---

## 4. Sign in and find your way around

### Sign in

1. Open the login page (for example `https://your-domain/login`)
2. Enter your **staff** email and password (from your admin)
3. You land on **Home** — **Issue desk**

School desk login is closed. If you see that message, you used the wrong account.

Password reset: ask a **supplier admin** on **Team**. You cannot reset passwords yourself.

### Main navigation (staff)

| Menu | Purpose |
|------|---------|
| **Home** | Issue desk overview and shortcuts |
| **Issue** | Co-issue uniforms |
| **Still owed** | Incomplete kits |
| **Reports** | Issued today and campus stock |
| **Activity** (More) | Organisation timeline (read) |
| **Notifications** (More) | Alerts (read — some links are admin-only) |
| **Search** (More) | Lookup by keyword / document number |

You will **not** see Schools, Products, Orders, Deliveries, Invoices, Team, or Branding. Phone dock matches the desk: Home, Still owed, Issue, Reports.

### Theme and sign out

Theme in the header is personal preference only.  
Account menu → **Sign out** — always sign out on a shared counter.

---

## 5. Campus access (which schools you can work on)

Your admin assigns campuses on **Team**.

| Your campuses | On Issue / Still owed / Reports |
|---------------|----------------------------------|
| **One** | Auto-selected — no picker |
| **Several** | Picker shows **only** your schools |
| **None** | Cannot issue until admin assigns |

If a school is missing from the picker, you are not assigned to it — even if you are standing at that school.

---

## 6. Co-issue on admission day

**Path:** **Issue** (`/supplier/issue`)

### Before you start

- Assigned to today’s campus  
- Stock visible on **Reports** for key sizes  
- Printer tested (A4) if you will print slips  

### Issue steps

1. Open **Issue**
2. Pick school if you have more than one campus
3. Find the student **or** enter a new one (optional parent name / phone)
4. Load a **kit**, or adjust lines, sizes, and quantities
5. On each line tick **Issue now**, or untick to **Hold** (still owed)
6. Set **money status** (Unpaid / Paid / Deposit / Waived). Enter **payment method** and **reference** when issuing stock or recording payment; hold-only can skip method
7. Confirm

What happens:

- **Slip** created with **your name** as issuer  
- Issued lines reduce campus stock  
- Held lines and shortages go to **Still owed** with size (when known) and money status  
- **Kit status** shows owed / paid / hold  

### Tips

- One queue per desk so staff do not overlap students  
- Stock moves only on **Issue now**  
- Use **Hold** with **Paid** when collecting later; unpaid holds stay off the paid-not-collected report  
- Optional KES amount supports **Reports → Cash-up**  

### If something blocks you

| Situation | What to do |
|-----------|------------|
| No campuses | Ask admin → **Team** |
| School missing | Ask admin to assign that campus |
| Kit / items missing | Ask admin → Catalogue & kits |
| Stock zero / too low | Ask admin → DN → **Post to campus stock** (or new DN) |
| Wrong school selected | Change campus in the picker |

---

## 7. Issue slips

From Issue / Reports → open a slip (`/supplier/slips/...`).

Review what was issued, payment method/ref, then **Print**.  
Only slips for your assigned campuses open.

---

## 8. Still owed

**Path:** **Still owed** (`/supplier/incomplete`)

1. Select school if needed  
2. Review the queue (size and Paid / Unpaid / Deposit chips when known)  
3. **Issue what’s left** → opens Issue with that student and owed lines loaded  
4. **Print list** for paper follow-up  

Use after a busy morning, when a size runs out, or at end of day.

---

## 9. Reports

**Path:** **Reports** (`/supplier/reports`)

| View | What you see |
|------|----------------|
| **Issued today** | Who received what, method/ref, issuer |
| **Stock on hand** | Campus balances (view-only) |
| **Paid not collected** | Paid items still owed (aging) |
| **Cash-up** | Today’s desk payments by method |

**Print report** for clean A4.  
You cannot edit stock here — ask admin to post a DN if balances are wrong or empty.

---

## 10. Home (Issue desk)

**Path:** **Home** (`/supplier`)

Shortcuts: Co-issue, Reports, Still owed.  

Glance numbers (schools, deliveries, orders, invoices) are **read-only context**. You cannot manage those screens.

---

## 11. Activity, notifications, and search

Org-wide (not limited to your campuses). Useful for awareness.

- **Activity** — timeline (dispatches, issues, stock posts)  
- **Notifications** — some links are admin-only (e.g. deliveries). Note the alert and tell admin  
- **Search** — schools, **SKU**, **PO-…** / **DN-…** / **INV-…**. Opening admin pages may fail; use for reference only  

---

## 12. Printing

On-page **Print** button; **A4 portrait**.

| Document | Where |
|----------|--------|
| Issue slip | Slip detail |
| Still owed list | Still owed |
| Issued / stock report | Reports |

---

## 13. What you cannot change (ask admin)

| Need | Ask admin to use |
|------|------------------|
| Access to another school | Team → campus access |
| Password reset | Team |
| New school / catalogue / kit | Schools → Catalogue & kits (admin selects products) |
| New SKU or price | Products |
| Put stock on campus | Deliveries → DN → **Post to campus stock** |
| Billing / invoice payment | Invoices |
| Branding | Branding |

Opening those pages as staff usually shows **not found**. That is normal.

---

## 14. Admission day rhythm

### Before parents arrive

1. Sign in — correct campus  
2. **Reports → Stock** — note tight sizes  
3. Open **Issue** ready  
4. Printer + paper  
5. Agree queues with other staff  

### During issue

1. Stay on **Issue**  
2. Confirm sizes before submit  
3. Method + reference every time  
4. Print slip when needed  
5. **Still owed** when stock runs short  

### End of day

1. **Reports → Issued today** → print if required  
2. **Still owed** → print list  
3. Tell admin which sizes / SKUs blocked you (they may need another DN + post stock)  
4. Sign out  

---

## 15. Common problems and fixes

**I cannot see the school I am standing at.**  
Ask admin → **Team** → tick campus → **Save campuses**.

**Issue says I have no campuses.**  
Admin has not assigned any schools yet.

**Stock shows zero but a delivery arrived.**  
Admin must open the DN and click **Post to campus stock**. You cannot post stock.

**Another staff and I overlap students.**  
Split queues (class, stream, or admission number range).

**I issued the wrong size.**  
Stop and tell your admin/lead. Do not invent a second issue without guidance.

**Search / notification link is missing.**  
Admin-only target. Note the number and ask admin.

**Login says school desk is closed.**  
Use your supplier staff email.

**I forgot my password.**  
Only an admin can reset it on **Team**.

**Can I work at two schools the same day?**  
Yes, if both campuses are assigned. Switch in the picker.

---

## 16. Quick menu map

| Menu | Staff | Typical job |
|------|-------|-------------|
| Home | Yes | Issue desk start |
| Issue | Yes | Co-issue |
| Still owed | Yes | Incomplete kits |
| Reports | Yes | Issued + stock |
| Issue slips | Yes (your campuses) | Review / print |
| Activity / Notifications / Search | Yes (read) | Awareness |
| Deliveries / Post stock | No | Ask admin |
| Schools / Products / Orders / Invoices / Team / Branding | No | Ask admin |

---

## 17. Desk checklist

### First day on UniformDesk

- [ ] Staff email + temporary password  
- [ ] Signed in  
- [ ] My campuses appear on **Issue**  
- [ ] Stock visible on **Reports** (admin posted DN)  
- [ ] Practised one test issue (with admin approval)  
- [ ] Opened a slip and printed once  
- [ ] Know who to call for password / stock / campus problems  

### Every admission day

- [ ] Signed in on the counter device  
- [ ] Correct campus  
- [ ] Stock checked for key sizes  
- [ ] Printer ready  
- [ ] Queue rules agreed  
- [ ] End of day: issued report + still owed list + sign out  

---

*UniformDesk — Supplier Staff User Manual*  
Related docs: [`ADMIN_USER_MANUAL.md`](./ADMIN_USER_MANUAL.md) · [`DESK_GUIDE.md`](./DESK_GUIDE.md) · [`SUPPLIER_DEMO.md`](./SUPPLIER_DEMO.md)
