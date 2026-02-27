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

### Completed
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

### Planned / Pending
1. S1-05: Land Parcel module (schema + CRUD).
2. S1-05: Crop Plan module (schema + CRUD).
3. Update seed and smoke scripts for new S1-05 modules.
4. S1-06: Harvest batch module with lot generation.
5. S1-07: Collection center receipt lots + center stock ledger.
6. S1-08: Dispatch + manual intake + weekly invoice generation flow.
7. Frontend feature pages beyond starter template.

### Next Target
1. Start S1-05:
   - Create `LandParcel` model and routes.
   - Create `CropPlan` model and routes.
   - Add tests in smoke flow.

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
