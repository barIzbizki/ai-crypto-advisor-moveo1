## 1. Config (PM-40)

- [x] 1.1 Extend `backend/src/config/index.js` with an optional env var `COINGECKO_API_BASE_URL` (default to CoinGecko's public free-tier API base URL, e.g. `https://api.coingecko.com/api/v3`) — no API key required, so no production-only requirement

## 2. Backend: CoinGecko integration (PM-40)

- [x] 2.1 Add `backend/src/services/coingecko.js` fetching current prices from the CoinGecko `/simple/price` endpoint, accepting a list of coin ids and a target currency (USD), exporting a function that returns normalized `{ id, symbol, price }` entries or throws on failure
- [x] 2.2 Add a small default coin id list (e.g. `bitcoin`, `ethereum`), used when the authenticated user has no saved `assetsOfInterest`
- [x] 2.3 Add `backend/src/routes/prices.js` exporting `createPricesRouter(pool, config)` with `GET /dashboard/prices` behind `requireAuth(config)`: read the user's `preferences.settings.assetsOfInterest` (via `pool.query`, same table as `preferences.js`/`news.js`), call the CoinGecko service with those assets (or the default coin list), respond 200 with prices; on any failure from the CoinGecko service, respond with an explicit error status (no fallback content)
- [x] 2.4 Wire `createPricesRouter(pool, config)` into `backend/src/routes/index.js`
- [x] 2.5 Add backend tests (`backend/test/prices.test.js`): prices filtered by saved assets, default coin set used when no preferences saved, explicit error status returned when the CoinGecko call fails, 401 when unauthenticated

## 3. Frontend: Coin Prices section UI (PM-41)

- [x] 3.1 Add `frontend/src/components/dashboard/CoinPricesSection.jsx` rendering a simple list/table of coin + current price, fetching `GET /dashboard/prices` via `apiFetch`
- [x] 3.2 Implement independent loading and error states within the component (error is a terminal "prices unavailable" state, not a silent fallback) so a slow or failed fetch never blocks anything mounting it
- [x] 3.3 Mount `CoinPricesSection` on `frontend/src/pages/DashboardPage.jsx` alongside `MarketNewsSection` (temporary standalone placement is fine; final section ordering among all dashboard sections is owned by `add-dashboard-shell`)

## 4. Reconcile sibling change add-dashboard-shell (PM-13)

- [x] 4.1 Trim the "Coin Prices section filtered by assets of interest" requirement out of `openspec/changes/add-dashboard-shell/specs/dashboard-shell/spec.md`, replacing it with a requirement that the dashboard composes the `coin-prices` capability's section in the Coin Prices slot
- [x] 4.2 Remove the now-duplicated Coin Prices backend/service tasks (and the `COINGECKO_API_BASE_URL` config entry) from `openspec/changes/add-dashboard-shell/tasks.md`, replacing them with a task to mount `CoinPricesSection` from this change
- [x] 4.3 Update `openspec/changes/add-dashboard-shell/design.md` and `proposal.md` references to Coin Prices to point at this change instead of re-describing the CoinGecko integration
- [x] 4.4 Run `openspec validate add-dashboard-shell --strict` after editing, to confirm it still validates

## 5. Verification

- [x] 5.1 Manually verify the Coin Prices section renders real prices for a user with saved `assetsOfInterest` — verified end-to-end in a browser (Playwright) against the running dev servers and real CoinGecko API: signed up, saved preferences with `assetsOfInterest: ["bitcoin", "ethereum"]`, dashboard rendered live BTC/ETH prices with no console errors; also verified via curl that saving `["altcoins", "defi"]` returns prices for the mapped coin set (SOL, ADA, XRP, UNI, AAVE)
- [x] 5.2 Manually verify the default coin set renders for a user with no saved preferences — verified via curl: signup with no preferences saved, `GET /dashboard/prices` returned live BTC/ETH prices (the default coin set)
- [x] 5.3 Manually simulate a CoinGecko failure (e.g. invalid base URL) and confirm the section shows an explicit error/unavailable state, not stale or fabricated prices — verified via curl against a running backend with `COINGECKO_API_BASE_URL` pointed at an unreachable host: `GET /dashboard/prices` returned 502 with no price data; also covered by the automated test in 2.5
- [x] 5.4 Manually verify `GET /dashboard/prices` rejects requests without a valid token — verified via curl, returns 401
- [x] 5.5 Run `openspec validate add-coin-prices --strict` and fix any reported issues
