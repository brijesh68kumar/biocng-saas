# Folder And File Purpose Guide

This document explains what each important folder and file does in this project.
Use this when you are new or when restarting work after a break.

## Root Folder: `e:\Workspace for coding`

### Root Files

- `.env.example`
Purpose: Template for environment variables (MongoDB URL, JWT secret, port).

- `.gitignore`
Purpose: Prevents local-only files (`node_modules`, `.env`, logs) from being committed.

- `index.js`
Purpose: Backend entry point.
Loads env variables, connects to MongoDB, then starts Express server.

- `nodemon.json`
Purpose: Config for development auto-restart.
Watches backend files and ignores heavy folders.

- `package.json`
Purpose: Backend project metadata + scripts + dependencies.
Main scripts:
1. `npm run dev`
2. `npm run seed`
3. `npm run smoke`

- `package-lock.json`
Purpose: Exact dependency versions lock file for reproducible installs.

## Folder: `src` (Backend Source Code)

### File: `src/app.js`
Purpose: Builds Express app object.
Registers middleware, route modules, and global error handlers.

### Folder: `src/config`

- `src/config/db.js`
Purpose: MongoDB connection function used during backend startup.

### Folder: `src/middleware`

- `asyncHandler.js`
Purpose: Wraps async routes so errors go to centralized error handler.

- `auth.js`
Purpose: JWT authentication (`protect`) and role authorization (`authorize`).

- `errorHandler.js`
Purpose: 404 handler + standard JSON error response formatter.

- `tenant.js`
Purpose: Tenant context enforcement (`requireTenant`) and query scoping helper (`tenantFilter`).

### Folder: `src/models` (MongoDB Schemas)

- `User.js`
Purpose: Login users with roles and tenant membership.

- `FeedstockType.js`
Purpose: Feedstock master (example: pressmud, cattle dung).

- `Farmer.js`
Purpose: Farmer master for procurement.

- `CollectionCenter.js`
Purpose: Collection center master for sourcing operations.

- `Vehicle.js`
Purpose: Vehicle master for transport/dispatch.

- `RateCard.js`
Purpose: Price master with effective date logic.
Supports future price versions and quality adjustments.

- `LandParcel.js`
Purpose: Land parcel master for rented/owned cultivation land.

- `CropPlan.js`
Purpose: Crop planning records linked to land parcel and feedstock type.

- `HarvestBatch.js`
Purpose: Harvest lot/batch record with auto-generated `batchCode` and `lotNo` for traceability.

- `CenterReceiptLot.js`
Purpose: Receipt lot master at collection center with auto-generated receipt lot code and available quantity tracking.

- `CenterStockLedger.js`
Purpose: Lot-wise center stock movement ledger (IN/OUT/ADJUST) for auditable stock history.

- `DispatchTrip.js`
Purpose: Trip planning and status lifecycle model for transport from source lots to plant.

- `PlantIntakeEntry.js`
Purpose: Plant weighbridge and quality intake record model with accepted/rejected quantity outcomes.

- `InvoiceCycle.js`
Purpose: Weekly invoice cycle foundation model to control invoice generation windows and status.

- `Invoice.js`
Purpose: Generated invoice document model with invoice lines, totals, and cycle/party linkage.

### Folder: `src/routes` (API Endpoints)

- `auth.js`
Purpose: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`.

- `masterCrudFactory.js`
Purpose: Reusable CRUD router generator used by simple masters.

- `feedstockTypes.js`
Purpose: Feedstock type CRUD routes.

- `farmers.js`
Purpose: Farmer CRUD routes.

- `collectionCenters.js`
Purpose: Collection center CRUD routes.

- `vehicles.js`
Purpose: Vehicle CRUD routes.

- `rateCards.js`
Purpose: Rate card CRUD + `/resolve` endpoint to get active rate by date.

- `landParcels.js`
Purpose: Land parcel CRUD routes.

- `cropPlans.js`
Purpose: Crop plan CRUD routes.

- `harvestBatches.js`
Purpose: Harvest batch CRUD routes (auto lot/batch code behavior comes from model).

- `centerReceiptLots.js`
Purpose: Collection center receipt lot CRUD routes with automatic `IN` ledger posting.

- `centerStockLedger.js`
Purpose: Center stock ledger list endpoint and `OUT` movement posting endpoint.

- `dispatchTrips.js`
Purpose: Dispatch trip CRUD, status transition API, and trip listing filters.

- `plantIntakeEntries.js`
Purpose: Plant intake entry CRUD routes with weighbridge and quality intake validation.

- `invoices.js`
Purpose: Basic weekly invoice generation API and invoice listing endpoints.

## Folder: `scripts` (Utility Scripts)

- `scripts/seed.js`
Purpose: Inserts demo data (admin, masters, land/crop, harvest, center, dispatch, intake, sample rate cards).
Run when setting up local environment.

- `scripts/smoke.js`
Purpose: End-to-end API sanity check (login + create/list across masters/land/crop/harvest/center/dispatch/intake flow + rate resolution + weekly invoice generation/list validation).

## Folder: `docs` (Project Documentation)

- `docs/context.md`
Purpose: AI/project memory file with current architecture, progress, and next tasks.

- `docs/run-project-step-by-step.md`
Purpose: Beginner runbook for starting MongoDB, backend, and frontend.

- `docs/folder-and-file-purpose.md` (this file)
Purpose: Explains purpose of each folder and key file.

- `docs/documentation-maintenance-rules.md`
Purpose: Permanent checklist for comments + docs updates after every code change.

- `docs/project-timeline.md`
Purpose: Date-wise timeline of what is completed and what is pending; must be updated every commit.

- `docs/tooling-strategy-and-execution.md`
Purpose: Tool adoption roadmap (what to use now vs later) with phase-wise execution strategy.

## Folder: `postman`

- `BioCNG-Sprint1.postman_collection.json`
Purpose: API requests collection for manual testing in Postman.

- `BioCNG-local.postman_environment.json`
Purpose: Environment variables for local Postman testing.

## Folder: `client` (Frontend React App)

### Frontend Root Files

- `client/package.json`
Purpose: Frontend scripts and dependencies.

- `client/package-lock.json`
Purpose: Exact frontend dependency versions.

- `client/.env.example`
Purpose: Frontend environment template for API base URL (`REACT_APP_API_BASE_URL`).

- `client/README.md`
Purpose: Default React app notes from Create React App.

### Folder: `client/public`

- `index.html`
Purpose: Main HTML shell where React app mounts.

- `manifest.json`, `robots.txt`, icons
Purpose: Browser metadata and static assets.

### Folder: `client/src`

- `index.js`
Purpose: Frontend entry point that renders `<App />`.

- `App.js`
Purpose: Main frontend router and auth-aware entry shell (`/login`, `/dashboard`).

- `App.css`, `index.css`
Purpose: Global and page styling for auth and dashboard starter pages.

- `config/api.js`
Purpose: Frontend API base URL configuration (`REACT_APP_API_BASE_URL` fallback support).

- `auth/storage.js`
Purpose: Local storage helpers for token and user session persistence.

- `auth/AuthContext.js`
Purpose: Shared auth provider (login, logout, session bootstrap/validation, auth headers helper, centralized authenticated request with auto logout on `401`).

- `components/ProtectedRoute.js`
Purpose: Route guard that redirects unauthenticated users to login.

- `components/AppLayout.js`
Purpose: Protected app shell with sidebar navigation and top header used by module pages.

- `pages/LoginPage.js`
Purpose: Login form page integrated with backend auth API.

- `pages/DashboardPage.js`
Purpose: Protected dashboard page with user info and backend connectivity check.

- `pages/FeedstockTypesPage.js`
Purpose: Feedstock module page with backend-integrated list and create flow.

- `pages/FarmersPage.js`
Purpose: Farmers module page with backend-integrated list and create flow.

- `pages/CollectionCentersPage.js`
Purpose: Collection centers module page with backend-integrated list and create flow.

- `pages/VehiclesPage.js`
Purpose: Vehicles module page with backend-integrated list and create flow.

- `pages/LandParcelsPage.js`
Purpose: Land parcels module page with backend-integrated list and create flow.

- `pages/CropPlansPage.js`
Purpose: Crop plans module page with backend-integrated list and create flow.

- `pages/HarvestBatchesPage.js`
Purpose: Harvest batches module page with backend-integrated list and create flow.

- `pages/CenterReceiptLotsPage.js`
Purpose: Center receipt lots module page with backend-integrated list and create flow.

- `reportWebVitals.js`
Purpose: Optional frontend performance metrics helper.

- `setupTests.js`, `App.test.js`
Purpose: Frontend test setup and example test.

## Quick Start Summary

1. Start DB: `Start-Service MongoDB`
2. Seed backend data: `npm run seed`
3. Run backend: `npm run dev`
4. Verify backend: `npm run smoke`
5. Run frontend:
   - `cd client`
   - `npm start`
