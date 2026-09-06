## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` currently mounts `MarketNewsSection` and `CoinPricesSection` (from `add-market-news`/`add-coin-prices`) alongside the original `GET /health` check; no AI Insight content exists yet.
- `backend/src/routes/preferences.js` exposes `GET /preferences` (behind `requireAuth`), returning `{ assetsOfInterest, investorType, contentTypes }` or 404 if the user hasn't saved preferences. This change reads the same `preferences` table server-side (via `pool.query`), not by calling that route internally — same pattern as `news.js`/`prices.js`.
- `backend/src/config/index.js` loads config from env vars with local/dev fallbacks, throwing only when a var is required in production (`nodeEnv === 'production'`); it already has `cryptoPanicApiKey`/`cryptoPanicApiBaseUrl` (optional) and `coinGeckoApiBaseUrl` (optional, no key needed) following this pattern. New LLM vars follow it too.
- `backend/src/routes/index.js` wires each feature router via a `createXRouter(pool, config)` factory, mounted in `createRouter(pool, config)`; currently wires `createAuthRouter`, `createPreferencesRouter`, `createNewsRouter`, `createPricesRouter`.
- The sibling change `add-dashboard-shell` (PM-13) is drafted but not implemented, and its spec/tasks/design/proposal currently duplicate this AI Insight scope (Hugging Face integration, static fallback, generic-insight-when-no-preferences scenario, `LLM_API_KEY`/`LLM_API_BASE_URL` config) as one of its 4 dashboard sections — the same shape `add-market-news` and `add-coin-prices` already resolved for their own sections. This change becomes the source of truth for AI Insight; `add-dashboard-shell` is trimmed to reference it (see proposal.md - Impact).

## Goals / Non-Goals

**Goals:**
- One backend endpoint, `GET /dashboard/insight`, independently callable so the frontend can fetch/render/fail the AI Insight section on its own, consistent with `add-market-news`/`add-coin-prices`.
- Reuse the existing `preferences` row (queried server-side) to tailor the insight prompt by `investorType`.
- Graceful degradation: any Hugging Face failure, rate-limit, or missing config falls back to static content rather than surfacing an error — matching the behavior already specified (but not yet implemented) in `add-dashboard-shell`'s spec.

**Non-Goals:**
- Caching or scheduled background refresh of insights — every request may call the Hugging Face Inference API directly (or its fallback); revisit only if rate-limiting becomes an issue in practice.
- Content moderation/review of model output beyond using a general-purpose free model and a static fallback for failure cases — out of scope for this MVP "fun fact"-style section.
- Mounting the section into the dashboard page layout itself (section ordering, other sections) — that composition lives in `add-dashboard-shell`; this change ships the section component and its data source.

## Decisions

- **New route file `backend/src/routes/insight.js` exporting `createInsightRouter(pool, config)`, mounted in `routes/index.js` alongside the existing routers**, rather than folding it into a combined `dashboard.js`. Keeps AI Insight independently owned/testable, matching the "one section, one owner" boundary `add-market-news`/`add-coin-prices` already established.
- **A dedicated service module `backend/src/services/llmInsight.js`** owns the Hugging Face Inference API call + prompt construction and exports a function that returns generated text or throws; the route handler catches any failure and serves the static fallback. Keeps the route handler thin and the integration mockable in tests.
- **The static fallback is a small hardcoded insight (or short list) co-located with the service** (e.g. an inline constant or `backend/src/services/insightFallback.json`), not a database table — fixed, curated content that changes rarely and needs no admin UI. Same shape as Market News's fallback.
- **Tailoring by `investorType` happens by including it in the prompt sent to the Hugging Face model**; when the user has no saved preferences, the route uses a generic prompt instead of skipping the call, per the "no saved preferences" scenario already specified in `add-dashboard-shell`.
- **New env vars follow the existing `loadConfig()` pattern**: `LLM_API_KEY` and `LLM_API_BASE_URL` (defaulting to the Hugging Face Inference API's public base URL), both optional — a missing key/url routes straight to the fallback rather than throwing at startup, in dev and production alike. These are the same names `add-dashboard-shell`'s (unimplemented) config task already anticipated; this change actually adds them, and `add-dashboard-shell`'s task is removed as now-redundant.
- **Frontend: a single `AiInsightSection` component under `frontend/src/components/dashboard/`**, fetching `GET /dashboard/insight` via the existing `apiFetch` helper, with its own `loading` / `data` / `error` state — mirrors `MarketNewsSection`/`CoinPricesSection` so `add-dashboard-shell` can mount it without extra glue.

## Risks / Trade-offs

- [Hugging Face's free Inference API tier has rate limits, cold-start latency, and no uptime SLA] → Acceptable: the static fallback means a rate-limited, slow, or down API degrades to fixed content instead of breaking the section.
- [No caching means every dashboard load re-hits the Hugging Face API, increasing the chance of hitting rate limits under real usage] → Acceptable short-term trade-off for an MVP section; noted as a likely follow-up (response caching) rather than blocking this change.
- [LLM-generated insight content is not reviewed/moderated before display] → Acceptable for an MVP "fun fact"-style insight using a general-purpose free model; the static fallback covers call failures but does not filter unexpected model output. Flagged as an area to revisit if this becomes a more prominent feature.

## Migration Plan

1. Add `backend/src/services/llmInsight.js` (Hugging Face Inference API client + prompt-by-investor-type) and the static fallback insight content.
2. Add `backend/src/routes/insight.js` exporting `createInsightRouter(pool, config)` with `GET /dashboard/insight` behind `requireAuth(config)`, reading `preferences.settings.investorType` and delegating to the service module, falling back on any failure.
3. Extend `loadConfig()` with `LLM_API_KEY` and `LLM_API_BASE_URL` (optional, following the existing fallback pattern).
4. Wire `createInsightRouter(pool, config)` into `backend/src/routes/index.js`.
5. Add `frontend/src/components/dashboard/AiInsightSection.jsx` fetching `GET /dashboard/insight` via `apiFetch`, with independent loading/error rendering.
6. Coordinate with `add-dashboard-shell`: trim its duplicated AI Insight requirement/tasks/config so it mounts `AiInsightSection` instead of re-implementing the integration.
7. No database migration — reuses the existing `preferences` table read-only; rollback is reverting the route/service/component additions.
