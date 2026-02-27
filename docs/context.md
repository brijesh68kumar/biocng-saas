# BioCNG SaaS Context

## Decisions
- Single plant per customer.
- Web-only platform for MVP.
- Manual weighbridge entry at plant intake.
- Weekly farmer invoices.
- Lot/batch-wise inventory tracking and lineage.
- Sourcing mix includes own cultivated feedstock (rented land) and farmer procurement through collection centers.

## Current Architecture
- Frontend: React app in `client` (currently CRA baseline).
- Backend: Node.js + Express modular monolith.
- Database: MongoDB with tenant-scoped data (`tenantId` on business entities).
- Auth: JWT with role-based authorization.

## Implemented Backend Scope
- Auth APIs:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Tenant guard middleware for request scoping.
- Role middleware for protected write endpoints.
- Master CRUD APIs implemented:
  - Feedstock Types
  - Farmers
  - Collection Centers
  - Vehicles
- Seed utility:
  - `npm run seed`
- Automated API smoke test:
  - `npm run smoke`
- Dev server with autoreload:
  - `npm run dev`

## Key Files Added/Updated
- `index.js`
- `src/app.js`
- `src/config/db.js`
- `src/middleware/*`
- `src/models/*`
- `src/routes/*`
- `scripts/seed.js`
- `scripts/smoke.js`
- `postman/BioCNG-Sprint1.postman_collection.json`
- `postman/BioCNG-local.postman_environment.json`
- `.env.example`
- `nodemon.json`
- `package.json`

## Local Runbook
1. Ensure MongoDB service is running.
2. Seed demo data:
   - `npm run seed`
3. Start backend in dev mode:
   - `npm run dev`
4. Validate baseline APIs:
   - `npm run smoke`

## Default Demo Credentials
- Email: `admin@biocng.local`
- Password: `Admin@123`
- Tenant: `tenant-demo-plant-1`

## Next Sprint Items
- S1-04: Rate Cards (schema + CRUD + effective-date resolution).
- S1-05: Land Parcel and Crop Plan masters.
- S1-06: Harvest batches with lot generation and stock-in ledger hooks.

## Known Notes
- MongoDB server is installed and reachable on `mongodb://localhost:27017`.
- `mongosh` command path has been corrected on this machine.

## Resume Prompt
Continue BioCNG SaaS backend from S1-04 (Rate Cards). Existing auth, tenant guard, masters, seed, smoke, and dev tooling are already implemented.