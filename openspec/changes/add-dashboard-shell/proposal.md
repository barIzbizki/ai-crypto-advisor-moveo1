## Why

Logged-in users land on a `/dashboard` page that only shows a backend health check — it has no real content. This change implements Jira story [PM-13] "Dashboard shell", covering its subtask [PM-37] (dashboard page rendering 4 fixed sections, using saved preferences to filter/tailor content). Market News (PM-14), Coin Prices (PM-15), AI Insight of the Day (PM-16), and Fun Crypto Meme (PM-17) are delivered by sibling changes and composed here rather than re-implemented.

## What Changes

- Replace the `/dashboard` placeholder with a real dashboard shell rendering 4 fixed sections, in order: Market News, Coin Prices, AI Insight of the Day, and Fun Crypto Meme (PM-37).
- Add backend endpoint(s) that fetch/assemble content for each section, tailoring results using the authenticated user's saved preferences (`assetsOfInterest`, `investorType`, `contentTypes`) from the existing `GET /preferences`:
  - Market News: rendered via the `market-news` capability (delivered by the sibling change `add-market-news`, PM-14/PM-38/PM-39) — headlines from the CryptoPanic API with a static fallback, filtered by the user's `assetsOfInterest`.
  - Coin Prices: rendered via the `coin-prices` capability (delivered by the sibling change `add-coin-prices`, PM-15/PM-40/PM-41) — live prices from the CoinGecko API for the user's `assetsOfInterest` (or a default coin set), with an explicit error state on failure.
  - AI Insight of the Day: rendered via the `ai-insight` capability (delivered by the sibling change `add-ai-insight`, PM-16/PM-42/PM-43) — a short generated insight from the Hugging Face Inference API, tailored to the user's `investorType`, with a static fallback on failure.
  - Fun Crypto Meme: rendered via the `crypto-meme` capability (delivered by the sibling change `add-crypto-meme`, PM-17/PM-44/PM-45) — a randomly selected meme (image + caption) from a static curated list, not tailored by preferences.
- Each section loads and fails independently — one section's data source being unavailable does not block the other three from rendering.

## Capabilities

### New Capabilities
- `dashboard-shell`: The post-login dashboard page rendering 4 fixed sections (Market News, Coin Prices, AI Insight of the Day, Fun Crypto Meme), each populated by its own backend-fetched data source and tailored using the user's saved preferences where applicable. Covers PM-13 and PM-37 in one spec.

### Modified Capabilities
<!-- none: no existing openspec/specs/ capability changes behavior -->

## Impact

- **Backend**: no new route module is built here. Market News' `GET /dashboard/news` endpoint is added by `add-market-news`, Coin Prices' `GET /dashboard/prices` endpoint is added by `add-coin-prices`, AI Insight's `GET /dashboard/insight` endpoint (plus its Hugging Face Inference API dependency and `LLM_API_KEY`/`LLM_API_BASE_URL` config) is added by `add-ai-insight`, and Fun Crypto Meme's `GET /dashboard/meme` endpoint (plus its static curated meme list) is added by `add-crypto-meme`.
- **Frontend**: replace `frontend/src/pages/DashboardPage.jsx`'s health-check placeholder with 4 section components in order — Market News via `add-market-news`'s `MarketNewsSection`, Coin Prices via `add-coin-prices`'s `CoinPricesSection`, AI Insight of the Day via `add-ai-insight`'s `AiInsightSection`, and Fun Crypto Meme via `add-crypto-meme`'s `CryptoMemeSection` — each mounted as-is, fetching its own data via `apiFetch` and handling independent loading/error/empty states.
- **No breaking changes** — `/dashboard` is currently an unimplemented placeholder.
