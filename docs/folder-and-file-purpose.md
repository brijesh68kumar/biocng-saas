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

## Folder: `scripts` (Utility Scripts)

- `scripts/seed.js`
Purpose: Inserts demo data (admin, masters, sample rate cards).
Run when setting up local environment.

- `scripts/smoke.js`
Purpose: End-to-end API sanity check (login + create/list + rate resolution).

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
Purpose: Main UI component (currently starter template).

- `App.css`, `index.css`
Purpose: Styling files.

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
