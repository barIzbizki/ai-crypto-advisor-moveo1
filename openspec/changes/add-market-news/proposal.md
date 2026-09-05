## Why

The dashboard needs a real Market News section instead of a placeholder. This change implements Jira story [PM-14] "Market News section", covering its subtasks [PM-38] (backend integration with the CryptoPanic API, with a static JSON fallback if the API fails or rate-limits) and [PM-39] (news section UI showing a list of headlines/links).

## What Changes

- Add a backend `GET /dashboard/news` endpoint (behind `requireAuth`) that fetches crypto news headlines from the CryptoPanic API, filtered by the authenticated user's saved `assetsOfInterest` where available.
- Add a static JSON fallback headline list, served when the CryptoPanic API call fails, is rate-limited, or `CRYPTOPANIC_API_KEY` is unconfigured, so the section never shows an error state to the user.
- Add a Market News frontend section component rendering a list of headlines (title + source link), with independent loading, error/fallback, and empty states, mounted on the dashboard page.
- Narrow the sibling `add-dashboard-shell` change (PM-13, not yet implemented) so its dashboard page composes this `market-news` capability for the Market News section instead of duplicating the requirement — see Impact.

## Capabilities

### New Capabilities
- `market-news`: Fetches and renders crypto news headlines for the dashboard's Market News section, filtered by the user's saved `assetsOfInterest`, backed by the CryptoPanic API with a static fallback on failure/rate-limit/misconfiguration. Covers PM-14, PM-38, and PM-39 in one spec.

### Modified Capabilities
<!-- none: no capability has been archived to openspec/specs/ yet in this repo -->

## Impact

- **Backend**: add `backend/src/services/cryptopanic.js` (CryptoPanic client + static fallback), add `backend/src/routes/news.js` exposing `GET /dashboard/news` behind `requireAuth`, reading the user's `preferences` row for `assetsOfInterest`; wire into `backend/src/routes/index.js`. Adds new env vars (`CRYPTOPANIC_API_KEY`, `CRYPTOPANIC_API_BASE_URL`) via the existing `loadConfig()` pattern.
- **Frontend**: add a `MarketNewsSection` component under `frontend/src/components/dashboard/`, fetching `GET /dashboard/news` via `apiFetch`, mounted from `frontend/src/pages/DashboardPage.jsx`.
- **Sibling change `add-dashboard-shell` (PM-13, drafted but not yet implemented)**: its `specs/dashboard-shell/spec.md` currently duplicates the full Market News requirement (CryptoPanic + fallback) and its `tasks.md` duplicates the PM-38-equivalent backend tasks. This change trims that requirement down to "dashboard-shell composes the `market-news` capability for its Market News section" and removes the now-redundant backend tasks from `add-dashboard-shell/tasks.md`, so the two changes don't implement the same CryptoPanic integration twice.
- **No breaking changes** — the Market News section does not exist yet in the running app.
