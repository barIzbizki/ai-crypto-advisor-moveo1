const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createPreferencesRouter, validatePreferencesInput } = require('../src/routes/preferences');
const { errorHandler } = require('../src/middleware/errorHandler');

const TEST_CONFIG = { jwtSecret: 'test-secret' };

function createFakePool({ rowsByUserId = {} } = {}) {
  const saved = { ...rowsByUserId };
  return {
    saved,
    async query(sql, params) {
      if (sql.startsWith('INSERT INTO preferences')) {
        const [userId, settings] = params;
        saved[userId] = settings;
        return { rows: [{ settings }] };
      }
      if (sql.startsWith('SELECT settings FROM preferences')) {
        const [userId] = params;
        const settings = saved[userId];
        return { rows: settings ? [{ settings }] : [] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

async function startTestServer(pool) {
  const app = express();
  app.use(express.json());
  app.use(createPreferencesRouter(pool, TEST_CONFIG));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function savePreferences(baseUrl, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/preferences`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

async function fetchPreferences(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/preferences`, { headers });
  return { status: response.status, body: await response.json() };
}

const VALID_PREFERENCES = {
  assetsOfInterest: ['bitcoin', 'ethereum'],
  investorType: 'long-term-holder',
  contentTypes: ['news', 'analysis'],
};

test('validatePreferencesInput: valid input has no errors', () => {
  const errors = validatePreferencesInput(VALID_PREFERENCES);
  assert.deepEqual(errors, {});
});

test('validatePreferencesInput: flags missing fields', () => {
  const errors = validatePreferencesInput({ assetsOfInterest: [], investorType: '', contentTypes: [] });
  assert.equal(errors.assetsOfInterest, 'At least one asset of interest is required');
  assert.equal(errors.investorType, 'Investor type is required');
  assert.equal(errors.contentTypes, 'At least one content type is required');
});

test('POST /preferences: first-time save persists and returns preferences', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await savePreferences(baseUrl, VALID_PREFERENCES, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body, VALID_PREFERENCES);
});

test('POST /preferences: resubmission overwrites prior answers', async (t) => {
  const pool = createFakePool({ rowsByUserId: { 1: VALID_PREFERENCES } });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const updated = { assetsOfInterest: ['solana'], investorType: 'day-trader', contentTypes: ['news'] };
  const { status, body } = await savePreferences(baseUrl, updated, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body, updated);
  assert.deepEqual(pool.saved[1], updated);
});

test('POST /preferences: missing field returns 400 without writing', async (t) => {
  const pool = createFakePool();
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await savePreferences(
    baseUrl,
    { assetsOfInterest: [], investorType: 'day-trader', contentTypes: ['news'] },
    tokenFor(1),
  );

  assert.equal(status, 400);
  assert.equal(body.error.fields.assetsOfInterest, 'At least one asset of interest is required');
  assert.equal(pool.saved[1], undefined);
});

test('POST /preferences: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await savePreferences(baseUrl, VALID_PREFERENCES, null);

  assert.equal(status, 401);
});

test('GET /preferences: returns saved preferences', async (t) => {
  const pool = createFakePool({ rowsByUserId: { 1: VALID_PREFERENCES } });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await fetchPreferences(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body, VALID_PREFERENCES);
});

test('GET /preferences: no preferences saved yet returns 404', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchPreferences(baseUrl, tokenFor(1));

  assert.equal(status, 404);
});

test('GET /preferences: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchPreferences(baseUrl, null);

  assert.equal(status, 401);
});
