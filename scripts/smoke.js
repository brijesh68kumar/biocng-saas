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
  const centerId = centerCreate.body && centerCreate.body._id;
  assert(centerId, 'Create center response missing _id');

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
  const harvestBatchId = harvestBatchCreate.body && harvestBatchCreate.body._id;
  assert(harvestBatchId, 'Create harvest batch response missing _id');

  const harvestBatchList = await request('/api/harvest-batches', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    harvestBatchList.ok,
    `List harvest batches failed (${harvestBatchList.status}): ${JSON.stringify(harvestBatchList.body)}`
  );

  // 10) Center receipt create should auto-post IN ledger entry.
  const centerReceiptCreate = await request('/api/center-receipt-lots', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      collectionCenterId: centerId,
      sourceType: 'farmer',
      sourceRefId: farmerId,
      feedstockTypeId,
      receiptDate: '2026-10-12T00:00:00.000Z',
      grossQtyTon: 25,
      moisturePercent: 17,
      qualityGrade: 'A',
      notes: 'Smoke center receipt',
    }),
  });
  assert(
    centerReceiptCreate.ok,
    `Create center receipt failed (${centerReceiptCreate.status}): ${JSON.stringify(centerReceiptCreate.body)}`
  );
  const centerReceiptLotId = centerReceiptCreate.body && centerReceiptCreate.body._id;
  assert(centerReceiptLotId, 'Create center receipt response missing _id');

  const centerReceiptList = await request('/api/center-receipt-lots', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    centerReceiptList.ok,
    `List center receipt lots failed (${centerReceiptList.status}): ${JSON.stringify(centerReceiptList.body)}`
  );

  const ledgerAfterIn = await request(`/api/center-stock-ledger?centerReceiptLotId=${encodeURIComponent(centerReceiptLotId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(
    ledgerAfterIn.ok,
    `List center stock ledger failed (${ledgerAfterIn.status}): ${JSON.stringify(ledgerAfterIn.body)}`
  );
  assert(Array.isArray(ledgerAfterIn.body) && ledgerAfterIn.body.length >= 1, 'Expected at least one IN ledger row');
  const hasIn = ledgerAfterIn.body.some((x) => x.movementType === 'IN');
  assert(hasIn, 'Expected IN ledger row after center receipt creation');

  // 11) Post OUT movement and verify balance changes.
  const outPost = await request('/api/center-stock-ledger/out', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      centerReceiptLotId,
      qtyTon: 8,
      refType: 'smoke-out',
      refId: `SMOKE-OUT-${now}`,
      remarks: 'Smoke OUT movement',
    }),
  });
  assert(outPost.ok, `Post OUT ledger failed (${outPost.status}): ${JSON.stringify(outPost.body)}`);
  assert(outPost.body.movementType === 'OUT', 'Expected OUT movement type');
  assert(outPost.body.balanceAfterTon === 17, `Expected balanceAfterTon 17, got ${outPost.body.balanceAfterTon}`);

  // 12) Dispatch trip create/list/status transition.
  const dispatchCreate = await request('/api/dispatch-trips', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sourceType: 'mixed',
      collectionCenterId: centerId,
      landParcelId,
      vehicleId: vehicleCreate.body && vehicleCreate.body._id,
      driverName: 'Smoke Dispatch Driver',
      driverPhone: '9993332211',
      destinationPlantName: 'Main Plant',
      plannedLots: [
        {
          lotSourceType: 'center-receipt',
          lotRefId: centerReceiptLotId,
          qtyTon: 5,
        },
        {
          lotSourceType: 'harvest-batch',
          lotRefId: harvestBatchId,
          qtyTon: 7,
        },
      ],
      status: 'planned',
      notes: 'Smoke dispatch trip',
    }),
  });
  assert(dispatchCreate.ok, `Create dispatch trip failed (${dispatchCreate.status}): ${JSON.stringify(dispatchCreate.body)}`);
  const dispatchTripId = dispatchCreate.body && dispatchCreate.body._id;
  assert(dispatchTripId, 'Create dispatch trip response missing _id');

  const dispatchList = await request('/api/dispatch-trips?status=planned', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(dispatchList.ok, `List dispatch trips failed (${dispatchList.status}): ${JSON.stringify(dispatchList.body)}`);

  const dispatchStatusUpdate = await request(`/api/dispatch-trips/${dispatchTripId}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'dispatched',
      dispatchDate: '2026-10-12T10:00:00.000Z',
    }),
  });
  assert(
    dispatchStatusUpdate.ok,
    `Update dispatch status failed (${dispatchStatusUpdate.status}): ${JSON.stringify(dispatchStatusUpdate.body)}`
  );
  assert(dispatchStatusUpdate.body.status === 'dispatched', 'Expected dispatch status to become dispatched');

  // 13) Plant intake create/list linked to dispatch trip.
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
      moisturePercent: 18,
      contaminationPercent: 1,
      qualityGrade: 'A',
      acceptedQtyTon: 8.7,
      rejectedQtyTon: 0.3,
      rejectionReason: 'Minor impurity',
      intakeDate: '2026-10-12T14:00:00.000Z',
      notes: 'Smoke intake entry',
    }),
  });
  assert(
    intakeCreate.ok,
    `Create plant intake failed (${intakeCreate.status}): ${JSON.stringify(intakeCreate.body)}`
  );
  assert(intakeCreate.body && intakeCreate.body.intakeCode, 'Expected auto-generated intakeCode');

  const intakeList = await request(`/api/plant-intake-entries?dispatchTripId=${encodeURIComponent(dispatchTripId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(intakeList.ok, `List intake entries failed (${intakeList.status}): ${JSON.stringify(intakeList.body)}`);
  assert(Array.isArray(intakeList.body) && intakeList.body.length >= 1, 'Expected at least one intake entry');

  // 14) Rate card create/list.
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

  // 15) Verify resolve endpoint chooses correct row by date.
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

  // 16) Add collection-center rate card and generate weekly invoice from intake rows.
  const centerRateCreate = await request('/api/rate-cards', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      partyType: 'collection-center',
      partyId: centerId,
      feedstockTypeId,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      ratePerTon: 1625,
      qualityAdjustments: [
        {
          metric: 'moisturePercent',
          operator: 'lte',
          value: 20,
          adjustmentPerTon: -50,
        },
        {
          metric: 'contaminationPercent',
          operator: 'gt',
          value: 0.5,
          adjustmentPerTon: -25,
        },
      ],
    }),
  });
  assert(
    centerRateCreate.ok,
    `Create collection-center rate card failed (${centerRateCreate.status}): ${JSON.stringify(centerRateCreate.body)}`
  );

  const invoiceGenerate = await request('/api/invoices/generate-weekly', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      weekStartDate: '2026-10-06T00:00:00.000Z',
      weekEndDate: '2026-10-13T23:59:59.999Z',
      partyType: 'collection-center',
      forceRegen: true,
      notes: 'Smoke weekly invoice generation',
    }),
  });
  assert(
    invoiceGenerate.ok,
    `Generate weekly invoice failed (${invoiceGenerate.status}): ${JSON.stringify(invoiceGenerate.body)}`
  );
  assert(
    invoiceGenerate.body && typeof invoiceGenerate.body.generatedCount === 'number',
    'Generate invoice response missing generatedCount'
  );
  assert(invoiceGenerate.body.generatedCount >= 1, 'Expected at least one generated invoice');

  const invoiceList = await request('/api/invoices?partyType=collection-center', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(invoiceList.ok, `List invoices failed (${invoiceList.status}): ${JSON.stringify(invoiceList.body)}`);
  assert(Array.isArray(invoiceList.body) && invoiceList.body.length >= 1, 'Expected at least one invoice in list');
  const hasGeneratedInvoice = invoiceList.body.some((x) => x.status === 'generated');
  assert(hasGeneratedInvoice, 'Expected generated invoice status in invoice list');
  const invoiceWithLines = invoiceList.body.find((x) => Array.isArray(x.lines) && x.lines.length > 0);
  assert(invoiceWithLines, 'Expected invoice to contain at least one line item');
  const firstLine = invoiceWithLines.lines[0];
  assert(firstLine.baseRatePerTon === 1625, `Expected baseRatePerTon 1625, got ${firstLine.baseRatePerTon}`);
  assert(
    firstLine.qualityAdjustmentPerTon === -75,
    `Expected qualityAdjustmentPerTon -75, got ${firstLine.qualityAdjustmentPerTon}`
  );
  assert(firstLine.ratePerTon === 1550, `Expected adjusted ratePerTon 1550, got ${firstLine.ratePerTon}`);
  assert(
    Array.isArray(firstLine.appliedQualityRules) && firstLine.appliedQualityRules.length === 2,
    'Expected two applied quality rules in invoice line'
  );

  console.log('Smoke test passed');
}

// Exit with non-zero code if anything fails (useful for CI pipelines).
main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});
