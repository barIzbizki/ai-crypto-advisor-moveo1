const REQUEST_TIMEOUT_MS = 5000;

async function fetchPrices({ baseUrl, coinIds, apiKey }) {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/simple/price`);
  url.searchParams.set('ids', coinIds.join(','));
  url.searchParams.set('vs_currencies', 'usd');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};

  try {
    const response = await fetch(url, { signal: controller.signal, headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API request failed with status ${response.status}`);
    }

    const body = await response.json();
    return coinIds
      .filter((id) => body[id] && typeof body[id].usd === 'number')
      .map((id) => ({ id, price: body[id].usd }));
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchPrices };
