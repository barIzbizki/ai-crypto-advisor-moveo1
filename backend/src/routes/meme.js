const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { pickRandomMeme } = require('../services/memePicker');

function createMemeRouter(pool, config) {
  const router = Router();

  router.get('/dashboard/meme', requireAuth(config), asyncHandler(async (req, res) => {
    return res.status(200).json(pickRandomMeme());
  }));

  return router;
}

module.exports = { createMemeRouter };
