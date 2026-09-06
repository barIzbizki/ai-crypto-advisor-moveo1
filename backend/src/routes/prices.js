const { Router } = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { fetchPrices } = require('../services/coingecko');

const DEFAULT_COIN_IDS = ['bitcoin', 'ethereum'];

// The onboarding quiz saves assetsOfInterest as broad categories, not
// literal CoinGecko coin ids, so each category maps to a small
// representative set of coins.
const COIN_IDS_BY_ASSET_CATEGORY = {
  bitcoin: ['bitcoin'],
  ethereum: ['ethereum'],
  altcoins: ['solana', 'cardano', 'ripple'],
  stablecoins: ['tether', 'usd-coin'],
  defi: ['uniswap', 'aave'],
  nfts: ['axie-infinity', 'apecoin'],
};

const SYMBOL_BY_COIN_ID = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  cardano: 'ADA',
  ripple: 'XRP',
  tether: 'USDT',
  'usd-coin': 'USDC',
  uniswap: 'UNI',
  aave: 'AAVE',
  'axie-infinity': 'AXS',
  apecoin: 'APE',
};

async function getAssetsOfInterest(pool, userId) {
  const result = await pool.query(
    'SELECT settings FROM preferences WHERE user_id = $1',
    [userId],
  );
  return result.rows[0]?.settings?.assetsOfInterest || [];
}

function resolveCoinIds(assetsOfInterest) {
  const coinIds = new Set();
  for (const asset of assetsOfInterest) {
    for (const coinId of COIN_IDS_BY_ASSET_CATEGORY[asset] || []) {
      coinIds.add(coinId);
    }
  }
  return coinIds.size > 0 ? [...coinIds] : DEFAULT_COIN_IDS;
}

function createPricesRouter(pool, config) {
  const router = Router();

  router.get('/dashboard/prices', requireAuth(config), asyncHandler(async (req, res) => {
    const assetsOfInterest = await getAssetsOfInterest(pool, req.user.id);
    const coinIds = resolveCoinIds(assetsOfInterest);

    let entries;
    try {
      entries = await fetchPrices({ baseUrl: config.coinGeckoApiBaseUrl, coinIds });
    } catch (err) {
      console.error('CoinGecko fetch failed:', { name: err.name, message: err.message, cause: err.cause });
      const error = new Error('Coin prices are currently unavailable');
      error.status = 502;
      throw error;
    }

    const prices = entries.map(({ id, price }) => ({
      id,
      symbol: SYMBOL_BY_COIN_ID[id] || id.toUpperCase(),
      price,
    }));

    return res.status(200).json({ prices });
  }));

  return router;
}

module.exports = { createPricesRouter };
