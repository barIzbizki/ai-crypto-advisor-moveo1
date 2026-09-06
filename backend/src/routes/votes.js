const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

const VALID_VALUES = new Set([1, -1]);

function validateVoteInput({ target, value }) {
  const errors = {};

  if (typeof target !== 'string' || target.trim().length === 0) {
    errors.target = 'A non-empty target is required';
  }

  if (typeof value !== 'number' || !VALID_VALUES.has(value)) {
    errors.value = 'Value must be 1 (up) or -1 (down)';
  }

  return errors;
}

function parseTargets(targets) {
  if (typeof targets !== 'string' || targets.trim().length === 0) {
    return [];
  }
  return targets.split(',').map((target) => target.trim()).filter(Boolean);
}

function createVotesRouter(pool, config) {
  const router = Router();

  router.post('/votes', requireAuth(config), asyncHandler(async (req, res) => {
    const { target, value } = req.body || {};

    const errors = validateVoteInput({ target, value });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: { message: 'Invalid vote input', fields: errors } });
    }

    const upsertResult = await pool.query(
      `INSERT INTO votes (user_id, target, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target)
       DO UPDATE SET value = EXCLUDED.value
       WHERE votes.value <> EXCLUDED.value
       RETURNING value`,
      [req.user.id, target, value],
    );

    if (upsertResult.rows.length > 0) {
      return res.status(200).json({ value: upsertResult.rows[0].value });
    }

    await pool.query(
      'DELETE FROM votes WHERE user_id = $1 AND target = $2 AND value = $3',
      [req.user.id, target, value],
    );

    return res.status(200).json({ value: null });
  }));

  router.get('/votes', requireAuth(config), asyncHandler(async (req, res) => {
    const targets = parseTargets(req.query.targets);

    if (targets.length === 0) {
      return res.status(200).json({ votes: {} });
    }

    const result = await pool.query(
      'SELECT target, value FROM votes WHERE user_id = $1 AND target = ANY($2::text[])',
      [req.user.id, targets],
    );

    const votes = {};
    for (const row of result.rows) {
      votes[row.target] = row.value;
    }

    return res.status(200).json({ votes });
  }));

  return router;
}

module.exports = { createVotesRouter, validateVoteInput };
