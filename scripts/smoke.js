// Smoke test purpose:
// Quickly verify that core backend APIs are alive and behaving correctly.
// This is not a full test suite; it is a "basic health + happy path" check.
const dotenv = require('dotenv');

dotenv.config();

// Configurable target URL and login credentials.
const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const email = process.env.SMOKE_ADMIN_EMAIL || 'admin@biocng.local';
const password = process.env.SMOKE_ADMIN_PASSWORD || 'Admin@123';

// Timestamp helps create unique codes in each run.
const now = Date.now();

// Small assertion helper for readable failures.
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Tiny HTTP helper with JSON parsing fallback.
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
  console.log(`Smoke test base URL: ${baseUrl}`);

  // 1) Login and get token.
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert(login.ok, `Login failed (${login.status}): ${JSON.stringify(login.body)}`);
  assert(login.body && login.body.token, 'Login response missing token');

  const token = login.body.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 2) Verify token can access /me.
  const me = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(me.ok, `Me failed (${me.status}): ${JSON.stringify(me.body)}`);

  // 3) Feedstock create/list.
  const feedstockCreate = await request('/api/feedstock-types', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: `SMOKE_FS_${now}`,
      name: 'Smoke Feedstock',
      uom: 'ton',
    }),
  });
  assert(feedstockCreate.ok, `Create feedstock failed (${feedstockCreate.status}): ${JSON.stringify(feedstockCreate.body)}`);

  const feedstockList = await request('/api/feedstock-types', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(feedstockList.ok, `List feedstock failed (${feedstockList.status}): ${JSON.stringify(feedstockList.body)}`);
  const feedstockTypeId = feedstockCreate.body && feedstockCreate.body._id;
  assert(feedstockTypeId, 'Create feedstock response missing _id');

  // 4) Farmer create/list.
  const farmerCreate = await request('/api/farmers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: `SMOKE_FR_${now}`,
      name: 'Smoke Farmer',
      mobile: '9000000000',
      village: 'Smoke Village',
    }),
  });
  assert(farmerCreate.ok, `Create farmer failed (${farmerCreate.status}): ${JSON.stringify(farmerCreate.body)}`);

  const farmerList = await request('/api/farmers', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(farmerList.ok, `List farmers failed (${farmerList.status}): ${JSON.stringify(farmerList.body)}`);
  const farmerId = farmerCreate.body && farmerCreate.body._id;
  assert(farmerId, 'Create farmer response missing _id');

  // 5) Collection center create/list.
  const centerCreate = await request('/api/collection-centers', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      code: `SMOKE_CC_${now}`,
      name: 'Smoke Center',
      location: 'Smoke Zone',
      managerName: 'Smoke Manager',
    }),
  });
  assert(centerCreate.ok, `Create center failed (${centerCreate.status}): ${JSON.stringify(centerCreate.body)}`);

  const centerList = await request('/api/collection-centers', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(centerList.ok, `List centers failed (${centerList.status}): ${JSON.stringify(centerList.body)}`);

  // 6) Vehicle create/list.
  const vehicleCreate = await request('/api/vehicles', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      number: `SMOKE${String(now).slice(-6)}`,
      capacityTon: 9,
      ownerType: 'owned',
    }),
  });
  assert(vehicleCreate.ok, `Create vehicle failed (${vehicleCreate.status}): ${JSON.stringify(vehicleCreate.body)}`);

  const vehicleList = await request('/api/vehicles', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(vehicleList.ok, `List vehicles failed (${vehicleList.status}): ${JSON.stringify(vehicleList.body)}`);

  // 7) Land parcel create/list.
  const landParcelCreate = await request('/api/land-parcels', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      parcelCode: `LP-SMOKE-${String(now).slice(-6)}`,
      landType: 'rented',
      lessorName: 'Smoke Lessor',
      village: 'Smoke Village',
      district: 'Smoke District',
      areaAcres: 5,
      leaseStartDate: '2026-01-01T00:00:00.000Z',
      leaseEndDate: '2027-12-31T00:00:00.000Z',
      rentPerAcrePerYear: 21000,
    }),
  });
  assert(landParcelCreate.ok, `Create land parcel failed (${landParcelCreate.status}): ${JSON.stringify(landParcelCreate.body)}`);
  const landParcelId = landParcelCreate.body && landParcelCreate.body._id;
  assert(landParcelId, 'Create land parcel response missing _id');

  const landParcelList = await request('/api/land-parcels', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(landParcelList.ok, `List land parcels failed (${landParcelList.status}): ${JSON.stringify(landParcelList.body)}`);

  // 8) Crop plan create/list.
  const cropPlanCreate = await request('/api/crop-plans', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      planCode: `CP-SMOKE-${String(now).slice(-6)}`,
      landParcelId,
      feedstockTypeId,
      sowingDate: '2026-06-01T00:00:00.000Z',
      expectedHarvestDate: '2026-10-01T00:00:00.000Z',
      expectedYieldTon: 42,
      estimatedCost: 75000,
      notes: 'Smoke test crop plan',
    }),
  });
  assert(cropPlanCreate.ok, `Create crop plan failed (${cropPlanCreate.status}): ${JSON.stringify(cropPlanCreate.body)}`);

  const cropPlanList = await request('/api/crop-plans', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(cropPlanList.ok, `List crop plans failed (${cropPlanList.status}): ${JSON.stringify(cropPlanList.body)}`);
  const cropPlanId = cropPlanCreate.body && cropPlanCreate.body._id;
  assert(cropPlanId, 'Create crop plan response missing _id');

  // 9) Harvest batch create/list (batch and lot should auto-generate).
  const harvestBatchCreate = await request('/api/harvest-batches', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      landParcelId,
      cropPlanId,
      feedstockTypeId,
      harvestDate: '2026-10-10T00:00:00.000Z',
      grossQtyTon: 33,
      moisturePercent: 19,
      qualityGrade: 'A',
      notes: 'Smoke harvest batch',
    }),
  });
  assert(
    harvestBatchCreate.ok,
    `Create harvest batch failed (${harvestBatchCreate.status}): ${JSON.stringify(harvestBatchCreate.body)}`
  );
  assert(
    harvestBatchCreate.body && harvestBatchCreate.body.batchCode,
    'Expected auto-generated batchCode in harvest batch response'
  );
  assert(
    harvestBatchCreate.body && harvestBatchCreate.body.lotNo,
    'Expected auto-generated lotNo in harvest batch response'
  );

  const harvestBatchList = await request('/api/harvest-batches', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    harvestBatchList.ok,
    `List harvest batches failed (${harvestBatchList.status}): ${JSON.stringify(harvestBatchList.body)}`
  );

  // 10) Rate card create/list.
  const currentRate = await request('/api/rate-cards', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyType: 'farmer',
      partyId: farmerId,
      feedstockTypeId,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      ratePerTon: 1550,
      qualityAdjustments: [],
    }),
  });
  assert(currentRate.ok, `Create current rate card failed (${currentRate.status}): ${JSON.stringify(currentRate.body)}`);

  const futureRate = await request('/api/rate-cards', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyType: 'farmer',
      partyId: farmerId,
      feedstockTypeId,
      effectiveFrom: '2027-01-01T00:00:00.000Z',
      ratePerTon: 1750,
      qualityAdjustments: [],
    }),
  });
  assert(futureRate.ok, `Create future rate card failed (${futureRate.status}): ${JSON.stringify(futureRate.body)}`);

  const rateList = await request(`/api/rate-cards?partyType=farmer&partyId=${encodeURIComponent(farmerId)}&feedstockTypeId=${encodeURIComponent(feedstockTypeId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(rateList.ok, `List rate cards failed (${rateList.status}): ${JSON.stringify(rateList.body)}`);
  assert(Array.isArray(rateList.body) && rateList.body.length >= 2, 'Expected at least 2 rate cards for smoke entity');

  // 11) Verify resolve endpoint chooses correct row by date.
  const resolvedCurrent = await request(
    `/api/rate-cards/resolve?partyType=farmer&partyId=${encodeURIComponent(farmerId)}&feedstockTypeId=${encodeURIComponent(feedstockTypeId)}&asOf=2026-06-01T00:00:00.000Z`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  assert(resolvedCurrent.ok, `Resolve current rate failed (${resolvedCurrent.status}): ${JSON.stringify(resolvedCurrent.body)}`);
  assert(resolvedCurrent.body.ratePerTon === 1550, `Expected rate 1550, got ${resolvedCurrent.body.ratePerTon}`);

  const resolvedFuture = await request(
    `/api/rate-cards/resolve?partyType=farmer&partyId=${encodeURIComponent(farmerId)}&feedstockTypeId=${encodeURIComponent(feedstockTypeId)}&asOf=2027-06-01T00:00:00.000Z`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  assert(resolvedFuture.ok, `Resolve future rate failed (${resolvedFuture.status}): ${JSON.stringify(resolvedFuture.body)}`);
  assert(resolvedFuture.body.ratePerTon === 1750, `Expected rate 1750, got ${resolvedFuture.body.ratePerTon}`);

  console.log('Smoke test passed');
}

// Exit with non-zero code if anything fails (useful for CI pipelines).
main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
