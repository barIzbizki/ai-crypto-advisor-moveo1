const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const PG_UNIQUE_VIOLATION = '23505';

function validateSignupInput({ email, name, password }) {
  const errors = {};

  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Email is not a valid email address';
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  return errors;
}

function validateLoginInput({ email, password }) {
  const errors = {};

  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email is required';
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  }

  return errors;
}

function createAuthRouter(pool, config) {
  const router = Router();

  router.post('/auth/signup', asyncHandler(async (req, res) => {
    const { email, name, password } = req.body || {};

    const errors = validateSignupInput({ email, name, password });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: { message: 'Invalid signup input', fields: errors } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    let result;
    try {
      result = await pool.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
        [normalizedEmail, trimmedName, passwordHash],
      );
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        return res.status(409).json({ error: { message: 'Email is already in use' } });
      }
      throw err;
    }

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(201).json({ token, user });
  }));

  router.post('/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    const errors = validateLoginInput({ email, password });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: { message: 'Invalid login input', fields: errors } });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [normalizedEmail],
    );
    const user = result.rows[0];

    const invalidCredentials = () => res.status(401).json({ error: { message: 'Invalid email or password' } });

    if (!user) {
      return invalidCredentials();
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return invalidCredentials();
    }

    const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  }));

  router.get('/auth/me', requireAuth(config), asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    return res.status(200).json({ user });
  }));

  return router;
}

module.exports = { createAuthRouter, validateSignupInput, validateLoginInput };
