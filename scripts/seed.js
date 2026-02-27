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
const HarvestBatch = require('../src/models/HarvestBatch');
const CenterReceiptLot = require('../src/models/CenterReceiptLot');
const CenterStockLedger = require('../src/models/CenterStockLedger');
const DispatchTrip = require('../src/models/DispatchTrip');
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

  // Lookup references needed for harvest batches.
  const cropPlan001 = await CropPlan.findOne({ tenantId, planCode: 'CP-2026-001' });
  const cropPlan002 = await CropPlan.findOne({ tenantId, planCode: 'CP-2026-002' });

  const harvestBatches = [];
  if (parcel001 && cattleDung) {
    harvestBatches.push({
      batchCode: 'HB-SEED-001',
      lotNo: 'LOT-SEED-001',
      landParcelId: parcel001._id,
      cropPlanId: cropPlan001 ? cropPlan001._id : undefined,
      feedstockTypeId: cattleDung._id,
      harvestDate: new Date('2026-10-18T00:00:00.000Z'),
      grossQtyTon: 58,
      moisturePercent: 21,
      qualityGrade: 'A',
      notes: 'Seed harvest batch 1',
    });
  }

  if (parcel002 && agriResidue) {
    harvestBatches.push({
      batchCode: 'HB-SEED-002',
      lotNo: 'LOT-SEED-002',
      landParcelId: parcel002._id,
      cropPlanId: cropPlan002 ? cropPlan002._id : undefined,
      feedstockTypeId: agriResidue._id,
      harvestDate: new Date('2026-12-02T00:00:00.000Z'),
      grossQtyTon: 43,
      moisturePercent: 24,
      qualityGrade: 'B',
      notes: 'Seed harvest batch 2',
    });
  }

  // Seed harvest batch records.
  for (const row of harvestBatches) {
    await HarvestBatch.findOneAndUpdate(
      { tenantId, batchCode: row.batchCode },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  // Seed center receipt lots and matching IN ledger entries.
  const centerNorth = await CollectionCenter.findOne({ tenantId, code: 'CC-NORTH' });
  const centerSouth = await CollectionCenter.findOne({ tenantId, code: 'CC-SOUTH' });
  const farm001 = await Farmer.findOne({ tenantId, code: 'FARM001' });
  const farm002 = await Farmer.findOne({ tenantId, code: 'FARM002' });

  const centerReceipts = [];
  if (centerNorth && cattleDung && farm001) {
    centerReceipts.push({
      receiptLotCode: 'CRL-SEED-001',
      collectionCenterId: centerNorth._id,
      sourceType: 'farmer',
      sourceRefId: String(farm001._id),
      feedstockTypeId: cattleDung._id,
      receiptDate: new Date('2026-10-05T00:00:00.000Z'),
      grossQtyTon: 22,
      moisturePercent: 18,
      qualityGrade: 'A',
      availableQtyTon: 22,
      notes: 'Seed center receipt lot 1',
    });
  }

  if (centerSouth && agriResidue && farm002) {
    centerReceipts.push({
      receiptLotCode: 'CRL-SEED-002',
      collectionCenterId: centerSouth._id,
      sourceType: 'farmer',
      sourceRefId: String(farm002._id),
      feedstockTypeId: agriResidue._id,
      receiptDate: new Date('2026-10-07T00:00:00.000Z'),
      grossQtyTon: 19,
      moisturePercent: 23,
      qualityGrade: 'B',
      availableQtyTon: 19,
      notes: 'Seed center receipt lot 2',
    });
  }

  for (const row of centerReceipts) {
    const lot = await CenterReceiptLot.findOneAndUpdate(
      { tenantId, receiptLotCode: row.receiptLotCode },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    // Ensure one corresponding IN ledger row exists for each seeded receipt lot.
    await CenterStockLedger.findOneAndUpdate(
      {
        tenantId,
        centerReceiptLotId: lot._id,
        movementType: 'IN',
        refType: 'center-receipt',
        refId: String(lot._id),
      },
      {
        tenantId,
        collectionCenterId: lot.collectionCenterId,
        centerReceiptLotId: lot._id,
        movementType: 'IN',
        qtyTon: Math.abs(lot.grossQtyTon),
        balanceAfterTon: lot.availableQtyTon,
        refType: 'center-receipt',
        refId: String(lot._id),
        remarks: lot.notes || undefined,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  // Seed dispatch trips using existing harvest and center lots.
  const harvestLot001 = await HarvestBatch.findOne({ tenantId, batchCode: 'HB-SEED-001' });
  const centerLot001 = await CenterReceiptLot.findOne({ tenantId, receiptLotCode: 'CRL-SEED-001' });
  const vehicle001 = await Vehicle.findOne({ tenantId, number: 'GJ01AB1234' });

  const dispatchTrips = [];
  if (centerNorth && vehicle001 && centerLot001) {
    dispatchTrips.push({
      tripCode: 'DT-SEED-001',
      sourceType: 'collection-center',
      collectionCenterId: centerNorth._id,
      vehicleId: vehicle001._id,
      driverName: 'Seed Driver 1',
      driverPhone: '9991110001',
      destinationPlantName: 'Main Plant',
      plannedLots: [
        {
          lotSourceType: 'center-receipt',
          lotRefId: String(centerLot001._id),
          qtyTon: 10,
        },
      ],
      status: 'dispatched',
      dispatchDate: new Date('2026-10-10T08:00:00.000Z'),
      notes: 'Seed dispatch trip from center',
    });
  }

  if (parcel001 && vehicle001 && harvestLot001) {
    dispatchTrips.push({
      tripCode: 'DT-SEED-002',
      sourceType: 'own-farm',
      landParcelId: parcel001._id,
      vehicleId: vehicle001._id,
      driverName: 'Seed Driver 2',
      driverPhone: '9991110002',
      destinationPlantName: 'Main Plant',
      plannedLots: [
        {
          lotSourceType: 'harvest-batch',
          lotRefId: String(harvestLot001._id),
          qtyTon: 12,
        },
      ],
      status: 'in_transit',
      dispatchDate: new Date('2026-10-11T09:00:00.000Z'),
      notes: 'Seed dispatch trip from farm',
    });
  }

  for (const row of dispatchTrips) {
    await DispatchTrip.findOneAndUpdate(
      { tenantId, tripCode: row.tripCode },
      { ...row, tenantId, isActive: true },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );
  }

  // Lookup seeded references needed for rate card records.
  const pressmud = await FeedstockType.findOne({ tenantId, code: 'PRESSMUD' });
  const farm001ForRate = await Farmer.findOne({ tenantId, code: 'FARM001' });

  if (pressmud && farm001ForRate) {
    // Current effective rate example.
    await RateCard.findOneAndUpdate(
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001ForRate._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001ForRate._id),
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
        partyId: String(farm001ForRate._id),
        feedstockTypeId: pressmud._id,
        effectiveFrom: new Date('2027-01-01T00:00:00.000Z'),
      },
      {
        tenantId,
        partyType: 'farmer',
        partyId: String(farm001ForRate._id),
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
