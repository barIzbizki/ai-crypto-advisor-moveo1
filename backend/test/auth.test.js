const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAuthRouter, validateSignupInput } = require('../src/routes/auth');
const { errorHandler } = require('../src/middleware/errorHandler');

const TEST_CONFIG = { jwtSecret: 'test-secret' };
const PG_UNIQUE_VIOLATION = '23505';

function createFakePool({ existingEmails = [] } = {}) {
  return {
    async query(sql, params) {
      if (sql.startsWith('INSERT INTO users')) {
        const [email] = params;
        if (existingEmails.includes(email)) {
          const err = new Error('duplicate key value violates unique constraint "users_email_unique"');
          err.code = PG_UNIQUE_VIOLATION;
          throw err;
        }
        return { rows: [{ id: 1, email, name: params[1] }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

async function startTestServer(pool) {
  const app = express();
  app.use(express.json());
  app.use(createAuthRouter(pool, TEST_CONFIG));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function signup(baseUrl, body) {
  const response = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('validateSignupInput: valid input has no errors', () => {
  const errors = validateSignupInput({ email: 'a@example.com', name: 'Ada', password: 'longenough' });
  assert.deepEqual(errors, {});
});

test('validateSignupInput: flags missing fields', () => {
  const errors = validateSignupInput({ email: '', name: '', password: '' });
  assert.equal(errors.email, 'Email is required');
  assert.equal(errors.name, 'Name is required');
  assert.equal(errors.password, 'Password is required');
});

test('validateSignupInput: flags malformed email', () => {
  const errors = validateSignupInput({ email: 'not-an-email', name: 'Ada', password: 'longenough' });
  assert.equal(errors.email, 'Email is not a valid email address');
});

test('validateSignupInput: flags short password', () => {
  const errors = validateSignupInput({ email: 'a@example.com', name: 'Ada', password: 'short' });
  assert.equal(errors.password, 'Password must be at least 8 characters');
});

test('POST /auth/signup: successful signup returns token and user', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await signup(baseUrl, {
    email: 'new@example.com',
    name: 'Ada Lovelace',
    password: 'longenough',
  });

  assert.equal(status, 201);
  assert.equal(typeof body.token, 'string');
  assert.equal(body.user.email, 'new@example.com');
  assert.equal(body.user.name, 'Ada Lovelace');
  assert.equal(body.user.password, undefined);
});

test('POST /auth/signup: missing field returns 400 with field errors', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await signup(baseUrl, { email: '', name: 'Ada', password: 'longenough' });

  assert.equal(status, 400);
  assert.equal(body.error.fields.email, 'Email is required');
});

test('POST /auth/signup: duplicate email returns 409', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool({ existingEmails: ['taken@example.com'] }));
  t.after(() => server.close());

  const { status, body } = await signup(baseUrl, {
    email: 'taken@example.com',
    name: 'Ada',
    password: 'longenough',
  });

  assert.equal(status, 409);
  assert.match(body.error.message, /already in use/i);
});
