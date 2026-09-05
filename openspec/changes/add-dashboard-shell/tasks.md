## 1. Config and shared setup (PM-13)

- [ ] 1.1 Extend `backend/src/config/index.js` with optional env vars: `CRYPTOPANIC_API_KEY`, `COINGECKO_API_BASE_URL` (default to CoinGecko's public base URL), `LLM_API_KEY`, `LLM_API_BASE_URL` — none required outside production, missing values simply disable that integration
- [ ] 1.2 Add a small shared helper to read the authenticated user's saved preferences row (`assetsOfInterest`, `investorType`, `contentTypes`) by `user_id`, reused by the news/prices/insight routes

## 2. Market News section (PM-37)

- [ ] 2.1 Add `backend/src/services/cryptopanic.js` fetching headlines from the CryptoPanic API filtered by given asset symbols, exporting a function that returns headlines or throws on failure
- [ ] 2.2 Add a static fallback headline list used when the CryptoPanic call fails or `CRYPTOPANIC_API_KEY` is unset
- [ ] 2.3 Add `GET /dashboard/news` behind `requireAuth`: read the user's `assetsOfInterest` (or none), call the CryptoPanic service, fall back to the static list on failure, respond 2xx with headlines
- [ ] 2.4 Add backend tests: headlines filtered by saved assets, fallback used on API failure, general headlines returned when no preferences saved, 401 when unauthenticated

## 3. Coin Prices section (PM-37)

- [ ] 3.1 Add `backend/src/services/coingecko.js` fetching current prices from the CoinGecko API for given coin ids, exporting a function that returns prices or throws on failure
- [ ] 3.2 Add `GET /dashboard/prices` behind `requireAuth`: read the user's `assetsOfInterest` (or a default coin set if none saved), call the CoinGecko service, respond 2xx with prices or an explicit error status on failure
- [ ] 3.3 Add backend tests: prices returned for saved assets, default coin set used when no preferences saved, explicit error response when CoinGecko call fails, 401 when unauthenticated

## 4. AI Insight of the Day section (PM-37)

- [ ] 4.1 Add `backend/src/services/llmInsight.js` calling a free-tier LLM provider (e.g. Hugging Face Inference API) with a prompt tailored by investor type, exporting a function that returns generated text or throws on failure
- [ ] 4.2 Add a static fallback insight (or small set, chosen generically) used when the LLM call fails or is unconfigured
- [ ] 4.3 Add `GET /dashboard/insight` behind `requireAuth`: read the user's `investorType` (or none), call the LLM service, fall back to the static insight on failure, respond 2xx
- [ ] 4.4 Add backend tests: insight tailored by saved investor type, fallback used on LLM failure, generic insight returned when no preferences saved, 401 when unauthenticated

## 5. Fun Crypto Meme section (PM-37)

- [ ] 5.1 Add a small curated set of crypto meme image URLs/assets (static, not preference-tailored)
- [ ] 5.2 Add `GET /dashboard/meme` behind `requireAuth`: respond 2xx with one meme (e.g. random or rotating pick from the curated set)
- [ ] 5.3 Add a backend test: 2xx with a meme payload for an authenticated request, 401 when unauthenticated

## 6. Wire routes and dashboard UI (PM-13)

- [ ] 6.1 Wire `createDashboardRouter(pool, config)` into `backend/src/routes/index.js` alongside the existing routers
- [ ] 6.2 Replace `frontend/src/pages/DashboardPage.jsx`'s health-check body with 4 section components rendered in order: Market News, Coin Prices, AI Insight of the Day, Fun Crypto Meme
- [ ] 6.3 Each section component fetches its own endpoint via `apiFetch` independently, with its own loading state and error/fallback rendering, so one section's failure doesn't block the others
- [ ] 6.4 Confirm unauthenticated access to `/dashboard` redirects to login via the existing `RequireAuth` guard

## 7. Verification

- [ ] 7.1 Manually verify all 4 sections render for a user with saved preferences, each reflecting `assetsOfInterest`/`investorType` where applicable
- [ ] 7.2 Manually verify all 4 sections render sensible defaults for a user with no saved preferences
- [ ] 7.3 Manually simulate one section's API failing (e.g. invalid API key) and confirm the other 3 sections still render normally
- [ ] 7.4 Manually verify all 4 `GET /dashboard/*` endpoints reject requests without a valid token
- [ ] 7.5 Run `openspec validate add-dashboard-shell --strict` and fix any reported issues
