## Why

Logged-in users land on a `/dashboard` page that only shows a backend health check — it has no real content. This change implements Jira story [PM-13] "Dashboard shell", covering its subtask [PM-37] (dashboard page rendering 4 fixed sections, using saved preferences to filter/tailor content).

## What Changes

- Replace the `/dashboard` placeholder with a real dashboard shell rendering 4 fixed sections, in order: Market News, Coin Prices, AI Insight of the Day, and Fun Crypto Meme (PM-37).
- Add backend endpoint(s) that fetch/assemble content for each section, tailoring results using the authenticated user's saved preferences (`assetsOfInterest`, `investorType`, `contentTypes`) from the existing `GET /preferences`:
  - Market News: rendered via the `market-news` capability (delivered by the sibling change `add-market-news`, PM-14/PM-38/PM-39) — headlines from the CryptoPanic API with a static fallback, filtered by the user's `assetsOfInterest`.
  - Coin Prices: live prices from the CoinGecko API for the user's `assetsOfInterest`.
  - AI Insight of the Day: a short generated insight from a free-tier LLM (e.g. Hugging Face Inference API), tailored to the user's `investorType`.
  - Fun Crypto Meme: a lighthearted crypto meme/image, not tailored by preferences.
- Each section loads and fails independently — one section's data source being unavailable does not block the other three from rendering.

## Capabilities

### New Capabilities
- `dashboard-shell`: The post-login dashboard page rendering 4 fixed sections (Market News, Coin Prices, AI Insight of the Day, Fun Crypto Meme), each populated by its own backend-fetched data source and tailored using the user's saved preferences where applicable. Covers PM-13 and PM-37 in one spec.

### Modified Capabilities
<!-- none: no existing openspec/specs/ capability changes behavior -->

## Impact

- **Backend**: add a new route module (e.g. `backend/src/routes/dashboard.js`) exposing `GET /dashboard/*` endpoints behind `requireAuth` for Coin Prices, AI Insight, and Fun Crypto Meme, each calling out to its external data source (CoinGecko, an LLM provider) and reading the user's preferences via the existing `preferences` table/query; wire into `backend/src/routes/index.js`. Market News' `GET /dashboard/news` endpoint is added by `add-market-news`, not here. Adds new outbound HTTP dependencies (CoinGecko, an LLM API) and associated config/env vars for API keys/base URLs.
- **Frontend**: replace `frontend/src/pages/DashboardPage.jsx`'s health-check placeholder with 4 section components in order (Market News via `add-market-news`'s `MarketNewsSection`, plus Coin Prices/AI Insight/Fun Crypto Meme built here), each fetching its own data via `apiFetch` and handling independent loading/error/empty states.
- **No breaking changes** — `/dashboard` is currently an unimplemented placeholder.
