const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createPricesRouter } = require('../src/routes/prices');
const { errorHandler } = require('../src/middleware/errorHandler');

const TEST_CONFIG = {
  jwtSecret: 'test-secret',
  coinGeckoApiBaseUrl: 'https://fake.coingecko.test/api/v3',
};

function createFakePool({ settingsByUserId = {} } = {}) {
  return {
    async query(sql, params) {
      if (sql.startsWith('SELECT settings FROM preferences')) {
        const [userId] = params;
        const settings = settingsByUserId[userId];
        return { rows: settings ? [{ settings }] : [] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

async function startTestServer(pool, config = TEST_CONFIG) {
  const app = express();
  app.use(express.json());
  app.use(createPricesRouter(pool, config));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function fetchPricesEndpoint(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/dashboard/prices`, { headers });
  return { status: response.status, body: await response.json() };
}

function mockCoinGeckoFetch(t, handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    if (!url.toString().startsWith(TEST_CONFIG.coinGeckoApiBaseUrl)) {
      return original(url, options);
    }
    calls.push(url.toString());
    return handler(url, options);
  };
  t.after(() => {
    globalThis.fetch = original;
  });
  return calls;
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('GET /dashboard/prices: prices filtered by saved assets of interest', async (t) => {
  const calls = mockCoinGeckoFetch(t, () => jsonResponse({
    bitcoin: { usd: 65000 },
  }));
  const pool = createFakePool({ settingsByUserId: { 1: { assetsOfInterest: ['bitcoin'] } } });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await fetchPricesEndpoint(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.prices, [{ id: 'bitcoin', symbol: 'BTC', price: 65000 }]);
  assert.match(calls[0], /ids=bitcoin/);
});

test('GET /dashboard/prices: default coin set used when no preferences saved', async (t) => {
  const calls = mockCoinGeckoFetch(t, () => jsonResponse({
    bitcoin: { usd: 65000 },
    ethereum: { usd: 3400 },
  }));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchPricesEndpoint(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(body.prices.length, 2);
  assert.match(calls[0], /ids=bitcoin%2Cethereum/);
});

test('GET /dashboard/prices: explicit error status when the CoinGecko call fails', async (t) => {
  mockCoinGeckoFetch(t, () => jsonResponse({ error: 'rate limited' }, 429));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchPricesEndpoint(baseUrl, tokenFor(1));

  assert.equal(status, 502);
  assert.ok(body.error.message);
});

test('GET /dashboard/prices: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchPricesEndpoint(baseUrl, null);

  assert.equal(status, 401);
});

test('GET /dashboard/prices: sends x-cg-demo-api-key header when COINGECKO_API_KEY is configured', async (t) => {
  const requestHeaders = [];
  mockCoinGeckoFetch(t, (url, options) => {
    requestHeaders.push(options?.headers);
    return jsonResponse({ bitcoin: { usd: 65000 } });
  });

  const config = { ...TEST_CONFIG, coinGeckoApiKey: 'demo-test-key' };
  const { server, baseUrl } = await startTestServer(createFakePool(), config);
  t.after(() => server.close());

  const { status } = await fetchPricesEndpoint(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(requestHeaders[0]['x-cg-demo-api-key'], 'demo-test-key');
});
