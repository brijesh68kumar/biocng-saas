// Seed script purpose:
// 1) Ensure one demo admin user exists
// 2) Populate baseline masters (feedstock, farmers, centers, vehicles)
// 3) Populate land and crop planning masters
// 4) Add sample rate cards for effective-date testing
// This lets a beginner run the API quickly without manual data entry.
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const FeedstockType = require('../src/models/FeedstockType');
const Farmer = require('../src/models/Farmer');
const CollectionCenter = require('../src/models/CollectionCenter');
const Vehicle = require('../src/models/Vehicle');
const LandParcel = require('../src/models/LandParcel');
const CropPlan = require('../src/models/CropPlan');
const RateCard = require('../src/models/RateCard');

dotenv.config();

// Local fallback DB string if .env is not set.
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/biogas';

async function runSeed() {
  // Connect once, then reuse the same connection for all inserts/updates.
  await mongoose.connect(mongoURI);

  // Read seed defaults from env (with safe fallback values).
  const tenantId = process.env.SEED_TENANT_ID || 'tenant-demo-plant-1';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@biocng.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  // Never store plain password in DB.
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  // Upsert means: create if missing, otherwise update existing record.
  await User.findOneAndUpdate(
    { email: adminEmail.toLowerCase() },
    {
      tenantId,
      name: 'Demo Admin',
      email: adminEmail.toLowerCase(),
      password: adminPasswordHash,
      role: 'admin',
      isActive: true,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );

  const feedstockTypes = [
    { code: 'PRESSMUD', name: 'Pressmud', uom: 'ton' },
    { code: 'CATTLE_DUNG', name: 'Cattle Dung', uom: 'ton' },
    { code: 'AGRI_RESIDUE', name: 'Agri Residue', uom: 'ton' },
  ];

  // Seed feedstock type master records.
  for (const row of feedstockTypes) {
    await FeedstockType.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const farmers = [
    { code: 'FARM001', name: 'Ramesh Kumar', mobile: '9990001111', village: 'Rampur' },
    { code: 'FARM002', name: 'Suresh Patel', mobile: '9990002222', village: 'Kheda' },
  ];

  // Seed farmer master records.
  for (const row of farmers) {
    await Farmer.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const centers = [
    { code: 'CC-NORTH', name: 'North Collection Center', location: 'Zone North', managerName: 'Amit' },
    { code: 'CC-SOUTH', name: 'South Collection Center', location: 'Zone South', managerName: 'Vijay' },
  ];

  // Seed collection center master records.
  for (const row of centers) {
    await CollectionCenter.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const vehicles = [
    { number: 'GJ01AB1234', capacityTon: 10, ownerType: 'owned' },
    { number: 'GJ01CD5678', capacityTon: 12, ownerType: 'contracted' },
  ];

  // Seed transport vehicle master records.
  for (const row of vehicles) {
    await Vehicle.findOneAndUpdate(
      { tenantId, number: row.number },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  const landParcels = [
    {
      parcelCode: 'LP-001',
      landType: 'rented',
      lessorName: 'Mohan Lal',
      village: 'Rampur',
      district: 'Ahmedabad',
      areaAcres: 12,
      leaseStartDate: new Date('2026-01-01T00:00:00.000Z'),
      leaseEndDate: new Date('2028-12-31T00:00:00.000Z'),
      rentPerAcrePerYear: 22000,
    },
    {
      parcelCode: 'LP-002',
      landType: 'rented',
      lessorName: 'Ravi Patel',
      village: 'Kheda',
      district: 'Ahmedabad',
      areaAcres: 8,
      leaseStartDate: new Date('2026-03-01T00:00:00.000Z'),
      leaseEndDate: new Date('2028-02-28T00:00:00.000Z'),
      rentPerAcrePerYear: 20000,
    },
  ];

  // Seed land parcel master records.
  for (const row of landParcels) {
    await LandParcel.findOneAndUpdate(
      { tenantId, parcelCode: row.parcelCode },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  // Lookup references needed for crop plans.
  const parcel001 = await LandParcel.findOne({ tenantId, parcelCode: 'LP-001' });
  const parcel002 = await LandParcel.findOne({ tenantId, parcelCode: 'LP-002' });
  const cattleDung = await FeedstockType.findOne({ tenantId, code: 'CATTLE_DUNG' });
  const agriResidue = await FeedstockType.findOne({ tenantId, code: 'AGRI_RESIDUE' });

  // Seed crop plans only when referenced master data exists.
  const cropPlans = [];
  if (parcel001 && cattleDung) {
    cropPlans.push({
      planCode: 'CP-2026-001',
      landParcelId: parcel001._id,
      feedstockTypeId: cattleDung._id,
      sowingDate: new Date('2026-06-01T00:00:00.000Z'),
      expectedHarvestDate: new Date('2026-10-15T00:00:00.000Z'),
      expectedYieldTon: 110,
      estimatedCost: 180000,
      notes: 'Kharif cycle plan',
    });
  }

  if (parcel002 && agriResidue) {
    cropPlans.push({
      planCode: 'CP-2026-002',
      landParcelId: parcel002._id,
      feedstockTypeId: agriResidue._id,
      sowingDate: new Date('2026-07-01T00:00:00.000Z'),
      expectedHarvestDate: new Date('2026-11-30T00:00:00.000Z'),
      expectedYieldTon: 90,
      estimatedCost: 140000,
      notes: 'Residue-focused cycle',
    });
  }

  // Seed crop plan records.
  for (const row of cropPlans) {
    await CropPlan.findOneAndUpdate(
      { tenantId, planCode: row.planCode },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  // Lookup seeded references needed for rate card records.
  const pressmud = await FeedstockType.findOne({ tenantId, code: 'PRESSMUD' });
  const farm001 = await Farmer.findOne({ tenantId, code: 'FARM001' });

  if (pressmud && farm001) {
    // Current effective rate example.
    await RateCard.findOneAndUpdate(
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        ratePerTon: 1500,
        qualityAdjustments: [],
        isActive: true,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Future effective rate example for date-based resolution.
    await RateCard.findOneAndUpdate(
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2027-01-01T00:00:00.000Z'),
      },
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2027-01-01T00:00:00.000Z'),
        ratePerTon: 1650,
        qualityAdjustments: [],
        isActive: true,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  console.log('Seed completed');
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Admin Password: ${adminPassword}`);
}

// Standard script exit pattern: fail fast on error, always close DB connection.
runSeed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
