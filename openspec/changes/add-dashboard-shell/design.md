## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` only calls `GET /health` and shows a status message; no route currently serves dashboard content.
- `backend/src/routes/preferences.js` exposes `GET /preferences` (protected by `requireAuth`), returning `{ assetsOfInterest, investorType, contentTypes }` or 404 if the user hasn't saved preferences yet (from the onboarding-preferences change). This change reads that same `preferences` table server-side rather than re-fetching it client-side.
- `backend/src/config/index.js` loads config from env vars with local/dev fallbacks, throwing only when a var is required in production; new external API keys/URLs follow the same pattern.
- `backend/src/routes/index.js` wires each feature router (`createAuthRouter`, `createPreferencesRouter`) via a shared `createXRouter(pool, config)` factory pattern.
- No outbound HTTP-to-third-party-API calls exist anywhere in the backend yet — this change introduces an LLM provider integration; the CryptoPanic integration for Market News (`add-market-news`, PM-14) and the CoinGecko integration for Coin Prices (`add-coin-prices`, PM-15) are owned by sibling changes, which this change composes rather than duplicates.

## Goals / Non-Goals

**Goals:**
- One backend endpoint per section (4 total), each independently callable, so the frontend can fetch/render/fail each section on its own.
- Reuse the existing `preferences` row (queried server-side, not via a second round-trip through the public `GET /preferences` route) to tailor Market News, Coin Prices, and AI Insight of the Day (Market News and Coin Prices do this within their own sibling changes); Fun Crypto Meme ignores preferences entirely.
- Graceful degradation: every external API call has a fallback (static content or explicit error state) so one flaky third party never breaks the whole dashboard.

**Non-Goals:**
- Caching/rate-limit management for the third-party APIs beyond what's needed to make the page usable — no scheduled background refresh jobs in this change.
- User-configurable section layout, reordering, or hide/show — the 4 sections are fixed, per PM-37.
- Historical price charts or in-depth news reading (e.g. full article view) — sections show summaries only.

## Decisions

- **One backend route per section (`GET /dashboard/news` from `add-market-news`, `GET /dashboard/prices` from `add-coin-prices`, plus `GET /dashboard/insight` and `GET /dashboard/meme` from this change), all behind `requireAuth`, rather than one combined `GET /dashboard` endpoint.** Matches the spec's "sections fail independently" requirement: separate requests let the frontend render each section as soon as its own data arrives and retry/fallback per-section without re-fetching the others. Alternative considered: a single aggregating endpoint that internally fans out and returns partial results — rejected because it still ties all sections to one HTTP request's timeout/failure behavior and is harder to test in isolation.
- **Each route reads the user's `preferences` row directly via `pool.query` (same table `preferences.js` already uses), not by calling `GET /preferences` internally.** Avoids an internal HTTP hop for data already reachable via the shared `pool`; mirrors how `preferences.js` itself queries by `req.user.id`.
- **Fallback behavior differs by section, matching what makes sense for that data:** AI Insight falls back to static/generic content (a missing LLM response is not user-facing-critical) — Market News' fallback and Coin Prices' explicit error state (instead of fabricating numbers) are defined in their respective sibling changes; Fun Crypto Meme has no external dependency at all in this change (ships as a small static/curated set) to avoid depending on a third API on day one — swapping in a live meme API is a future enhancement, not required by PM-37.
- **New third-party integrations are isolated behind small internal modules (e.g. `backend/src/services/llmInsight.js`), each owning its own fetch + fallback logic**, so the route handlers stay thin and each integration can be unit-tested by mocking its module. (`cryptopanic.js` lives in `add-market-news`; `coingecko.js` lives in `add-coin-prices`.)
- **New env vars follow the existing `loadConfig()` pattern**: `LLM_API_KEY`/`LLM_API_BASE_URL` (e.g. Hugging Face Inference API) — optional in development (missing key/url triggers that section's fallback path rather than throwing at startup), required only where the project's deployment config decides. (`CRYPTOPANIC_API_KEY`/`CRYPTOPANIC_API_BASE_URL` are defined in `add-market-news`; `COINGECKO_API_BASE_URL` is defined in `add-coin-prices`.)

## Risks / Trade-offs

- [A free-tier LLM provider has rate limits and no uptime SLA] → Acceptable for this change: the AI Insight section has a fallback path, and this is a shell/MVP dashboard, not a trading tool. (CoinGecko's and CryptoPanic's equivalent risks are tracked in `add-coin-prices` and `add-market-news`.)
- [No caching means every dashboard load re-hits the LLM provider] → Acceptable short-term trade-off; noted as a likely follow-up (add response caching per section) rather than blocking this change.
- [LLM-generated "insight" content is not reviewed/moderated before display] → Acceptable for an MVP "fun fact"-style insight using a general-purpose free model; a static fallback covers the case where the call fails, but does not filter unexpected model output. Flagged as an area to revisit if this becomes a more prominent feature.
- [Reading `preferences` directly via SQL in multiple new route files duplicates the query already in `preferences.js`] → Acceptable at this scale (a handful of near-identical `SELECT settings FROM preferences WHERE user_id = $1` calls); revisit by extracting a shared helper if a third consumer appears.

## Migration Plan

1. Add a backend service module for the external integration owned by this change (`llmInsight.js`), exporting a function that takes the user's relevant preference field(s) and returns section data or throws/returns a fallback marker. (`cryptopanic.js` is added by `add-market-news`; `coingecko.js` is added by `add-coin-prices`.)
2. Add `backend/src/routes/dashboard.js` exporting `createDashboardRouter(pool, config)` with the AI Insight and Fun Crypto Meme `GET /dashboard/*` endpoints, each behind `requireAuth(config)`, reading `preferences` and delegating to the matching service module where applicable.
3. Extend `loadConfig()` with the new optional env vars (`LLM_API_KEY`/`LLM_API_BASE_URL`), following the existing "fallback in dev, required only where needed" pattern.
4. Wire `createDashboardRouter(pool, config)` into `backend/src/routes/index.js` alongside the existing routers.
5. Replace `frontend/src/pages/DashboardPage.jsx`'s health-check body with 4 section components rendered in order — `MarketNewsSection` (`add-market-news`) and `CoinPricesSection` (`add-coin-prices`) mounted as-is, plus the AI Insight and Fun Crypto Meme components built here — each calling its own `GET /dashboard/*` endpoint via `apiFetch` and rendering its own loading/error/fallback state independently.
6. No database migration — reuses the existing `preferences` table read-only; no rollback complexity beyond reverting the route/UI additions.
