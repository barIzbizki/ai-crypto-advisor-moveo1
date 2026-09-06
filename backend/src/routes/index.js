const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { createAuthRouter } = require('./auth');
const { createPreferencesRouter } = require('./preferences');
const { createNewsRouter } = require('./news');
const { createPricesRouter } = require('./prices');
const { createInsightRouter } = require('./insight');
const { createMemeRouter } = require('./meme');

function createRouter(pool, config) {
  const router = Router();

  router.get('/health', asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  }));

  router.use(createAuthRouter(pool, config));
  router.use(createPreferencesRouter(pool, config));
  router.use(createNewsRouter(pool, config));
  router.use(createPricesRouter(pool, config));
  router.use(createInsightRouter(pool, config));
  router.use(createMemeRouter(pool, config));

  return router;
}

module.exports = { createRouter };
