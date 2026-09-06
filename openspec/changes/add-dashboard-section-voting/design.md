## Context

See proposal.md - Why. Relevant current state:
- `backend/migrations/1788636270261_create-votes-table.js` already created the `votes` table: `id`, `user_id` (FK to `users`, cascade delete), `target` (text, not null), `value` (integer, not null), `created_at`, with a unique constraint on `(user_id, target)`. No code references it yet.
- `backend/src/routes/*.js` each export a `create<Name>Router(pool, config)` factory mounted in `backend/src/routes/index.js`; `backend/src/routes/preferences.js` is the closest existing pattern for an authenticated upsert (`INSERT ... ON CONFLICT (user_id) DO UPDATE`).
- `backend/src/middleware/auth.js`'s `requireAuth(config)` sets `req.user = { id: payload.sub }`.
- The 4 dashboard sections (`MarketNewsSection.jsx`, `CoinPricesSection.jsx`, `AiInsightSection.jsx`, `CryptoMemeSection.jsx`) are independent components under `frontend/src/components/dashboard/`, each with its own `useEffect` + `apiFetch` fetch and `loading`/`ready`/`error` state (see `CoinPricesSection.jsx`); there is no shared dashboard-data hook or context between them.

## Goals / Non-Goals

**Goals:**
- Reuse the existing `votes` table without a new migration.
- Define one `target` string format per section so `POST /votes` and `GET /votes` behavior is unambiguous and consistent across all 4 sections.
- Keep vote state per-user only (a user's own up/down), not public aggregate counts.
- Let each section component wire voting with minimal, near-identical code via one shared component.

**Non-Goals:**
- Aggregate/public vote counts or "N people found this useful" displays — out of scope for PM-18/46/47/48, which describe a per-user reaction, not a leaderboard. Revisit as a separate change if requested.
- Voting on arbitrary/dynamic items inside a section beyond what's needed today (e.g. per-headline voting) — most sections show one piece of content per load, so most targets are section-level; only Market News's headline list warrants a per-item target (see Decisions).
- Rate limiting or spam protection on voting — no existing precedent in this codebase for it, and it isn't in the subtasks.

## Decisions

- **`target` string format, one per section, decided now instead of left open:**
  - Coin Prices: `coin-prices` — the whole section is one unit; there's no single "item" to vote on.
  - AI Insight: `insight:<isoDate>` where `isoDate` is today's UTC calendar date computed client-side (e.g. `insight:2026-09-06`), since `GET /dashboard/insight` returns only `{ text }` with no date or id of its own — this still keys the vote to "today's insight" (matching the section's "AI Insight of the Day" framing) without requiring a backend change to add a date field.
  - Crypto Meme: `meme:<imageUrl>` where `imageUrl` is the meme's own `imageUrl` field from `GET /dashboard/meme` (`backend/src/services/memes.json` has no `id` field; `imageUrl` is already unique per entry and stable across picks) — a different meme shown on reload gets its own vote rather than inheriting a stale one.
  - Market News: `news:<headlineId>` where `headlineId` is the id already present in each headline returned by `GET /dashboard/news` — voting applies to the list, so PM-48's "control attached to each of the 4 sections" is satisfied by attaching one control to the section's top-level content; if `GET /dashboard/news` returns multiple headlines with no natural single "the headline", the section-level control votes on `news:latest` (the whole list as shown), keeping one control per section for v1. (Per-headline voting is a natural follow-up, not required by the current subtasks.)
  - Every target is an opaque string from the backend's perspective — the route does no per-section validation of target shape, only that it's a non-empty string. This keeps `votes.js` decoupled from the other 4 route modules; each frontend section is responsible for constructing its own correct target string.
- **`POST /votes` upserts and toggles off, mirroring `preferences.js`'s `ON CONFLICT` pattern:**
  ```sql
  INSERT INTO votes (user_id, target, value)
  VALUES ($1, $2, $3)
  ON CONFLICT (user_id, target)
  DO UPDATE SET value = EXCLUDED.value
  WHERE votes.value <> EXCLUDED.value
  RETURNING value
  ```
  followed by a `DELETE FROM votes WHERE user_id = $1 AND target = $2 AND value = $3` when the `INSERT` reports no updated row because the existing value already matched (i.e., the user re-cast their existing vote) — implemented as: try the upsert; if the returned row count is 0, run the delete and respond with `value: null`. This gives one endpoint for cast, change, and retract, matching the spec's three scenarios without a separate `DELETE /votes` route.
- **`GET /votes?targets=a,b,c` (comma-separated) returns only the requesting user's own votes**, shaped as `{ votes: { "a": 1, "b": -1 } }` — targets with no vote are simply absent from the map (not present as `null`), which keeps the payload small and lets the frontend treat "absent" as "no vote" directly. Comma-separated query param (not repeated `targets=a&targets=b`) matches how query strings are otherwise unused elsewhere in this codebase and keeps the frontend call to a single template string.
- **New route file `backend/src/routes/votes.js` exporting `createVotesRouter(pool, config)`**, mounted in `routes/index.js` alongside the others, rather than folding voting into each of the 4 existing section route files — keeps the vote data model and its one table owned in one place, consistent with the "one capability, one router" boundary already used for `news.js`, `prices.js`, etc.
- **Frontend: one presentational `VoteControl` component** (`frontend/src/components/dashboard/VoteControl.jsx`) taking a `target` prop, owning its own fetch of current state (`GET /votes?targets=<target>`) and its own `POST /votes` call on click, rendering thumbs-up/thumbs-down buttons with the active one highlighted. Each of the 4 section components renders `<VoteControl target="..." />` once, passing the target string decided above — this avoids duplicating fetch/POST/highlight logic 4 times, at the cost of one extra small network request per section (acceptable given each section already makes its own independent request).

## Risks / Trade-offs

- [Per-target `GET /votes` call from each `VoteControl` instance means 4 extra requests per dashboard load, one per section] → Acceptable: each section already fetches its own content independently (no shared loader), so this matches the existing per-section request pattern rather than introducing a new one.
- [`news:latest` as a single section-level target for Market News loses per-headline granularity] → Accepted for v1: the subtasks describe "each of the 4 sections," not each headline; per-headline voting can be a follow-up if product wants finer-grained feedback.
- [No aggregate vote counts] → Accepted: nothing in PM-18/46/47/48 asks for a public count, only a personal reaction control.

## Migration Plan

1. No database migration — `votes` table already exists as-is.
2. Add `backend/src/routes/votes.js` exporting `createVotesRouter(pool, config)`:
   - `POST /votes` behind `requireAuth(config)`, body `{ target, value }` (`value` in `{1, -1}`), implementing the upsert-or-delete toggle described above.
   - `GET /votes` behind `requireAuth(config)`, query `?targets=a,b,c`, returning `{ votes: { ... } }` for the requesting user only.
3. Wire `createVotesRouter(pool, config)` into `backend/src/routes/index.js`.
4. Add `frontend/src/components/dashboard/VoteControl.jsx` (fetch current state, render buttons, POST on click, optimistic or post-response UI update).
5. Import and render `<VoteControl target="..." />` in each of `MarketNewsSection.jsx`, `CoinPricesSection.jsx`, `AiInsightSection.jsx`, `CryptoMemeSection.jsx`, using the target strings decided above.
6. Rollback: remove the route file, its mount line, and the `VoteControl` usages; the `votes` table can stay in place unused since it predates this change.
