const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createVotesRouter, validateVoteInput } = require('../src/routes/votes');
const { errorHandler } = require('../src/middleware/errorHandler');

const TEST_CONFIG = { jwtSecret: 'test-secret' };

function createFakePool() {
  const rows = [];
  return {
    rows,
    async query(sql, params) {
      if (sql.startsWith('INSERT INTO votes')) {
        const [userId, target, value] = params;
        const existing = rows.find((row) => row.userId === userId && row.target === target);
        if (existing) {
          if (existing.value === value) {
            return { rows: [] };
          }
          existing.value = value;
          return { rows: [{ value }] };
        }
        rows.push({ userId, target, value });
        return { rows: [{ value }] };
      }
      if (sql.startsWith('DELETE FROM votes')) {
        const [userId, target, value] = params;
        const index = rows.findIndex(
          (row) => row.userId === userId && row.target === target && row.value === value,
        );
        if (index !== -1) {
          rows.splice(index, 1);
        }
        return { rows: [] };
      }
      if (sql.startsWith('SELECT target, value FROM votes')) {
        const [userId, targets] = params;
        const matched = rows.filter((row) => row.userId === userId && targets.includes(row.target));
        return { rows: matched.map(({ target, value }) => ({ target, value })) };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

async function startTestServer(pool) {
  const app = express();
  app.use(express.json());
  app.use(createVotesRouter(pool, TEST_CONFIG));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function tokenFor(userId) {
  return jwt.sign({ sub: userId }, TEST_CONFIG.jwtSecret);
}

async function castVote(baseUrl, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/votes`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

async function fetchVotes(baseUrl, targets, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/votes?targets=${encodeURIComponent(targets)}`, { headers });
  return { status: response.status, body: await response.json() };
}

test('validateVoteInput: valid input has no errors', () => {
  const errors = validateVoteInput({ target: 'coin-prices', value: 1 });
  assert.deepEqual(errors, {});
});

test('validateVoteInput: flags missing target and invalid value', () => {
  const errors = validateVoteInput({ target: '', value: 5 });
  assert.equal(errors.target, 'A non-empty target is required');
  assert.equal(errors.value, 'Value must be 1 (up) or -1 (down)');
});

test('POST /votes: first vote is recorded', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await castVote(baseUrl, { target: 'coin-prices', value: 1 }, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(body.value, 1);
});

test('POST /votes: casting the opposite value changes the vote', async (t) => {
  const pool = createFakePool();
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  await castVote(baseUrl, { target: 'coin-prices', value: -1 }, tokenFor(1));
  const { status, body } = await castVote(baseUrl, { target: 'coin-prices', value: 1 }, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(body.value, 1);
  assert.equal(pool.rows.find((row) => row.userId === 1 && row.target === 'coin-prices').value, 1);
});

test('POST /votes: casting the same value again retracts the vote', async (t) => {
  const pool = createFakePool();
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  await castVote(baseUrl, { target: 'coin-prices', value: 1 }, tokenFor(1));
  const { status, body } = await castVote(baseUrl, { target: 'coin-prices', value: 1 }, tokenFor(1));

  assert.equal(status, 200);
  assert.equal(body.value, null);
  assert.equal(pool.rows.find((row) => row.userId === 1 && row.target === 'coin-prices'), undefined);
});

test('POST /votes: invalid value returns 400', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await castVote(baseUrl, { target: 'coin-prices', value: 5 }, tokenFor(1));

  assert.equal(status, 400);
  assert.ok(body.error.fields.value);
});

test('POST /votes: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await castVote(baseUrl, { target: 'coin-prices', value: 1 }, null);

  assert.equal(status, 401);
});

test('GET /votes: returns only the requesting user\'s votes for the requested targets', async (t) => {
  const pool = createFakePool();
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  await castVote(baseUrl, { target: 'coin-prices', value: 1 }, tokenFor(1));
  await castVote(baseUrl, { target: 'news:latest', value: -1 }, tokenFor(2));

  const { status, body } = await fetchVotes(baseUrl, 'coin-prices,news:latest,meme:abc', tokenFor(1));

  assert.equal(status, 200);
  assert.deepEqual(body.votes, { 'coin-prices': 1 });
});

test('GET /votes: unauthenticated request returns 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status } = await fetchVotes(baseUrl, 'coin-prices', null);

  assert.equal(status, 401);
});
