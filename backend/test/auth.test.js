const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createAuthRouter, validateSignupInput, validateLoginInput } = require('../src/routes/auth');
const { requireAuth } = require('../src/middleware/auth');
const { errorHandler, asyncHandler } = require('../src/middleware/errorHandler');

const TEST_CONFIG = { jwtSecret: 'test-secret' };
const PG_UNIQUE_VIOLATION = '23505';

function createFakePool({ existingEmails = [], users = [] } = {}) {
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
      if (sql.startsWith('SELECT id, email, name, password_hash FROM users WHERE email')) {
        const [email] = params;
        const user = users.find((u) => u.email === email);
        return { rows: user ? [user] : [] };
      }
      if (sql.startsWith('SELECT id, email, name FROM users WHERE id')) {
        const [id] = params;
        const user = users.find((u) => u.id === id);
        return { rows: user ? [{ id: user.id, email: user.email, name: user.name }] : [] };
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

async function login(baseUrl, body) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('validateLoginInput: valid input has no errors', () => {
  const errors = validateLoginInput({ email: 'a@example.com', password: 'longenough' });
  assert.deepEqual(errors, {});
});

test('validateLoginInput: flags missing fields', () => {
  const errors = validateLoginInput({ email: '', password: '' });
  assert.equal(errors.email, 'Email is required');
  assert.equal(errors.password, 'Password is required');
});

test('POST /auth/login: successful login returns token and user', async (t) => {
  const passwordHash = await bcrypt.hash('correct-password', 10);
  const pool = createFakePool({
    users: [{ id: 1, email: 'known@example.com', name: 'Ada Lovelace', password_hash: passwordHash }],
  });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await login(baseUrl, { email: 'known@example.com', password: 'correct-password' });

  assert.equal(status, 200);
  assert.equal(typeof body.token, 'string');
  assert.equal(body.user.email, 'known@example.com');
  assert.equal(body.user.name, 'Ada Lovelace');
  assert.equal(body.user.password, undefined);
  assert.equal(body.user.password_hash, undefined);
});

test('POST /auth/login: missing field returns 400 with field errors', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await login(baseUrl, { email: '', password: 'longenough' });

  assert.equal(status, 400);
  assert.equal(body.error.fields.email, 'Email is required');
});

test('POST /auth/login: unknown email returns generic 401', async (t) => {
  const { server, baseUrl } = await startTestServer(createFakePool());
  t.after(() => server.close());

  const { status, body } = await login(baseUrl, { email: 'nobody@example.com', password: 'whatever1' });

  assert.equal(status, 401);
  assert.match(body.error.message, /invalid email or password/i);
});

test('POST /auth/login: wrong password returns the same generic 401', async (t) => {
  const passwordHash = await bcrypt.hash('correct-password', 10);
  const pool = createFakePool({
    users: [{ id: 1, email: 'known@example.com', name: 'Ada Lovelace', password_hash: passwordHash }],
  });
  const { server, baseUrl } = await startTestServer(pool);
  t.after(() => server.close());

  const { status, body } = await login(baseUrl, { email: 'known@example.com', password: 'wrong-password' });

  assert.equal(status, 401);
  assert.match(body.error.message, /invalid email or password/i);
});

async function startProtectedTestServer() {
  const app = express();
  app.use(express.json());
  app.get('/protected', requireAuth(TEST_CONFIG), asyncHandler(async (req, res) => {
    res.json({ userId: req.user.id });
  }));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test('requireAuth: missing Authorization header returns 401', async (t) => {
  const { server, baseUrl } = await startProtectedTestServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/protected`);
  assert.equal(response.status, 401);
});

test('requireAuth: malformed Authorization header returns 401', async (t) => {
  const { server, baseUrl } = await startProtectedTestServer();
  t.after(() => server.close());

  const response = await fetch(`${baseUrl}/protected`, { headers: { Authorization: 'not-a-bearer-token' } });
  assert.equal(response.status, 401);
});

test('requireAuth: expired or invalid-signature token returns 401', async (t) => {
  const { server, baseUrl } = await startProtectedTestServer();
  t.after(() => server.close());

  const expiredToken = jwt.sign({ sub: 1 }, TEST_CONFIG.jwtSecret, { expiresIn: -10 });
  const response = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${expiredToken}` } });
  assert.equal(response.status, 401);

  const wrongSignatureToken = jwt.sign({ sub: 1 }, 'a-different-secret');
  const response2 = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${wrongSignatureToken}` } });
  assert.equal(response2.status, 401);
});

test('requireAuth: valid token reaches the handler with req.user set', async (t) => {
  const { server, baseUrl } = await startProtectedTestServer();
  t.after(() => server.close());

  const token = jwt.sign({ sub: 42 }, TEST_CONFIG.jwtSecret);
  const response = await fetch(`${baseUrl}/protected`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.userId, 42);
});
