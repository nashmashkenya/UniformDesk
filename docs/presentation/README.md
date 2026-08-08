# UniformDesk presentations

## User Manual (primary)

**File:** [`UniformDesk_User_Manual.pptx`](./UniformDesk_User_Manual.pptx)

Comprehensive, dynamic walkthrough with **live screenshots** from the running app:

- Roles & demo logins  
- End-to-end flow (create school → catalog → DN → co-issue → still owed → reports)  
- Supplier portal screens (admin + staff)  
- School reporter desk screens  
- Print & daily rhythm  
- Click-to-reveal callouts + fade transitions  

Day-to-day ops narrative: [`../DESK_GUIDE.md`](../DESK_GUIDE.md).  
Supplier meeting script: [`../SUPPLIER_DEMO.md`](../SUPPLIER_DEMO.md).

### Rebuild (User Manual)

```bash
# App must be running on :3000 with seed data
# Prefer Node 22 if better-sqlite3 ABI mismatches system Node
.tools/node22/node.exe docs/presentation/capture-user-manual.mjs
# or: node docs/presentation/capture-user-manual.mjs

python docs/presentation/build-user-manual-pptx.py
```

Requires: Node 22+, Playwright (Chrome channel), Python `python-pptx` + `lxml`.

Demo password for all seed users: `desk1234`

| Role | Email |
|------|--------|
| Supplier admin | `supply@uniformdesk.co` |
| Supplier staff | `staff@uniformdesk.co` |
| School reporter (GFS) | `report@greenfield.school` |
| School reporter (RVA) | `report@riverside.school` |

---

## System Overview (analyst briefing)

**File:** [`UniformDesk_System_Overview.pptx`](./UniformDesk_System_Overview.pptx)

Shorter stakeholder deck (architecture, trust model, demo script). Prefer the **User Manual** for training and ops walkthroughs.

### Rebuild (System Overview)

```bash
node docs/presentation/capture-screens.mjs
node docs/presentation/capture-details.mjs
node docs/presentation/seed-and-capture-supply.mjs
python docs/presentation/build-pptx.py
```

Note: older capture scripts may still reference retired school-purchase routes; use `capture-user-manual.mjs` for current product screens.
