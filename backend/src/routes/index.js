const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { createAuthRouter } = require('./auth');

function createRouter(pool, config) {
  const router = Router();

  router.get('/health', asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  }));

  router.use(createAuthRouter(pool, config));

  return router;
}

module.exports = { createRouter };
