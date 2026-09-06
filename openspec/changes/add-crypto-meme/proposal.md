## Why

The dashboard needs a real Fun Crypto Meme section instead of a placeholder. This change implements Jira story [PM-17] "Fun Crypto Meme", covering its subtasks [PM-44] (static JSON list of memes, each with an image URL and caption) and [PM-45] (meme UI section that picks one at random on each dashboard load).

## What Changes

- Add a backend `GET /dashboard/meme` endpoint (behind `requireAuth`) that returns one randomly selected meme (`imageUrl` + `caption`) from a static, curated list on each request.
- Add the static curated meme list as a JSON file co-located with a small service module, following the existing static-content pattern used by other sections (e.g. `newsFallback.json`, `insightFallback.json`).
- Add a Fun Crypto Meme frontend section component rendering the selected meme's image and caption, with its own independent loading and error states, mounted on the dashboard page.
- Narrow the sibling `add-dashboard-shell` change (PM-13, not yet implemented) so its dashboard page composes this `crypto-meme` capability for the Fun Crypto Meme section instead of duplicating the requirement — see Impact.

## Capabilities

### New Capabilities
- `crypto-meme`: Serves one randomly selected crypto meme (image URL + caption) from a static curated list on each dashboard load, and renders it in a dedicated dashboard section. Covers PM-17, PM-44, and PM-45 in one spec.

### Modified Capabilities
<!-- none: no capability has been archived to openspec/specs/ yet in this repo -->

## Impact

- **Backend**: add `backend/src/services/memes.json` (static curated meme list: `imageUrl` + `caption` entries) and a small helper to pick one at random, add `backend/src/routes/meme.js` exposing `GET /dashboard/meme` behind `requireAuth`; wire into `backend/src/routes/index.js`. No new env vars or external API — this is fixed, curated content, not tailored by saved preferences (per the `add-dashboard-shell` spec).
- **Frontend**: add a `CryptoMemeSection` component under `frontend/src/components/dashboard/`, fetching `GET /dashboard/meme` via `apiFetch`, mounted from `frontend/src/pages/DashboardPage.jsx` after the AI Insight section.
- **Sibling change `add-dashboard-shell` (PM-13, drafted but not yet implemented)**: its `specs/dashboard-shell/spec.md` currently duplicates the full Fun Crypto Meme requirement ("displays a crypto-themed meme image"). This change trims that requirement down to "dashboard-shell composes the `crypto-meme` capability for its Fun Crypto Meme section" so the two changes don't implement the same feature twice.
- **No breaking changes** — the Fun Crypto Meme section does not exist yet in the running app.
