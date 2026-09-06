## 1. Backend: votes route (PM-46, PM-47)

- [x] 1.1 Confirm the existing `votes` table (`backend/migrations/1788636270261_create-votes-table.js`) matches design.md's needs (`user_id`, `target`, `value`, unique `(user_id, target)`) — no new migration required
- [x] 1.2 Add `backend/src/routes/votes.js` exporting `createVotesRouter(pool, config)` with `POST /votes` behind `requireAuth(config)`: validate body `{ target, value }` (`target` non-empty string, `value` in `{1, -1}`), returning 400 with `{ error: { message, fields } }` on invalid input (mirroring `validate...Input` pattern in `preferences.js`)
- [x] 1.3 Implement the upsert-or-toggle-off logic in the `POST /votes` handler per design.md (`INSERT ... ON CONFLICT (user_id, target) DO UPDATE ... WHERE votes.value <> EXCLUDED.value`, falling back to `DELETE` when the upsert affects no row), responding with the resulting `{ value }` (`null` when the vote was retracted)
- [x] 1.4 Add `GET /votes` behind `requireAuth(config)`, parsing `?targets=a,b,c`, returning `{ votes: { <target>: <value> } }` containing only targets the requesting user has voted on
- [x] 1.5 Wire `createVotesRouter(pool, config)` into `backend/src/routes/index.js`
- [x] 1.6 Add backend tests (`backend/test/votes.test.js`): first vote recorded, vote changed (up→down), vote retracted by re-casting the same value, invalid `value` rejected with 400, `GET /votes` returns only the requesting user's votes for the requested targets, 401 on both routes when unauthenticated

## 2. Frontend: VoteControl component (PM-48)

- [x] 2.1 Add `frontend/src/components/dashboard/VoteControl.jsx` accepting a `target` prop: on mount, fetch `GET /votes?targets=<target>` via `apiFetch` to determine initial state (up/down/none); render thumbs-up/thumbs-down buttons with the active one visually highlighted
- [x] 2.2 On click, `POST /votes` with `{ target, value }` via `apiFetch` and update local state from the response (including the retract-to-`null` case), independent of the parent section's own loading/error state
- [x] 2.3 Mount `<VoteControl target="coin-prices" />` in `CoinPricesSection.jsx`
- [x] 2.4 Mount `<VoteControl target={`insight:${todayIsoDate}`} />` in `AiInsightSection.jsx`, computing today's UTC date client-side per design.md's target format
- [x] 2.5 Mount `<VoteControl target={`meme:${meme.imageUrl}`} />` in `CryptoMemeSection.jsx`, using the loaded meme's `imageUrl` as its stable identifier
- [x] 2.6 Mount `<VoteControl target="news:latest" />` in `MarketNewsSection.jsx` per design.md's section-level target decision for this list-shaped section

## 3. Verification

- [x] 3.1 Manually verify casting, changing, and retracting a vote on each of the 4 sections updates the control immediately and persists across a page reload — verified end-to-end in a browser (Playwright) against the running dev servers: signed up, landed on the dashboard, and for each of the 4 sections clicked thumbs-up (highlighted), clicked it again (cleared), then clicked thumbs-down (highlighted); reloading the page showed the same down-voted state for all 4 sections
- [x] 3.2 Manually verify voting on one section does not affect the vote state shown on the other three — verified in the same Playwright run: each section's control was driven independently and only ever reflected that section's own target
- [x] 3.3 Manually verify `POST /votes` and `GET /votes` both reject unauthenticated requests with 401 — verified via curl against the running backend: both endpoints returned 401 with no token
- [x] 3.4 Run `openspec validate add-dashboard-section-voting --strict` and fix any reported issues
