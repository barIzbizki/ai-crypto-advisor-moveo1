const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createNewsRouter } = require('../src/routes/news');
const { errorHandler } = require('../src/middleware/errorHandler');
const fallbackHeadlines = require('../src/services/newsFallback.json');

const TEST_CONFIG = {
  jwtSecret: 'test-secret',
  cryptoPanicApiKey: 'test-key',
  cryptoPanicApiBaseUrl: 'https://fake.cryptopanic.test/api/v1',
};

const UNCONFIGURED_CONFIG = {
  jwtSecret: 'test-secret',
  cryptoPanicApiKey: '',
  cryptoPanicApiBaseUrl: 'https://fake.cryptopanic.test/api/v1',
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
  app.use(createNewsRouter(pool, config));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function fetchNews(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/dashboard/news`, { headers });
  return { status: response.status, body: await response.json() };
}

function mockCryptoPanicFetch(t, handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    if (!url.toString().startsWith(TEST_CONFIG.cryptoPanicApiBaseUrl)) {
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

test('GET /dashboard/news: headlines filtered by saved assets of interest', async (t) => {
  const calls = mockCryptoPanicFetch(t, () => jsonResponse({
    results: [
      { title: 'BTC rallies', url: 'https://example.com/btc', source: { title: 'Example News' }, published_at: '2026-09-01T00:00:00Z' },
    ],
  }));
  const pool = createFakePool({ settingsByUserId: { 1: { assetsOfInterest: ['BTC'] } } });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await fetchNews(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.headlines, [
    { title: 'BTC rallies', url: 'https://example.com/btc', source: 'Example News', publishedAt: '2026-09-01T00:00:00Z' },
  ]);
  assert.match(calls[0], /currencies=BTC/);
});

test('GET /dashboard/news: general headlines when no preferences saved', async (t) => {
  const calls = mockCryptoPanicFetch(t, () => jsonResponse({
    results: [
      { title: 'General crypto update', url: 'https://example.com/general', source: { title: 'Example News' }, published_at: '2026-09-01T00:00:00Z' },
    ],
  }));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchNews(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(body.headlines.length, 1);
  assert.ok(!calls[0].includes('currencies='));
});

test('GET /dashboard/news: falls back to static list when the CryptoPanic call fails', async (t) => {
  mockCryptoPanicFetch(t, () => jsonResponse({ error: 'rate limited' }, 429));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchNews(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.headlines, fallbackHeadlines);
});

test('GET /dashboard/news: falls back to static list when unconfigured, without calling the API', async (t) => {
  const calls = mockCryptoPanicFetch(t, () => jsonResponse({ results: [] }));
  const { server, baseUrl } = await startTestServer(createFakePool(), UNCONFIGURED_CONFIG);
  t.after(() => server.close());

  const { status, body } = await fetchNews(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.headlines, fallbackHeadlines);
  assert.equal(calls.length, 0);
});

test('GET /dashboard/news: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchNews(baseUrl, null);

  assert.equal(status, 401);
});
