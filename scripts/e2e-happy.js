// Dedicated happy-path E2E script.
// Goal: verify one clean operational flow from login to weekly invoice generation.
const dotenv = require('dotenv');

dotenv.config();

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const email = process.env.SMOKE_ADMIN_EMAIL || 'admin@biocng.local';
const password = process.env.SMOKE_ADMIN_PASSWORD || 'Admin@123';
const now = Date.now();

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (error) {
    body = text;
  }

  return { ok: response.ok, status: response.status, body };
}

async function main() {
  console.log(`E2E happy-path base URL: ${baseUrl}`);

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert(login.ok, `Login failed (${login.status}): ${JSON.stringify(login.body)}`);
  assert(login.body && login.body.token, 'Missing token in login response');

  const token = login.body.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const feedstockCreate = await request('/api/feedstock-types', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: `E2E_FS_${now}`,
      name: 'E2E Feedstock',
      uom: 'ton',
    }),
  });
  assert(feedstockCreate.ok, `Create feedstock failed (${feedstockCreate.status}): ${JSON.stringify(feedstockCreate.body)}`);
  const feedstockTypeId = feedstockCreate.body._id;

  const centerCreate = await request('/api/collection-centers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: `E2E_CC_${now}`,
      name: 'E2E Collection Center',
      location: 'E2E Zone',
      managerName: 'E2E Manager',
    }),
  });
  assert(centerCreate.ok, `Create center failed (${centerCreate.status}): ${JSON.stringify(centerCreate.body)}`);
  const centerId = centerCreate.body._id;

  const vehicleCreate = await request('/api/vehicles', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      number: `E2E${String(now).slice(-6)}`,
      capacityTon: 10,
      ownerType: 'owned',
    }),
  });
  assert(vehicleCreate.ok, `Create vehicle failed (${vehicleCreate.status}): ${JSON.stringify(vehicleCreate.body)}`);
  const vehicleId = vehicleCreate.body._id;

  const tripCreate = await request('/api/dispatch-trips', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sourceType: 'collection-center',
      collectionCenterId: centerId,
      vehicleId,
      destinationPlantName: 'Main Plant',
      plannedLots: [],
      status: 'planned',
      notes: 'E2E happy path dispatch',
    }),
  });
  assert(tripCreate.ok, `Create dispatch failed (${tripCreate.status}): ${JSON.stringify(tripCreate.body)}`);
  const dispatchTripId = tripCreate.body._id;

  const intakeCreate = await request('/api/plant-intake-entries', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      dispatchTripId,
      feedstockTypeId,
      sourceType: 'collection-center',
      sourceRefId: centerId,
      grossWeightTon: 11,
      tareWeightTon: 2,
      netWeightTon: 9,
      acceptedQtyTon: 8.5,
      rejectedQtyTon: 0.5,
      intakeDate: '2026-10-12T14:00:00.000Z',
      notes: 'E2E happy path intake',
    }),
  });
  assert(intakeCreate.ok, `Create intake failed (${intakeCreate.status}): ${JSON.stringify(intakeCreate.body)}`);

  const centerRateCreate = await request('/api/rate-cards', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyType: 'collection-center',
      partyId: centerId,
      feedstockTypeId,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      ratePerTon: 1600,
      qualityAdjustments: [],
    }),
  });
  assert(
    centerRateCreate.ok,
    `Create center rate card failed (${centerRateCreate.status}): ${JSON.stringify(centerRateCreate.body)}`
  );

  const invoiceGenerate = await request('/api/invoices/generate-weekly', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      weekStartDate: '2026-10-06T00:00:00.000Z',
      weekEndDate: '2026-10-13T23:59:59.999Z',
      partyType: 'collection-center',
      forceRegen: true,
      notes: 'E2E happy path invoice generation',
    }),
  });
  assert(
    invoiceGenerate.ok,
    `Generate invoice failed (${invoiceGenerate.status}): ${JSON.stringify(invoiceGenerate.body)}`
  );
  assert(
    invoiceGenerate.body && invoiceGenerate.body.generatedCount >= 1,
    'Expected at least one generated invoice in happy path'
  );

  console.log('E2E happy path passed');
}

main().catch((error) => {
  console.error(`E2E happy path failed: ${error.message}`);
  process.exit(1);
});
