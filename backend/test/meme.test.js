const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createMemeRouter } = require('../src/routes/meme');
const { errorHandler } = require('../src/middleware/errorHandler');
const memes = require('../src/services/memes.json');

const TEST_CONFIG = {
  jwtSecret: 'test-secret',
};

async function startTestServer(config = TEST_CONFIG) {
  const app = express();
  app.use(express.json());
  app.use(createMemeRouter(null, config));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function fetchMeme(baseUrl, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/dashboard/meme`, { headers });
  return { status: response.status, body: await response.json() };
}

test('GET /dashboard/meme: response matches an entry from the curated list', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());

  const { status, body } = await fetchMeme(baseUrl, tokenFor(1));

  assert.equal(status, 200);
  assert.ok(memes.some((meme) => meme.imageUrl === body.imageUrl && meme.caption === body.caption));
});

test('GET /dashboard/meme: repeated requests can return different entries', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());

  const results = new Set();
  for (let i = 0; i < 50; i += 1) {
    const { body } = await fetchMeme(baseUrl, tokenFor(1));
    results.add(body.imageUrl);
  }

  assert.ok(results.size > 1, 'expected random selection to surface more than one meme across 50 requests');
});

test('GET /dashboard/meme: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer();
  t.after(() => server.close());

  const { status } = await fetchMeme(baseUrl, null);

  assert.equal(status, 401);
});
