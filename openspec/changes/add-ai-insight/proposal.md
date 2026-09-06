## Why

The dashboard needs a real AI Insight of the Day section instead of a placeholder. This change implements Jira story [PM-16] "AI Insight of the Day", covering its subtasks [PM-42] (backend integration with the Hugging Face Inference API, generating a short insight based on the user's saved preferences) and [PM-43] (AI Insight UI section showing the generated text with loading/error states).

## What Changes

- Add a backend `GET /dashboard/insight` endpoint (behind `requireAuth`) that generates a short insight via the Hugging Face Inference API, prompted using the authenticated user's saved `investorType` where available.
- Add a static fallback insight (or small curated set), served when the Hugging Face call fails, times out, is rate-limited, or `LLM_API_KEY`/`LLM_API_BASE_URL` is unconfigured, so the section never shows an error state to the user — mirrors Market News's fallback approach rather than Coin Prices's explicit-error approach, since a generated "fun fact"-style insight has no correctness requirement that fabricated content could violate.
- When the user has no saved preferences at all, generate/display a generic, non-tailored insight rather than an empty or error state.
- Add an AI Insight frontend section component rendering the generated (or fallback) insight text, with independent loading and error states, mounted on the dashboard page.
- Narrow the sibling `add-dashboard-shell` change (PM-13, not yet implemented) so its dashboard page composes this `ai-insight` capability for the AI Insight of the Day section instead of duplicating the requirement — see Impact.

## Capabilities

### New Capabilities
- `ai-insight`: Generates and renders a short AI insight for the dashboard's AI Insight of the Day section, tailored to the user's saved `investorType` (or generic when no preferences are saved), backed by the Hugging Face Inference API with a static fallback on failure/rate-limit/misconfiguration. Covers PM-16, PM-42, and PM-43 in one spec.

### Modified Capabilities
<!-- none: no capability has been archived to openspec/specs/ yet in this repo -->

## Impact

- **Backend**: add `backend/src/services/llmInsight.js` (Hugging Face Inference API client + static fallback), add `backend/src/routes/insight.js` exposing `GET /dashboard/insight` behind `requireAuth`, reading the user's `preferences` row for `investorType`; wire into `backend/src/routes/index.js`. Adds new env vars (`LLM_API_KEY`, `LLM_API_BASE_URL`) via the existing `loadConfig()` pattern — the same names already anticipated (but not yet added) by `add-dashboard-shell`'s config task.
- **Frontend**: add an `AiInsightSection` component under `frontend/src/components/dashboard/`, fetching `GET /dashboard/insight` via `apiFetch`, mounted from `frontend/src/pages/DashboardPage.jsx`.
- **Sibling change `add-dashboard-shell` (PM-13, drafted but not yet implemented)**: its `specs/dashboard-shell/spec.md` currently duplicates the full AI Insight of the Day requirement (LLM integration + fallback + generic-insight scenario) and its `tasks.md`/`design.md`/`proposal.md` duplicate the PM-42-equivalent backend tasks and the `LLM_API_KEY`/`LLM_API_BASE_URL` config entries. This change trims that requirement down to "dashboard-shell composes the `ai-insight` capability for its AI Insight of the Day section" and removes the now-redundant backend tasks/config entries from `add-dashboard-shell`, so the two changes don't implement the same Hugging Face integration twice.
- **No breaking changes** — the AI Insight of the Day section does not exist yet in the running app.
