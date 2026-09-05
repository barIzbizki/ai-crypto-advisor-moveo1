const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');

function createRouter(pool) {
  const router = Router();

  router.get('/health', asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  }));

  return router;
}

module.exports = { createRouter };
