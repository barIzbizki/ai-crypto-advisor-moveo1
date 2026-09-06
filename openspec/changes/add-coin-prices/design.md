## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` calls `GET /health` and mounts `MarketNewsSection` (from `add-market-news`); no Coin Prices content exists yet.
- `backend/src/routes/preferences.js` exposes `GET /preferences` (behind `requireAuth`), returning `{ assetsOfInterest, investorType, contentTypes }` or 404 if the user hasn't saved preferences. `backend/src/routes/news.js` reads the same `preferences` table server-side (via `pool.query`, `SELECT settings FROM preferences WHERE user_id = $1`) rather than calling that route internally — this change follows the same pattern.
- `backend/src/config/index.js` loads config from env vars with local/dev fallbacks, throwing only when a var is required in production (`nodeEnv === 'production'`); new API keys/URLs follow that pattern.
- `backend/src/routes/index.js` wires each feature router via a `createXRouter(pool, config)` factory, mounted in `createRouter(pool, config)`.
- `backend/src/services/cryptopanic.js` is the existing pattern for a third-party API client: an async function with an `AbortController`-based timeout that returns normalized data or throws.
- The sibling change `add-dashboard-shell` (PM-13) is drafted but not implemented, and its spec/tasks currently duplicate this Coin Prices scope (CoinGecko integration, default coin set, explicit error state) as one of its 4 dashboard sections, plus a `COINGECKO_API_BASE_URL` config task. This change becomes the source of truth for Coin Prices; `add-dashboard-shell` is trimmed to reference it (see proposal.md - Impact), mirroring how `add-market-news` trimmed the same duplication for Market News.

## Goals / Non-Goals

**Goals:**
- One backend endpoint, `GET /dashboard/prices`, independently callable so the frontend can fetch/render/fail the Coin Prices section on its own, consistent with how `add-dashboard-shell` expects each section to behave.
- Reuse the existing `preferences` row (queried server-side) to filter by `assetsOfInterest`, falling back to a small fixed default coin set when none are saved.
- Never show stale or fabricated prices: any CoinGecko failure surfaces an explicit error/unavailable state instead of degrading silently.

**Non-Goals:**
- Caching or scheduled background refresh of prices — every request may call CoinGecko directly; revisit only if rate-limiting becomes an issue in practice.
- Historical price charts, percentage change, or multi-currency display — the section shows a fixed-size list of coin + current price (USD) only.
- Mounting the section into the dashboard page layout itself (section ordering, other sections) — that composition lives in `add-dashboard-shell`; this change ships the section component and its data source.

## Decisions

- **New route file `backend/src/routes/prices.js` exporting `createPricesRouter(pool, config)`, mounted in `routes/index.js` alongside the existing routers**, rather than folding it into a combined `dashboard.js` used by other sections. Keeps Coin Prices independently owned/testable and matches the "one section, one owner" boundary already established by `add-market-news`'s `news.js`.
- **A dedicated service module `backend/src/services/coingecko.js`** owns the CoinGecko fetch + response mapping and exports a function that returns prices or throws; the route handler catches any failure and responds with an explicit error status (rather than swallowing it into a fallback, as `news.js` does). Keeps the route handler thin and the integration mockable in tests.
- **Filtering by `assetsOfInterest` happens by passing the user's saved asset symbols as CoinGecko's `ids` query param on the `/simple/price` endpoint**; when the user has no saved preferences, the route uses a small fixed default coin set (e.g. `bitcoin`, `ethereum`) instead of skipping the call.
- **No fallback content for Coin Prices, unlike Market News's static fallback.** Prices are numeric financial-ish data that would be actively misleading if faked or stale; on any CoinGecko failure the route responds with an explicit error status and the frontend renders a terminal error state for that section.
- **New env var follows the existing `loadConfig()` pattern**: `COINGECKO_API_BASE_URL` (defaulting to CoinGecko's public free-tier base URL, which needs no API key), always available since it has a working default — no production-only requirement.
- **Frontend: a single `CoinPricesSection` component under `frontend/src/components/dashboard/`**, fetching `GET /dashboard/prices` via the existing `apiFetch` helper, with its own `loading` / `ready` / `error` state — mirrors `MarketNewsSection`'s shape so `add-dashboard-shell` can mount it without extra glue, but its error state is terminal (no fallback content) rather than a hidden-away success case.

## Risks / Trade-offs

- [CoinGecko's free tier has rate limits and no uptime SLA] → Acceptable: the explicit error state means a rate-limited or down API surfaces clearly to the user instead of showing wrong numbers.
- [No caching means every dashboard load re-hits CoinGecko, increasing the chance of hitting rate limits under real usage] → Acceptable short-term trade-off for an MVP section; noted as a likely follow-up (response caching) rather than blocking this change.
- [No fallback content means the section can show an error state fairly often under CoinGecko's free-tier rate limits] → Accepted trade-off: showing an honest error beats showing a fabricated or stale price for financial data.

## Migration Plan

1. Add `backend/src/services/coingecko.js` (CoinGecko client).
2. Add `backend/src/routes/prices.js` exporting `createPricesRouter(pool, config)` with `GET /dashboard/prices` behind `requireAuth(config)`, reading `preferences.settings.assetsOfInterest` (or the default coin set) and delegating to the service module, responding with an explicit error status on failure.
3. Extend `loadConfig()` with `COINGECKO_API_BASE_URL` (optional, defaulting to CoinGecko's public base URL).
4. Wire `createPricesRouter(pool, config)` into `backend/src/routes/index.js`.
5. Add `frontend/src/components/dashboard/CoinPricesSection.jsx` fetching `GET /dashboard/prices` via `apiFetch`, with independent loading/error rendering.
6. Coordinate with `add-dashboard-shell`: trim its duplicated Coin Prices requirement/tasks so it mounts `CoinPricesSection` instead of re-implementing the integration.
7. No database migration — reuses the existing `preferences` table read-only; rollback is reverting the route/service/component additions.
