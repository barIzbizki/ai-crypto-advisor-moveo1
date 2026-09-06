const REQUEST_TIMEOUT_MS = 15000;

const DIRECTNESS_SUFFIX = 'Respond with only that single sentence and nothing else — no reasoning, no preamble.';

const PROMPT_BY_INVESTOR_TYPE = {
  beginner: `Share one short, encouraging crypto insight for someone new to investing, in a single sentence. ${DIRECTNESS_SUFFIX}`,
  'long-term-holder': `Share one short crypto insight for a long-term holder focused on fundamentals, in a single sentence. ${DIRECTNESS_SUFFIX}`,
  'active-trader': `Share one short, punchy crypto insight for an active day trader, in a single sentence. ${DIRECTNESS_SUFFIX}`,
  institutional: `Share one short, measured crypto market insight for an institutional investor, in a single sentence. ${DIRECTNESS_SUFFIX}`,
};

const GENERIC_PROMPT = `Share one short, interesting crypto insight for a curious investor, in a single sentence. ${DIRECTNESS_SUFFIX}`;

function buildPrompt(investorType) {
  return PROMPT_BY_INVESTOR_TYPE[investorType] || GENERIC_PROMPT;
}

async function generateInsight({ apiKey, baseUrl, model, investorType }) {
  if (!apiKey || !baseUrl || !model) {
    throw new Error('Hugging Face Inference API is not configured');
  }

  const prompt = buildPrompt(investorType);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face Inference API request failed with status ${response.status}`);
    }

    const body = await response.json();
    const content = body.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Hugging Face Inference API returned no generated text');
    }

    return { text: content.trim() };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateInsight, buildPrompt };
