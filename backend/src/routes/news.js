const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { fetchHeadlines } = require('../services/cryptopanic');
const fallbackHeadlines = require('../services/newsFallback.json');

async function getAssetsOfInterest(pool, userId) {
  const result = await pool.query(
    'SELECT settings FROM preferences WHERE user_id = $1',
    [userId],
  );
  return result.rows[0]?.settings?.assetsOfInterest || [];
}

function createNewsRouter(pool, config) {
  const router = Router();

  router.get('/dashboard/news', requireAuth(config), asyncHandler(async (req, res) => {
    const assetsOfInterest = await getAssetsOfInterest(pool, req.user.id);

    let headlines;
    try {
      headlines = await fetchHeadlines({
        apiKey: config.cryptoPanicApiKey,
        baseUrl: config.cryptoPanicApiBaseUrl,
        assetsOfInterest,
      });
    } catch (err) {
      headlines = fallbackHeadlines;
    }

    return res.status(200).json({ headlines });
  }));

  return router;
}

module.exports = { createNewsRouter };
