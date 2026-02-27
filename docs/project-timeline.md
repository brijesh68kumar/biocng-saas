# Project Timeline (Date-wise)

Purpose:
1. Track what is completed and what is pending.
2. Keep a simple date-wise history for beginner-friendly progress review.
3. Update this file in every commit.

Update rule:
1. Add a new date entry when significant work is done.
2. Move items from "Planned / Pending" to "Completed" when finished.
3. Keep "Next Target" clear so work can resume quickly after restart.

---

## 2026-02-27

### Status Snapshot (Discussion Update)
1. Backend core flow status: Mostly complete for MVP.
2. Backend pending estimate: ~20-30% (hardening + production-ready improvements).
3. Frontend pending estimate: ~80-90% (functional screens still pending).
4. Overall MVP pending estimate: ~40-50%.

### Completed
1. Tooling strategy document added:
   - `docs/tooling-strategy-and-execution.md`
   - Includes phased adoption plan (now/soon/later) and weekly execution process
2. Frontend Step 1 completed (auth foundation):
   - Login page added with API-based sign in
   - JWT/user session persisted in browser local storage
   - Protected route guard added
   - Logout flow added
   - Basic protected dashboard placeholder added
3. Frontend Step 2 completed (layout shell + module navigation):
   - Protected layout component with sidebar and top header
   - Module navigation routes added (dashboard, feedstock, farmers, centers, vehicles)
   - Module placeholder pages added for next integration steps
1. Project architecture and MVP scope decisions finalized:
   - Single plant per customer
   - Web-only first
   - Manual weighbridge entry
   - Weekly farmer invoice
   - Lot/batch-wise tracking
2. Backend initialized as modular Node.js + Express app.
3. MongoDB connection setup completed.
4. Auth implemented:
   - Register, login, me
   - JWT protection
   - Role authorization middleware
5. Tenant guard implemented:
   - `requireTenant`
   - `tenantFilter`
6. Master CRUD implemented:
   - Feedstock Types
   - Farmers
   - Collection Centers
   - Vehicles
7. Rate Card module implemented:
   - Schema
   - CRUD endpoints
   - Effective-date resolution endpoint
8. Utility scripts implemented:
   - `npm run seed`
   - `npm run smoke`
9. Dev tooling implemented:
   - `npm run dev` with nodemon
10. Environment setup completed:
   - MongoDB server installed and running
   - `mongosh` fixed and working
11. Git initialized and pushed to GitHub repository:
   - `https://github.com/brijesh68kumar/biocng-saas`
12. Documentation added and expanded:
   - Context memory
   - Folder/file purpose guide
   - Step-by-step run guide
   - Documentation maintenance rules
13. Large explanatory comments added across backend, scripts, and frontend starter files.
14. S1-05 Land and Crop planning modules added:
   - `LandParcel` schema + routes
   - `CropPlan` schema + routes
15. Seed and smoke flow extended for Land/Crop planning path.
16. S1-06 Step 4.1 completed:
   - `HarvestBatch` model added
   - auto `batchCode` generation added
   - auto `lotNo` generation added
17. S1-06 Step 4.2 completed:
   - `HarvestBatch` routes added
   - `/api/harvest-batches` wired into app
18. S1-06 Step 4.3 completed:
   - Seed script extended with sample harvest batches
   - Smoke script extended to validate harvest create/list and auto-generated codes
19. S1-07 Step 5.1 completed:
   - `CenterReceiptLot` model added
   - `CenterStockLedger` model added
20. S1-07 Step 5.2 completed:
   - `CenterReceiptLot` routes added
   - `/api/center-receipt-lots` wired into app
21. S1-07 Step 5.3 completed:
   - `CenterStockLedger` routes added and wired
   - `POST /api/center-stock-ledger/out` added for OUT posting
   - Receipt lot creation now auto-posts `IN` movement to ledger
22. S1-07 Step 5.4 completed:
   - Seed script extended for center receipt lots and IN ledger rows
   - Smoke script extended for center receipt create/list and ledger IN/OUT validation
23. S1-08 Step 6.1 completed:
   - `DispatchTrip` model added
   - trip code auto-generation added
   - planned lot structure and status lifecycle added
24. S1-08 Step 6.2 completed:
   - `DispatchTrip` routes added
   - `/api/dispatch-trips` wired into app
   - status transition endpoint added (`PATCH /api/dispatch-trips/:id/status`)
25. S1-08 Step 6.3 completed:
   - Seed script extended for dispatch trips
   - Smoke script extended for dispatch create/list/status transition
26. S1-08 Step 6.4 completed:
   - `PlantIntakeEntry` model added
   - intake code auto-generation and weighbridge/quality fields added
27. S1-08 Step 6.5 completed:
   - `PlantIntakeEntry` routes added
   - `/api/plant-intake-entries` wired into app
28. S1-08 Step 6.6 completed:
   - Seed script extended for intake entries linked to dispatch
   - Smoke script extended for intake create/list validation
29. S1-08 Step 6.7 completed:
   - `InvoiceCycle` model added
   - weekly cycle status and code generation foundation added
30. S1-08 Step 6.8 completed:
   - `Invoice` model added
   - `/api/invoices/generate-weekly` and `/api/invoices` routes added
31. S1-08 Step 6.9 completed:
   - Smoke script extended for end-to-end weekly invoice generation and listing validation
   - Collection-center rate card path added in smoke flow for invoice calculation

### Planned / Pending
1. Frontend feature pages beyond starter template.
2. Frontend Step 3:
   - Feedstock module page with list + create integration.

### Next Target
1. Start next phase:
   - Build frontend Step 3 feedstock list/create integration.

---

## Timeline Update Template (Copy For New Dates)

Use this block for future updates:

```md
## YYYY-MM-DD

### Completed
1. ...

### Planned / Pending
1. ...

### Next Target
1. ...
```
