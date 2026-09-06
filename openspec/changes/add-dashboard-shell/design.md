## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` only calls `GET /health` and shows a status message; no route currently serves dashboard content.
- `backend/src/routes/preferences.js` exposes `GET /preferences` (protected by `requireAuth`), returning `{ assetsOfInterest, investorType, contentTypes }` or 404 if the user hasn't saved preferences yet (from the onboarding-preferences change). This change reads that same `preferences` table server-side rather than re-fetching it client-side.
- `backend/src/config/index.js` loads config from env vars with local/dev fallbacks, throwing only when a var is required in production; new external API keys/URLs follow the same pattern.
- `backend/src/routes/index.js` wires each feature router (`createAuthRouter`, `createPreferencesRouter`) via a shared `createXRouter(pool, config)` factory pattern.
- No outbound HTTP-to-third-party-API calls are made by this change directly — the CryptoPanic integration for Market News (`add-market-news`, PM-14), the CoinGecko integration for Coin Prices (`add-coin-prices`, PM-15), and the Hugging Face Inference API integration for AI Insight of the Day (`add-ai-insight`, PM-16) are all owned by sibling changes, which this change composes rather than duplicates. The Fun Crypto Meme section has no third-party dependency at all — its static curated list and `GET /dashboard/meme` endpoint are owned by the sibling change `add-crypto-meme` (PM-17), composed here the same way.

## Goals / Non-Goals

**Goals:**
- One backend endpoint per section (4 total), each independently callable, so the frontend can fetch/render/fail each section on its own.
- Reuse the existing `preferences` row (queried server-side, not via a second round-trip through the public `GET /preferences` route) to tailor Market News, Coin Prices, and AI Insight of the Day (each does this within its own sibling change); Fun Crypto Meme (`add-crypto-meme`) ignores preferences entirely.
- Graceful degradation: every external API call has a fallback (static content or explicit error state) so one flaky third party never breaks the whole dashboard.

**Non-Goals:**
- Caching/rate-limit management for the third-party APIs beyond what's needed to make the page usable — no scheduled background refresh jobs in this change.
- User-configurable section layout, reordering, or hide/show — the 4 sections are fixed, per PM-37.
- Historical price charts or in-depth news reading (e.g. full article view) — sections show summaries only.

## Decisions

- **One backend route per section (`GET /dashboard/news` from `add-market-news`, `GET /dashboard/prices` from `add-coin-prices`, `GET /dashboard/insight` from `add-ai-insight`, `GET /dashboard/meme` from `add-crypto-meme`), all behind `requireAuth`, rather than one combined `GET /dashboard` endpoint.** Matches the spec's "sections fail independently" requirement: separate requests let the frontend render each section as soon as its own data arrives and retry/fallback per-section without re-fetching the others. Alternative considered: a single aggregating endpoint that internally fans out and returns partial results — rejected because it still ties all sections to one HTTP request's timeout/failure behavior and is harder to test in isolation.
- **Each route reads the user's `preferences` row directly via `pool.query` (same table `preferences.js` already uses), not by calling `GET /preferences` internally.** Avoids an internal HTTP hop for data already reachable via the shared `pool`; mirrors how `preferences.js` itself queries by `req.user.id`.
- **Fallback behavior differs by section, matching what makes sense for that data:** Market News' fallback, Coin Prices' explicit error state (instead of fabricating numbers), AI Insight's static/generic fallback (a missing LLM response is not user-facing-critical), and Fun Crypto Meme's static curated list (no external dependency to fall back from in the first place) are all defined in their respective sibling changes.
- **New third-party integrations are isolated behind small internal modules, each owning its own fetch + fallback logic**, so the route handlers stay thin and each integration can be unit-tested by mocking its module. (`cryptopanic.js` lives in `add-market-news`; `coingecko.js` lives in `add-coin-prices`; `llmInsight.js` lives in `add-ai-insight`.) Fun Crypto Meme (`add-crypto-meme`) introduces no third-party integration at all — just a static curated list and a random-pick helper. This change introduces no new third-party integration of its own.
- **New env vars follow the existing `loadConfig()` pattern.** (`CRYPTOPANIC_API_KEY`/`CRYPTOPANIC_API_BASE_URL` are defined in `add-market-news`; `COINGECKO_API_BASE_URL` is defined in `add-coin-prices`; `LLM_API_KEY`/`LLM_API_BASE_URL` are defined in `add-ai-insight`.) `add-crypto-meme` adds no new env vars. This change adds no new env vars of its own.

## Risks / Trade-offs

- [Reading `preferences` directly via SQL in multiple new route files duplicates the query already in `preferences.js`] → Acceptable at this scale (a handful of near-identical `SELECT settings FROM preferences WHERE user_id = $1` calls); revisit by extracting a shared helper if a third consumer appears.
- [Fun Crypto Meme's curated set is static and can go stale] → Acceptable for an MVP "fun" section with no correctness requirement; owned by `add-crypto-meme`, which can revisit rotation/live sourcing independently of this change.

## Migration Plan

1. No new backend route module is added by this change — each section's `GET /dashboard/*` endpoint is added by its owning sibling change (`add-market-news`, `add-coin-prices`, `add-ai-insight`, `add-crypto-meme`).
2. Replace `frontend/src/pages/DashboardPage.jsx`'s health-check body with 4 section components rendered in order — `MarketNewsSection` (`add-market-news`), `CoinPricesSection` (`add-coin-prices`), `AiInsightSection` (`add-ai-insight`), and `CryptoMemeSection` (`add-crypto-meme`) — each mounted as-is, calling its own `GET /dashboard/*` endpoint via `apiFetch` and rendering its own loading/error/fallback state independently.
3. No database migration — reuses the existing `preferences` table read-only where applicable; no rollback complexity beyond reverting the UI additions.
