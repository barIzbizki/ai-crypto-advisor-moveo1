## 1. Backend: static meme list + random pick (PM-44)

- [x] 1.1 Add `backend/src/services/memes.json`: a curated array of `{ imageUrl, caption }` entries (crypto-themed memes)
- [x] 1.2 Add a `pickRandomMeme()` helper that loads `memes.json` once and returns a randomly selected entry per call

## 2. Backend: meme endpoint (PM-45)

- [x] 2.1 Add `backend/src/routes/meme.js` exporting `createMemeRouter(pool, config)` with `GET /dashboard/meme` behind `requireAuth(config)`, responding 200 with `{ imageUrl, caption }` from `pickRandomMeme()`
- [x] 2.2 Wire `createMemeRouter(pool, config)` into `backend/src/routes/index.js`
- [x] 2.3 Add backend tests (`backend/test/meme.test.js`): response shape (`imageUrl` + `caption`) matches an entry from `memes.json`, repeated requests can return different entries, 401 when unauthenticated

## 3. Frontend: Fun Crypto Meme section UI (PM-45)

- [x] 3.1 Add `frontend/src/components/dashboard/CryptoMemeSection.jsx` rendering the fetched meme's image and caption, fetching `GET /dashboard/meme` via `apiFetch`
- [x] 3.2 Implement independent loading and error states within the component so a slow or failed fetch never blocks anything mounting it
- [x] 3.3 Mount `CryptoMemeSection` on `frontend/src/pages/DashboardPage.jsx` after `AiInsightSection` (temporary standalone placement is fine; final section ordering among all dashboard sections is owned by `add-dashboard-shell`)

## 4. Reconcile sibling change add-dashboard-shell (PM-13)

- [x] 4.1 Trim the "Fun Crypto Meme section" requirement out of `openspec/changes/add-dashboard-shell/specs/dashboard-shell/spec.md`, replacing it with a requirement that the dashboard composes the `crypto-meme` capability's section in the Fun Crypto Meme slot
- [x] 4.2 Update `openspec/changes/add-dashboard-shell/design.md` and `proposal.md` references to the Fun Crypto Meme section to point at this change instead of re-describing it
- [x] 4.3 Run `openspec validate add-dashboard-shell --strict` after editing, to confirm it still validates

## 5. Verification

- [x] 5.1 Manually verify the Fun Crypto Meme section renders an image and caption on dashboard load — verified end-to-end in a browser (Playwright) against the real dev server: signed up a test user, loaded `/dashboard`, the Fun Crypto Meme section rendered an image and caption below AI Insight of the Day, no console errors from `/dashboard/meme`
- [x] 5.2 Manually verify reloading the dashboard several times can surface different memes from the curated list — verified via the same browser session: reloading 4 times surfaced 3 distinct memes (image + caption) from the 5-entry curated list
- [x] 5.3 Manually verify `GET /dashboard/meme` rejects requests without a valid token — verified via curl, returns 401
- [x] 5.4 Run `openspec validate add-crypto-meme --strict` and fix any reported issues
