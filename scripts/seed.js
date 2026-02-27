const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const FeedstockType = require('../src/models/FeedstockType');
const Farmer = require('../src/models/Farmer');
const CollectionCenter = require('../src/models/CollectionCenter');
const Vehicle = require('../src/models/Vehicle');

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/biogas';

async function runSeed() {
  await mongoose.connect(mongoURI);

  const tenantId = process.env.SEED_TENANT_ID || 'tenant-demo-plant-1';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@biocng.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

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
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const feedstockTypes = [
    { code: 'PRESSMUD', name: 'Pressmud', uom: 'ton' },
    { code: 'CATTLE_DUNG', name: 'Cattle Dung', uom: 'ton' },
    { code: 'AGRI_RESIDUE', name: 'Agri Residue', uom: 'ton' },
  ];

  for (const row of feedstockTypes) {
    await FeedstockType.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const farmers = [
    { code: 'FARM001', name: 'Ramesh Kumar', mobile: '9990001111', village: 'Rampur' },
    { code: 'FARM002', name: 'Suresh Patel', mobile: '9990002222', village: 'Kheda' },
  ];

  for (const row of farmers) {
    await Farmer.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const centers = [
    { code: 'CC-NORTH', name: 'North Collection Center', location: 'Zone North', managerName: 'Amit' },
    { code: 'CC-SOUTH', name: 'South Collection Center', location: 'Zone South', managerName: 'Vijay' },
  ];

  for (const row of centers) {
    await CollectionCenter.findOneAndUpdate(
      { tenantId, code: row.code },
      { ...row, tenantId, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const vehicles = [
    { number: 'GJ01AB1234', capacityTon: 10, ownerType: 'owned' },
    { number: 'GJ01CD5678', capacityTon: 12, ownerType: 'contracted' },
  ];

  for (const row of vehicles) {
    await Vehicle.findOneAndUpdate(
      { tenantId, number: row.number },
      { ...row, tenantId, isActive: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log('Seed completed');
  console.log(`Tenant ID: ${tenantId}`);
  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Admin Password: ${adminPassword}`);
}

runSeed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.connection.close();
  });