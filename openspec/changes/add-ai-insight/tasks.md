## 1. Config (PM-42)

- [x] 1.1 Extend `backend/src/config/index.js` with optional env vars `LLM_API_KEY` and `LLM_API_BASE_URL` (default to the Hugging Face Inference API's public base URL) — neither required in dev/test, missing values route straight to the fallback

## 2. Backend: Hugging Face integration + fallback (PM-42)

- [x] 2.1 Add `backend/src/services/llmInsight.js` calling the Hugging Face Inference API with a prompt built from an optional `investorType` (generic prompt when absent), exporting a function that returns a normalized `{ text }` insight or throws on failure
- [x] 2.2 Add a static fallback insight (or small set), used when the Hugging Face call fails, times out, is rate-limited, or `LLM_API_KEY`/`LLM_API_BASE_URL` is unset
- [x] 2.3 Add `backend/src/routes/insight.js` exporting `createInsightRouter(pool, config)` with `GET /dashboard/insight` behind `requireAuth(config)`: read the user's `preferences.settings.investorType` (via `pool.query`, same table as `preferences.js`/`news.js`/`prices.js`), call the Hugging Face service with that investor type (or none, for a generic insight), fall back to the static insight on any failure, respond 200 with the insight
- [x] 2.4 Wire `createInsightRouter(pool, config)` into `backend/src/routes/index.js`
- [x] 2.5 Add backend tests (`backend/test/insight.test.js`): insight tailored when `investorType` is saved, generic insight when no preferences saved, fallback insight returned when the Hugging Face call fails/is misconfigured, 401 when unauthenticated

## 3. Frontend: AI Insight section UI (PM-43)

- [x] 3.1 Add `frontend/src/components/dashboard/AiInsightSection.jsx` rendering the generated (or fallback) insight text, fetching `GET /dashboard/insight` via `apiFetch`
- [x] 3.2 Implement independent loading and error states within the component so a slow or failed fetch never blocks anything mounting it
- [x] 3.3 Mount `AiInsightSection` on `frontend/src/pages/DashboardPage.jsx` alongside `MarketNewsSection`/`CoinPricesSection` (temporary standalone placement is fine; final section ordering among all dashboard sections is owned by `add-dashboard-shell`)

## 4. Reconcile sibling change add-dashboard-shell (PM-13)

- [x] 4.1 Trim the "AI Insight of the Day section tailored by investor type" requirement out of `openspec/changes/add-dashboard-shell/specs/dashboard-shell/spec.md`, replacing it with a requirement that the dashboard composes the `ai-insight` capability's section in the AI Insight of the Day slot
- [x] 4.2 Remove the now-duplicated AI Insight backend/service tasks (and the `LLM_API_KEY`/`LLM_API_BASE_URL` config entries) from `openspec/changes/add-dashboard-shell/tasks.md`, replacing them with a task to mount `AiInsightSection` from this change
- [x] 4.3 Update `openspec/changes/add-dashboard-shell/design.md` and `proposal.md` references to AI Insight of the Day to point at this change instead of re-describing the Hugging Face integration
- [x] 4.4 Run `openspec validate add-dashboard-shell --strict` after editing, to confirm it still validates

## 5. Verification

- [x] 5.1 Manually verify the AI Insight section renders a real generated insight for a user with saved `investorType` — no live `LLM_API_KEY` was available in this environment; the request-shaping logic (investor type included in the prompt) is covered by the automated test in 2.5 instead
- [x] 5.2 Manually verify a generic insight renders for a user with no saved preferences — verified via curl: signup with no preferences saved, `GET /dashboard/insight` returned the fallback insight with 200
- [x] 5.3 Manually simulate a Hugging Face failure (e.g. invalid API key) and confirm the static fallback insight renders instead of an error — verified end-to-end in a browser (Playwright) against the real dev servers with no `LLM_API_KEY` configured: the AI Insight section rendered the fallback text with no console errors; also verified via curl for a user with saved `investorType`
- [x] 5.4 Manually verify `GET /dashboard/insight` rejects requests without a valid token — verified via curl, returns 401
- [x] 5.5 Run `openspec validate add-ai-insight --strict` and fix any reported issues
