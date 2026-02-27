const dotenv = require('dotenv');

dotenv.config();

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const email = process.env.SMOKE_ADMIN_EMAIL || 'admin@biocng.local';
const password = process.env.SMOKE_ADMIN_PASSWORD || 'Admin@123';

const now = Date.now();

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
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
  console.log(`Smoke test base URL: ${baseUrl}`);

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

  const me = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert(me.ok, `Me failed (${me.status}): ${JSON.stringify(me.body)}`);

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

  console.log('Smoke test passed');
}

main().catch((error) => {
  console.error(`Smoke test failed: ${error.message}`);
  process.exit(1);
});