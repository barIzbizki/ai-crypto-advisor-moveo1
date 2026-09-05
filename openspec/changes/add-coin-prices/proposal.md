## Why

The dashboard needs a real Coin Prices section instead of a placeholder. This change implements Jira story [PM-15] "Coin Prices section", covering its subtasks [PM-40] (backend integration with the CoinGecko API, filtered by the user's selected assets) and [PM-41] (Coin Prices UI as a simple price list/table).

## What Changes

- Add a backend `GET /dashboard/prices` endpoint (behind `requireAuth`) that fetches current coin prices from the CoinGecko API, filtered by the authenticated user's saved `assetsOfInterest` where available, defaulting to a small fixed coin set (e.g. bitcoin, ethereum) when no preferences are saved.
- Surface an explicit error/unavailable state when the CoinGecko call fails, rather than showing stale or fabricated prices — unlike Market News's static fallback, price data must never be faked.
- Add a Coin Prices frontend section component rendering a simple list/table of coin + current price, with independent loading and error states, mounted on the dashboard page.
- Narrow the sibling `add-dashboard-shell` change (PM-13, not yet implemented) so its dashboard page composes this `coin-prices` capability for the Coin Prices section instead of duplicating the requirement — see Impact.

## Capabilities

### New Capabilities
- `coin-prices`: Fetches and renders current coin prices for the dashboard's Coin Prices section, filtered by the user's saved `assetsOfInterest` (or a default coin set), backed by the CoinGecko API with an explicit error state on failure. Covers PM-15, PM-40, and PM-41 in one spec.

### Modified Capabilities
<!-- none: no capability has been archived to openspec/specs/ yet in this repo -->

## Impact

- **Backend**: add `backend/src/services/coingecko.js` (CoinGecko client), add `backend/src/routes/prices.js` exposing `GET /dashboard/prices` behind `requireAuth`, reading the user's `preferences` row for `assetsOfInterest`; wire into `backend/src/routes/index.js`. Adds a new env var (`COINGECKO_API_BASE_URL`) via the existing `loadConfig()` pattern.
- **Frontend**: add a `CoinPricesSection` component under `frontend/src/components/dashboard/`, fetching `GET /dashboard/prices` via `apiFetch`, mounted from `frontend/src/pages/DashboardPage.jsx`.
- **Sibling change `add-dashboard-shell` (PM-13, drafted but not yet implemented)**: its `specs/dashboard-shell/spec.md` currently duplicates the full Coin Prices requirement (CoinGecko integration + default coin set + explicit error state) and its `tasks.md` duplicates the PM-40-equivalent backend tasks and the `COINGECKO_API_BASE_URL` config entry. This change trims that requirement down to "dashboard-shell composes the `coin-prices` capability for its Coin Prices section" and removes the now-redundant backend tasks/config entry from `add-dashboard-shell/tasks.md`, so the two changes don't implement the same CoinGecko integration twice.
- **No breaking changes** — the Coin Prices section does not exist yet in the running app.
