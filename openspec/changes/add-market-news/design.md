## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` only calls `GET /health`; no dashboard content or section components exist yet.
- `backend/src/routes/preferences.js` exposes `GET /preferences` (behind `requireAuth`), returning `{ assetsOfInterest, investorType, contentTypes }` or 404 if the user hasn't saved preferences. This change reads the same `preferences` table server-side (via `pool.query`), not by calling that route internally.
- `backend/src/config/index.js` loads config from env vars with local/dev fallbacks, throwing only when a var is required in production (`nodeEnv === 'production'`); new API keys/URLs follow that pattern.
- `backend/src/routes/index.js` wires each feature router via a `createXRouter(pool, config)` factory, mounted in `createRouter(pool, config)`.
- No outbound HTTP-to-third-party-API call exists anywhere in the backend yet — this is the first one.
- The sibling change `add-dashboard-shell` (PM-13) is drafted but not implemented, and its spec/tasks currently duplicate this Market News scope (CryptoPanic + fallback, section rendering) as one of its 4 dashboard sections. This change becomes the source of truth for Market News; `add-dashboard-shell` is trimmed to reference it (see proposal.md - Impact).

## Goals / Non-Goals

**Goals:**
- One backend endpoint, `GET /dashboard/news`, independently callable so the frontend can fetch/render/fail the Market News section on its own, consistent with how `add-dashboard-shell` expects each section to behave.
- Reuse the existing `preferences` row (queried server-side) to filter by `assetsOfInterest`.
- Graceful degradation: any CryptoPanic failure, rate-limit, or missing config falls back to static content rather than surfacing an error.

**Non-Goals:**
- Caching or scheduled background refresh of headlines — every request may call CryptoPanic directly (or its fallback); revisit only if rate-limiting becomes an issue in practice.
- Full article reading, pagination, or headline search — the section shows a fixed-size list of headline+link items only.
- Mounting the section into the dashboard page layout itself (section ordering, other sections) — that composition lives in `add-dashboard-shell`; this change ships the section component and its data source.

## Decisions

- **New route file `backend/src/routes/news.js` exporting `createNewsRouter(pool, config)`, mounted in `routes/index.js` alongside the existing routers**, rather than folding it into a combined `dashboard.js` used by other sections. Keeps Market News independently owned/testable and matches the "one section, one owner" boundary implied by `add-dashboard-shell`'s per-section endpoint design, without this change needing to know about the other 3 sections.
- **A dedicated service module `backend/src/services/cryptopanic.js`** owns the CryptoPanic fetch + response mapping and exports a function that returns headlines or throws; the route handler catches any failure and serves the static fallback. Keeps the route handler thin and makes the integration mockable in tests.
- **The static fallback is a small hardcoded JSON array co-located with the service** (e.g. `backend/src/services/newsFallback.json` or an inline constant), not a database table — it's fixed, curated content that changes rarely and needs no admin UI.
- **Filtering by `assetsOfInterest` happens by passing the user's saved asset symbols as CryptoPanic's `currencies` query param**; when the user has no saved preferences, the route omits that filter and requests general headlines instead of skipping the call.
- **New env vars follow the existing `loadConfig()` pattern**: `CRYPTOPANIC_API_KEY` and `CRYPTOPANIC_API_BASE_URL` (defaulting to CryptoPanic's public API base), both optional — a missing key/url routes straight to the fallback rather than throwing at startup, in dev and production alike (no user-facing feature should hard-fail on a missing third-party key).
- **Frontend: a single `MarketNewsSection` component under `frontend/src/components/dashboard/`**, fetching `GET /dashboard/news` via the existing `apiFetch` helper, with its own `loading` / `data` / `error` state — mirrors the pattern other dashboard sections will use, so `add-dashboard-shell` can mount it without extra glue.

## Risks / Trade-offs

- [CryptoPanic's free tier has rate limits and no uptime SLA] → Acceptable: the static fallback means a rate-limited or down API degrades to fixed content instead of breaking the section.
- [No caching means every dashboard load re-hits CryptoPanic, increasing the chance of hitting rate limits under real usage] → Acceptable short-term trade-off for an MVP section; noted as a likely follow-up (response caching) rather than blocking this change.
- [Static fallback content can go stale since it's hardcoded] → Acceptable: it's a safety net for outages/misconfiguration, not the primary experience; revisit if fallback is hit often in practice.

## Migration Plan

1. Add `backend/src/services/cryptopanic.js` (CryptoPanic client) and the static fallback headline list.
2. Add `backend/src/routes/news.js` exporting `createNewsRouter(pool, config)` with `GET /dashboard/news` behind `requireAuth(config)`, reading `preferences.settings.assetsOfInterest` and delegating to the service module, falling back on any failure.
3. Extend `loadConfig()` with `CRYPTOPANIC_API_KEY` and `CRYPTOPANIC_API_BASE_URL` (optional, following the existing fallback pattern).
4. Wire `createNewsRouter(pool, config)` into `backend/src/routes/index.js`.
5. Add `frontend/src/components/dashboard/MarketNewsSection.jsx` fetching `GET /dashboard/news` via `apiFetch`, with independent loading/fallback rendering.
6. Coordinate with `add-dashboard-shell`: trim its duplicated Market News requirement/tasks so it mounts `MarketNewsSection` instead of re-implementing the integration.
7. No database migration — reuses the existing `preferences` table read-only; rollback is reverting the route/service/component additions.
