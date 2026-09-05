## 1. Config (PM-38)

- [x] 1.1 Extend `backend/src/config/index.js` with optional env vars `CRYPTOPANIC_API_KEY` and `CRYPTOPANIC_API_BASE_URL` (default to CryptoPanic's public API base URL) — neither required in dev/test, missing values route straight to the fallback

## 2. Backend: CryptoPanic integration + fallback (PM-38)

- [x] 2.1 Add `backend/src/services/cryptopanic.js` fetching headlines from the CryptoPanic API, accepting an optional list of asset symbols to filter by (`currencies` param), exporting a function that returns normalized `{ title, url, source, publishedAt }` headlines or throws on failure
- [x] 2.2 Add a static fallback headline list (e.g. `backend/src/services/newsFallback.json`), used when the CryptoPanic call fails, times out, is rate-limited, or `CRYPTOPANIC_API_KEY`/`CRYPTOPANIC_API_BASE_URL` is unset
- [x] 2.3 Add `backend/src/routes/news.js` exporting `createNewsRouter(pool, config)` with `GET /dashboard/news` behind `requireAuth(config)`: read the user's `preferences.settings.assetsOfInterest` (via `pool.query`, same table as `preferences.js`), call the CryptoPanic service with those assets (or none, for general headlines), fall back to the static list on any failure, respond 200 with headlines
- [x] 2.4 Wire `createNewsRouter(pool, config)` into `backend/src/routes/index.js`
- [x] 2.5 Add backend tests (`backend/test/news.test.js`): headlines filtered by saved assets, general headlines when no preferences saved, fallback list returned when the CryptoPanic call fails/is misconfigured, 401 when unauthenticated

## 3. Frontend: Market News section UI (PM-39)

- [x] 3.1 Add `frontend/src/components/dashboard/MarketNewsSection.jsx` rendering a list of headlines (title + link to source), fetching `GET /dashboard/news` via `apiFetch`
- [x] 3.2 Implement independent loading, error/fallback, and empty states within the component so a slow or failed fetch never blocks anything mounting it
- [x] 3.3 Mount `MarketNewsSection` on `frontend/src/pages/DashboardPage.jsx` (temporary standalone placement is fine; final section ordering among all dashboard sections is owned by `add-dashboard-shell`)

## 4. Reconcile sibling change add-dashboard-shell (PM-13)

- [x] 4.1 Trim the "Market News section filtered by assets of interest" requirement out of `openspec/changes/add-dashboard-shell/specs/dashboard-shell/spec.md`, replacing it with a requirement that the dashboard composes the `market-news` capability's section in the Market News slot
- [x] 4.2 Remove the now-duplicated Market News backend/service tasks from `openspec/changes/add-dashboard-shell/tasks.md`, replacing them with a task to mount `MarketNewsSection` from this change
- [x] 4.3 Update `openspec/changes/add-dashboard-shell/design.md` and `proposal.md` references to Market News to point at this change instead of re-describing the CryptoPanic integration
- [x] 4.4 Run `openspec validate add-dashboard-shell --strict` after editing, to confirm it still validates

## 5. Verification

- [~] 5.1 Manually verify the Market News section renders real headlines for a user with saved `assetsOfInterest` — not verified against the live CryptoPanic API (no `CRYPTOPANIC_API_KEY` available in this environment); the request-shaping logic (passing saved assets as the `currencies` param) is covered by the automated test in 2.5 instead
- [x] 5.2 Manually verify general headlines render for a user with no saved preferences — verified via curl against a running backend + local Postgres: signup, no preferences saved, `GET /dashboard/news` returned the fallback headline list with 200
- [x] 5.3 Manually simulate a CryptoPanic failure (e.g. invalid API key) and confirm the static fallback list renders instead of an error — verified end-to-end in a browser (Playwright) against the real dev server with no `CRYPTOPANIC_API_KEY` configured: the Market News section rendered all 5 fallback headlines as links, no console errors
- [x] 5.4 Manually verify `GET /dashboard/news` rejects requests without a valid token — verified via curl, returns 401
- [x] 5.5 Run `openspec validate add-market-news --strict` and fix any reported issues
