## Why

There's currently no way for a user to signal whether a dashboard section (news, prices, AI insight, meme) was useful, so the product has no feedback signal to tune content quality. This change implements Jira story [PM-18] "Thumbs up/down on each dashboard section", covering its subtasks [PM-46] (votes schema), [PM-47] (backend `POST /votes`), and [PM-48] (thumbs up/down UI wired to the endpoint).

## What Changes

- Finalize the votes data model on top of the `votes` table already migrated in `backend/migrations/1788636270261_create-votes-table.js` (`user_id`, `target`, `value`, unique on `(user_id, target)`), and define a documented `target` string format per dashboard section instead of adding separate section-type/item-reference columns.
- Add a backend `POST /votes` endpoint (behind `requireAuth`) that records or changes a user's vote for a given `target`, upserting via `ON CONFLICT (user_id, target)`, and casting the same value again clears the vote (un-vote).
- Add a backend `GET /votes` endpoint (behind `requireAuth`) so the frontend can hydrate each section's current vote state on dashboard load.
- Add a reusable `VoteControl` UI component and wire it into all 4 existing dashboard sections (`MarketNewsSection`, `CoinPricesSection`, `AiInsightSection`, `CryptoMemeSection`), each supplying its own `target` string.

## Capabilities

### New Capabilities
- `section-voting`: Lets an authenticated user cast, change, or retract a thumbs up/down vote on any dashboard section (or a specific item within one), backed by the existing `votes` table, and renders the control with current vote state on all 4 dashboard sections. Covers PM-18, PM-46, PM-47, and PM-48 in one spec.

### Modified Capabilities
<!-- none: dashboard-shell, market-news, coin-prices, ai-insight, and crypto-meme specs are not modified — each section's existing fetch/render requirements are unchanged; VoteControl is additive UI within each -->

## Impact

- **Database**: no new migration — reuses the existing `votes` table as-is. This is a deliberate deviation from PM-46's literal wording (separate "section type" and "item reference" fields): a single `target` text column, populated with per-section string formats (e.g. `coin-prices`, `insight:<date>`, `news:<headlineId>`, `meme:<id>`), is sufficient to identify what was voted on and keeps the unique constraint and upsert logic simple. See design.md for the exact formats.
- **Backend**: add `backend/src/services/votes.js` (or inline query logic) and `backend/src/routes/votes.js` exporting `createVotesRouter(pool, config)` with `POST /votes` and `GET /votes`, wired into `backend/src/routes/index.js` alongside the existing routers.
- **Frontend**: add `frontend/src/components/dashboard/VoteControl.jsx`, imported by all 4 section components under `frontend/src/components/dashboard/`; each passes its own `target` and reads/POSTs via `apiFetch`.
- **No breaking changes** — voting does not exist in the running app yet.
