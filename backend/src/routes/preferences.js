const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');

function validatePreferencesInput({ assetsOfInterest, investorType, contentTypes }) {
  const errors = {};

  if (!Array.isArray(assetsOfInterest) || assetsOfInterest.length === 0) {
    errors.assetsOfInterest = 'At least one asset of interest is required';
  }

  if (typeof investorType !== 'string' || investorType.trim().length === 0) {
    errors.investorType = 'Investor type is required';
  }

  if (!Array.isArray(contentTypes) || contentTypes.length === 0) {
    errors.contentTypes = 'At least one content type is required';
  }

  return errors;
}

function toResponse(settings) {
  return {
    assetsOfInterest: settings.assetsOfInterest,
    investorType: settings.investorType,
    contentTypes: settings.contentTypes,
  };
}

function createPreferencesRouter(pool, config) {
  const router = Router();

  router.post('/preferences', requireAuth(config), asyncHandler(async (req, res) => {
    const { assetsOfInterest, investorType, contentTypes } = req.body || {};

    const errors = validatePreferencesInput({ assetsOfInterest, investorType, contentTypes });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: { message: 'Invalid preferences input', fields: errors } });
    }

    const settings = { assetsOfInterest, investorType: investorType.trim(), contentTypes };

    const result = await pool.query(
      `INSERT INTO preferences (user_id, settings)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings
       RETURNING settings`,
      [req.user.id, settings],
    );

    return res.status(200).json(toResponse(result.rows[0].settings));
  }));

  router.get('/preferences', requireAuth(config), asyncHandler(async (req, res) => {
    const result = await pool.query(
      'SELECT settings FROM preferences WHERE user_id = $1',
      [req.user.id],
    );
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ error: { message: 'No preferences saved for this user' } });
    }

    return res.status(200).json(toResponse(row.settings));
  }));

  return router;
}

module.exports = { createPreferencesRouter, validatePreferencesInput };
