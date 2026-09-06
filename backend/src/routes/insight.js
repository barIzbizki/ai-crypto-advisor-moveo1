const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { generateInsight } = require('../services/llmInsight');
const fallbackInsight = require('../services/insightFallback.json');

async function getInvestorType(pool, userId) {
  const result = await pool.query(
    'SELECT settings FROM preferences WHERE user_id = $1',
    [userId],
  );
  return result.rows[0]?.settings?.investorType;
}

function createInsightRouter(pool, config) {
  const router = Router();

  router.get('/dashboard/insight', requireAuth(config), asyncHandler(async (req, res) => {
    const investorType = await getInvestorType(pool, req.user.id);

    let insight;
    try {
      insight = await generateInsight({
        apiKey: config.llmApiKey,
        baseUrl: config.llmApiBaseUrl,
        model: config.llmModel,
        investorType,
      });
    } catch (err) {
      console.error('AI Insight generation failed, serving fallback:', err.message);
      insight = fallbackInsight;
    }

    return res.status(200).json({ insight });
  }));

  return router;
}

module.exports = { createInsightRouter };
