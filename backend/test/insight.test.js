const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createInsightRouter } = require('../src/routes/insight');
const { errorHandler } = require('../src/middleware/errorHandler');
const fallbackInsight = require('../src/services/insightFallback.json');

const TEST_CONFIG = {
  jwtSecret: 'test-secret',
  llmApiKey: 'test-key',
  llmApiBaseUrl: 'https://fake.huggingface.test/v1/chat/completions',
  llmModel: 'test-model:test-provider',
};

const UNCONFIGURED_CONFIG = {
  jwtSecret: 'test-secret',
  llmApiKey: '',
  llmApiBaseUrl: 'https://fake.huggingface.test/v1/chat/completions',
  llmModel: 'test-model:test-provider',
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
  app.use(createInsightRouter(pool, config));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function fetchInsight(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/dashboard/insight`, { headers });
  return { status: response.status, body: await response.json() };
}

function mockHuggingFaceFetch(t, handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    if (!url.toString().startsWith(TEST_CONFIG.llmApiBaseUrl)) {
      return original(url, options);
    }
    calls.push({ url: url.toString(), options });
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

test('GET /dashboard/insight: insight tailored when investorType is saved', async (t) => {
  const calls = mockHuggingFaceFetch(t, () => jsonResponse({ choices: [{ message: { content: 'Long-term holders win by staying patient.' } }] }));
  const pool = createFakePool({ settingsByUserId: { 1: { investorType: 'long-term-holder' } } });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await fetchInsight(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.insight, { text: 'Long-term holders win by staying patient.' });
  const requestBody = JSON.parse(calls[0].options.body);
  assert.equal(requestBody.model, TEST_CONFIG.llmModel);
  assert.match(requestBody.messages[0].content, /long-term holder/);
});

test('GET /dashboard/insight: generic insight when no preferences saved', async (t) => {
  const calls = mockHuggingFaceFetch(t, () => jsonResponse({ choices: [{ message: { content: 'Crypto markets never sleep.' } }] }));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchInsight(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.insight, { text: 'Crypto markets never sleep.' });
  const requestBody = JSON.parse(calls[0].options.body);
  assert.match(requestBody.messages[0].content, /curious investor/);
});

test('GET /dashboard/insight: falls back to static insight when the Hugging Face call fails', async (t) => {
  mockHuggingFaceFetch(t, () => jsonResponse({ error: 'rate limited' }, 429));
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await fetchInsight(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.insight, fallbackInsight);
});

test('GET /dashboard/insight: falls back to static insight when unconfigured, without calling the API', async (t) => {
  const calls = mockHuggingFaceFetch(t, () => jsonResponse({ choices: [{ message: { content: 'unused' } }] }));
  const { server, baseUrl } = await startTestServer(createFakePool(), UNCONFIGURED_CONFIG);
  t.after(() => server.close());

  const { status, body } = await fetchInsight(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.insight, fallbackInsight);
  assert.equal(calls.length, 0);
});

test('GET /dashboard/insight: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchInsight(baseUrl, null);

  assert.equal(status, 401);
});
