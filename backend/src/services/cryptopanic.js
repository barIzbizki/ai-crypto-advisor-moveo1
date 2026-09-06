const REQUEST_TIMEOUT_MS = 5000;

function normalizePost(post) {
  return {
    title: post.title,
    url: post.url,
    source: post.source?.title || post.source?.domain || 'CryptoPanic',
    publishedAt: post.published_at,
  };
}

async function fetchHeadlines({ apiKey, baseUrl, assetsOfInterest }) {
  if (!apiKey || !baseUrl) {
    throw new Error('CryptoPanic API is not configured');
  }

  const url = new URL(`${baseUrl.replace(/\/$/, '')}/posts/`);
  url.searchParams.set('auth_token', apiKey);
  url.searchParams.set('public', 'true');
  if (Array.isArray(assetsOfInterest) && assetsOfInterest.length > 0) {
    url.searchParams.set('currencies', assetsOfInterest.join(','));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`CryptoPanic API request failed with status ${response.status}`);
    }

    const body = await response.json();
    return (body.results || []).map(normalizePost);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchHeadlines };
