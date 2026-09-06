## Context

See proposal.md - Why. Relevant current state:
- `frontend/src/pages/DashboardPage.jsx` currently mounts `MarketNewsSection`, `CoinPricesSection`, and `AiInsightSection`, each as an independent component fetching its own backend endpoint via `apiFetch` with its own `loading`/`ready`/`error` state (see `CoinPricesSection.jsx`).
- `backend/src/routes/index.js` wires each feature router via a `createXRouter(pool, config)` factory, mounted in `createRouter(pool, config)`. Existing sections (`news.js`, `prices.js`, `insight.js`) all mount their `GET /dashboard/*` route behind `requireAuth(config)`.
- Existing static-content precedents (`backend/src/services/newsFallback.json`, `insightFallback.json`) are *fallbacks* for third-party API failures. This capability has no third-party API at all — the static list is the primary and only content source, closer in spirit to those files' format than to their role.
- The sibling change `add-dashboard-shell` (PM-13) is drafted but not implemented, and its spec currently duplicates this scope ("Fun Crypto Meme section displaying a crypto-themed meme image", explicitly "not tailored by saved preferences"). This change becomes the source of truth for the Fun Crypto Meme section; `add-dashboard-shell` is trimmed to reference it (see proposal.md - Impact).

## Goals / Non-Goals

**Goals:**
- One backend endpoint, `GET /dashboard/meme`, independently callable so the frontend can fetch/render/fail the section on its own, consistent with how the other 3 dashboard sections behave.
- Server-side random selection, so each request/dashboard load can return a different meme without the frontend needing to fetch the full list.
- Match the existing section pattern (`requireAuth`, `apiFetch`, per-section loading/error state) for consistency, even though this content needs no personalization or external API.

**Non-Goals:**
- Personalization by `assetsOfInterest` or any other saved preference — explicitly out of scope per the `add-dashboard-shell` spec.
- User-submitted or dynamically updated memes (e.g. an admin UI, moderation, or a database table) — the list is a small hardcoded/curated set shipped with the backend.
- Avoiding immediate repeats across consecutive loads (e.g. excluding the last-shown meme) — true random selection is sufficient; revisit only if noticeably repetitive in practice.
- Mounting the section into the dashboard page layout itself (section ordering among all 4 sections) — that composition lives in `add-dashboard-shell`; this change ships the section component and its data source.

## Decisions

- **New route file `backend/src/routes/meme.js` exporting `createMemeRouter(pool, config)`**, mounted in `routes/index.js` alongside the existing routers, matching the "one section, one owner" boundary used by `news.js`, `prices.js`, and `insight.js`. Takes `pool`/`config` for signature consistency even though this route needs neither, keeping `routes/index.js` uniform.
- **The curated meme list lives as static JSON, `backend/src/services/memes.json`**, an array of `{ imageUrl, caption }` objects, loaded once at module load (not per-request) since it's fixed content — mirrors `newsFallback.json`/`insightFallback.json` in format and location, without a `services/memes.js` client module since there's no external call to wrap, only a random-pick helper.
- **Random selection happens server-side, once per request**, so the frontend always renders whatever the endpoint returns rather than fetching the whole list and picking client-side. Keeps the response payload small and keeps "pick one at random on each dashboard load" (PM-45) satisfied by the natural request/response cycle — no client-side RNG or shuffling logic needed.
- **The endpoint is behind `requireAuth(config)`, like the other 3 dashboard endpoints**, even though the content itself isn't personalized — keeps all `/dashboard/*` endpoints consistently authenticated rather than carving out an unauthenticated exception for this one.
- **Frontend: a single `CryptoMemeSection` component under `frontend/src/components/dashboard/`**, fetching `GET /dashboard/meme` via the existing `apiFetch` helper, with its own `loading` / `data` / `error` state — mirrors `CoinPricesSection`/`AiInsightSection` exactly, so `add-dashboard-shell` can mount it without extra glue.

## Risks / Trade-offs

- [Static list requires a backend deploy to update or grow] → Acceptable: it's fixed, curated content by design (see Non-Goals); revisit only if frequent content rotation becomes a real need.
- [True random selection can repeat the same meme on consecutive loads] → Acceptable: low-stakes, cosmetic content; no de-duplication logic needed for an MVP section.
- [No caching of the (trivial) computation] → Not a real risk: picking a random array index is O(1); no caching needed.

## Migration Plan

1. Add `backend/src/services/memes.json` (curated `{ imageUrl, caption }` list) and a small `pickRandomMeme()` helper (co-located in the route or a tiny service module, whichever keeps `meme.js` simplest).
2. Add `backend/src/routes/meme.js` exporting `createMemeRouter(pool, config)` with `GET /dashboard/meme` behind `requireAuth(config)`, returning one randomly selected `{ imageUrl, caption }`.
3. Wire `createMemeRouter(pool, config)` into `backend/src/routes/index.js`.
4. Add `frontend/src/components/dashboard/CryptoMemeSection.jsx` fetching `GET /dashboard/meme` via `apiFetch`, with independent loading/error rendering.
5. Coordinate with `add-dashboard-shell`: trim its duplicated Fun Crypto Meme requirement so it mounts `CryptoMemeSection` instead of re-describing the feature.
6. No database migration — no new tables or columns; rollback is reverting the route/service/component additions.
