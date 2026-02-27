# BioCNG SaaS Context (AI Restart Memory)

This file is meant for fast recovery after IDE/computer restart.
Any AI assistant should read this file first before coding.

## 1) Product Vision

Build a SaaS platform for BioCNG plant operations where feedstock is managed as a service.

Business model includes:
1. Own cultivation on rented land.
2. Farmer procurement via collection centers.
3. Manual weighbridge intake at plant.
4. Weekly farmer invoicing.
5. Lot/batch-wise traceability.

## 1.1) User Profile And Working Preferences (Important)

This section describes how the user wants the project handled.

1. User is beginner-friendly and wants simple explanations.
2. User prefers step-by-step commands over abstract guidance.
3. User asked that code files include strong explanatory comments.
4. User expects docs to be updated with every meaningful change.
5. User specifically wants these docs always maintained:
   - `docs/context.md`
   - `docs/folder-and-file-purpose.md`
   - `docs/run-project-step-by-step.md`
   - `docs/documentation-maintenance-rules.md`
6. User wants restart-safe context so AI can continue quickly after computer restart.

## 2) Locked Business Decisions

1. Single plant per customer (tenant model still enforced in data).
2. Web-only first (no mobile app in current scope).
3. Weighbridge entries are manual for MVP.
4. Invoicing in MVP is generation only (no full payment reconciliation yet).
5. Farmer invoices are weekly.
6. Inventory/stock lineage is lot/batch wise.

## 3) Current Technical Architecture

1. Frontend:
   - React app in `client` with auth foundation now implemented (login, protected route, logout, local session).
2. Backend:
   - Node.js + Express modular monolith in `src`.
3. Database:
   - MongoDB local (`mongodb://localhost:27017/biogas` default).
4. Security:
   - JWT auth and role-based route restrictions.
5. Multi-tenancy:
   - `tenantId` on business entities + tenant middleware for query scoping.

## 4) What Is Implemented (Ground Truth)

### Auth + Access

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. Auth middleware:
   - `protect` for token validation.
   - `authorize` for role checks.

### Tenant Guard

1. `requireTenant` middleware.
2. `tenantFilter` helper used in DB queries.

### Master Modules

CRUD + deactivate for:
1. Feedstock Types
2. Farmers
3. Collection Centers
4. Vehicles
5. Land Parcels
6. Crop Plans

### Harvest Module (S1-06 In Progress)

1. `HarvestBatch` model is created with:
   - auto `batchCode` generation
   - auto `lotNo` generation
   - links to `LandParcel`, `CropPlan`, and `FeedstockType`
2. Harvest routes are added and wired:
   - `GET/POST /api/harvest-batches`
   - `GET/PATCH /api/harvest-batches/:id`
   - `PATCH /api/harvest-batches/:id/deactivate`
3. Harvest seed/smoke integration is implemented:
   - `seed.js` creates sample harvest batches
   - `smoke.js` validates harvest create/list and auto code generation

### Collection Center Stock Module (S1-07 In Progress)

1. `CenterReceiptLot` model added with:
   - auto `receiptLotCode` generation
   - source tracking and available quantity fields
2. `CenterStockLedger` model added with:
   - lot-wise movement records
   - movement types (`IN`, `OUT`, `ADJUST`)
   - running balance storage
3. `CenterReceiptLot` routes are added and wired:
   - `GET/POST /api/center-receipt-lots`
   - `GET/PATCH /api/center-receipt-lots/:id`
   - `PATCH /api/center-receipt-lots/:id/deactivate`
4. Center stock ledger API is added and wired:
   - `GET /api/center-stock-ledger`
   - `POST /api/center-stock-ledger/out`
5. Receipt creation now auto-posts `IN` movement to center stock ledger.
6. Center seed/smoke integration is implemented:
   - `seed.js` creates sample center receipt lots + matching IN ledger rows
   - `smoke.js` validates center receipt create/list + ledger IN/OUT flow

### Dispatch Module (S1-08 In Progress)

1. `DispatchTrip` model is added with:
   - auto `tripCode` generation
   - source references (`collectionCenterId`, `landParcelId`)
   - lot-wise plan (`plannedLots`)
   - status lifecycle (`planned`, `dispatched`, `in_transit`, `arrived`, `closed`, `cancelled`)
2. Dispatch routes are added and wired:
   - `GET/POST /api/dispatch-trips`
   - `GET/PATCH /api/dispatch-trips/:id`
   - `PATCH /api/dispatch-trips/:id/status`
   - `PATCH /api/dispatch-trips/:id/deactivate`
3. Dispatch seed/smoke integration is implemented:
   - `seed.js` inserts sample dispatch trips
   - `smoke.js` validates dispatch create/list/status update flow

### Plant Intake Module (S1-08 In Progress)

1. `PlantIntakeEntry` model is added with:
   - auto `intakeCode` generation
   - weighbridge fields (`gross`, `tare`, `net`)
   - quality and acceptance fields (`acceptedQty`, `rejectedQty`, grade, moisture)
   - source and dispatch linkage fields
2. Intake routes are added and wired:
   - `GET/POST /api/plant-intake-entries`
   - `GET/PATCH /api/plant-intake-entries/:id`
   - `PATCH /api/plant-intake-entries/:id/deactivate`
3. Intake seed/smoke integration is implemented:
   - `seed.js` inserts sample intake records linked to dispatch trips
   - `smoke.js` validates intake create/list flow

### Invoice Module (S1-08 Completed)

1. `InvoiceCycle` model is added with:
   - weekly date range (`weekStartDate`, `weekEndDate`)
   - cycle status (`open`, `generated`, `closed`)
   - auto `cycleCode` generation
2. `Invoice` model is added for generated invoice documents and line items.
3. Invoice routes are added and wired:
   - `POST /api/invoices/generate-weekly` (basic generation)
   - `GET /api/invoices` (list generated invoices)
4. End-to-end invoice smoke integration is implemented:
   - `smoke.js` generates weekly collection-center invoices and verifies invoice list output.

### Rate Cards (S1-04 Implemented)

1. RateCard schema with:
   - `partyType`
   - `partyId`
   - `feedstockTypeId`
   - `effectiveFrom`
   - `ratePerTon`
   - optional `qualityAdjustments`
2. APIs:
   - `GET /api/rate-cards`
   - `POST /api/rate-cards`
   - `GET /api/rate-cards/:id`
   - `PATCH /api/rate-cards/:id`
   - `PATCH /api/rate-cards/:id/deactivate`
   - `GET /api/rate-cards/resolve?...` (effective-date lookup)

### Tooling/Utilities

1. Seed script:
   - `npm run seed`
2. Smoke test script:
   - `npm run smoke`
3. Backend dev autoreload:
   - `npm run dev`
4. Postman assets exist in `postman/`.

### Frontend Auth Foundation (Current)

1. Login page implemented:
   - Calls `POST /api/auth/login`
   - Handles loading and error states
2. Session persistence implemented:
   - JWT token + user profile stored in local storage
   - Session validation on app load via `GET /api/auth/me`
3. Protected routing implemented:
   - `/dashboard` requires valid token
   - unauthenticated users redirected to `/login`
4. Logout flow implemented:
   - Clears local storage session and redirects to login
5. Temporary dashboard page added:
   - Displays user/tenant info
   - Has backend connectivity check button

### Frontend Layout Shell (Current)

1. Protected app layout is implemented with:
   - sidebar navigation
   - top header with tenant/user context and logout
2. Route structure now includes:
   - `/dashboard`
   - `/feedstock-types`
   - `/farmers`
   - `/collection-centers`
   - `/vehicles`
3. Placeholder pages are added for master modules to allow progressive implementation.

### Frontend First Module Integration (Current)

1. Feedstock Types page is now connected to backend:
   - `GET /api/feedstock-types` listing
   - `POST /api/feedstock-types` create form
2. Frontend now sends both:
   - `Authorization: Bearer <token>`
   - `x-tenant-id: <tenantId>`
3. Feedstock screen includes:
   - create form (code, name, uom)
   - success/error message handling
   - responsive list table

### Frontend Farmers Module Integration (Current)

1. Farmers page is now connected to backend:
   - `GET /api/farmers` listing
   - `POST /api/farmers` create form
2. Farmer form includes:
   - code, name, mobile, village
3. Farmers screen includes:
   - success/error message handling
   - responsive list table

## 5) Local Environment State

1. MongoDB service is installed and can run locally.
2. `mongosh` is installed and callable.
3. Git repo initialized and linked to:
   - `https://github.com/brijesh68kumar/biocng-saas.git`
4. Branch in use:
   - `master`

## 6) Run Commands (Most Important)

From project root:

1. Start MongoDB:
   - `Start-Service MongoDB`
2. Seed demo data:
   - `npm run seed`
3. Start backend:
   - `npm run dev`
4. Validate backend:
   - `npm run smoke`
5. Start frontend:
   - `cd client`
   - `npm start`

Detailed beginner steps:
- `docs/run-project-step-by-step.md`

## 7) Demo Credentials (Seed Defaults)

1. Email: `admin@biocng.local`
2. Password: `Admin@123`
3. Tenant: `tenant-demo-plant-1`

## 8) Folder/File Orientation

Read:
1. `docs/folder-and-file-purpose.md`
2. `docs/documentation-maintenance-rules.md`
3. `docs/project-timeline.md`
4. `docs/tooling-strategy-and-execution.md`

This explains purpose of every important folder and file.

## 9) Next Development Priorities

1. Frontend Step 2:
   - Completed (layout shell + module routes).
2. Frontend Step 3:
   - Completed (feedstock list + create form).
3. Next:
   - Implement collection centers page list + create integration.

## 9.1) Remaining Work Estimate (Planning Snapshot)

1. Backend remaining for MVP: ~20-30%
2. Frontend remaining for MVP: ~80-90%
3. Overall MVP remaining: ~40-50%

## 9.2) S1-08 Step Breakdown

1. Step 6.1: `DispatchTrip` model
2. Step 6.2: Dispatch routes + app wiring
3. Step 6.3: Seed/smoke for dispatch
4. Step 6.4: `PlantIntakeEntry` model
5. Step 6.5: Intake routes + app wiring
6. Step 6.6: Seed/smoke for intake
7. Step 6.7: Invoice cycle foundation model
8. Step 6.8: Invoice generation route (basic)
9. Step 6.9: Smoke for invoice generation (end-to-end path)

## 10) Resume Prompt For AI

Use this exact prompt after restart:

`Continue BioCNG SaaS from current master branch. Backend modules through invoice flow (S1-08 step 6.9) are implemented and validated by smoke test. Frontend Step 1 (auth foundation), Step 2 (layout shell/routes), Step 3 (feedstock list/create), and Step 4 (farmers list/create) are implemented. Next build collection centers page with list/create integration, then vehicles page.`

## 11) Mandatory Process For Every Future Change

1. Add/update comments in every touched code file.
2. Update `docs/context.md` with latest state.
3. Update `docs/folder-and-file-purpose.md` when files/folders change.
4. Update `docs/run-project-step-by-step.md` if commands/flow change.
5. Update `docs/project-timeline.md` date-wise (completed + pending + next target).
6. Run validation (`npm run smoke`) for backend-impacting changes.
