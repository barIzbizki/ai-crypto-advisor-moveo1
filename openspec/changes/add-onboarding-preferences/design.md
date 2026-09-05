## Context

See proposal.md - Why. Relevant current state:
- The `preferences` table already exists (`backend/migrations/1788636268349_create-preferences-table.js`): `id`, `user_id` (integer, `notNull`, `unique`, FK to `users` with `onDelete: 'cascade'`), `settings` (jsonb, `notNull`, default `'{}'`), `created_at`. No migration is needed — `user_id` unique + cascade already gives one preferences row per user.
- `backend/src/middleware/auth.js` exports `requireAuth(config)`, used today on `GET /auth/me`; it attaches `req.user = { id: payload.sub }` on success.
- `backend/src/routes/index.js` wires `createAuthRouter(pool, config)` under `createRouter(pool, config)`; a new preferences router follows the same `createXRouter(pool, config)` factory pattern.
- `frontend/src/pages/OnboardingPage.jsx` is a static placeholder. `frontend/src/components/RequireAuth.jsx` only checks `getAuthToken()`, with no concept of onboarding completion. `frontend/src/pages/LoginPage.jsx` (from the login change) navigates to the originally requested page or `/dashboard` on successful login. `frontend/src/api/client.js` provides `apiFetch` (auto-attaches the bearer token) and `getAuthToken`/`setAuthToken`.

## Goals / Non-Goals

**Goals:**
- One preferences row per user, created on first save and overwritten on resubmission — no history of past answers.
- A single source of truth (`GET /preferences`) for "has this user completed onboarding," used both for post-login redirect and for guarding direct navigation to `/onboarding`.
- Reuse the existing `preferences` table and auth middleware as-is; no schema change.

**Non-Goals:**
- Editing preferences later from a settings page — out of scope; only the first-login capture flow.
- Analytics/reporting on aggregate preference answers.
- Partial/multi-step save (e.g. saving after each question) — the quiz submits once, atomically, after all three questions are answered.

## Decisions

- **Store all three answers in the existing `settings` jsonb column as `{ assetsOfInterest: string[], investorType: string, contentTypes: string[] }`, rather than adding dedicated columns.** The table was already created with a generic jsonb `settings` column and no dedicated preference columns; adding columns now would require a migration for a shape that's still likely to evolve (more onboarding questions later). Alternative considered: normalized columns per answer — rejected as unnecessary schema churn for three fields with no query/filter requirement on individual keys today.
- **`POST /preferences` upserts via `INSERT ... ON CONFLICT (user_id) DO UPDATE`.** The `user_id` unique constraint makes this a natural Postgres upsert; matches the "replace prior answers" requirement without a separate read-then-write.
- **`GET /preferences` responds 404 when no row exists for the user, rather than 200 with an empty/null body.** Consistent with treating "no preferences saved" as a distinct, checkable state (used by the redirect logic) rather than a valid empty-answer state.
- **Post-login redirect logic lives in the frontend, calling `GET /preferences` right after login succeeds (and again as a guard when `/onboarding` is visited directly).** Mirrors the existing client-side-only route guarding pattern (`RequireAuth`) established by the login change; no server-side redirect or session flag is introduced. A 404 from `GET /preferences` means "go to onboarding"; a 200 means "go to dashboard."
- **No new dependencies.** Reuses `pg` (via the existing `pool`), `requireAuth`, and the existing `apiFetch`/routing setup.

## Risks / Trade-offs

- [Redirect decision depends on a client-side `GET /preferences` call after login, adding a round-trip before the user lands on either page] → Acceptable: consistent with the project's existing client-rendered SPA approach; a brief loading state during that check is an acceptable cost for avoiding a server-side session/redirect mechanism.
- [Storing answers as freeform jsonb means the backend does not validate the exact shape of `assetsOfInterest`/`contentTypes` beyond presence] → Acceptable for this change: the onboarding quiz UI is the only writer today, so it controls the shape; a schema validator can be added later if a second writer appears.
- [A user could bypass the frontend redirect guard and hit `/dashboard` directly before answering] → Acceptable, same trade-off already accepted for `RequireAuth`: real enforcement is server-side per protected endpoint, and no endpoint in this change requires onboarding to have been completed.

## Migration Plan

1. Add `backend/src/routes/preferences.js` exporting `createPreferencesRouter(pool, config)` with `POST /preferences` (upsert) and `GET /preferences` (fetch or 404), both behind `requireAuth(config)`.
2. Wire the new router into `backend/src/routes/index.js` alongside `createAuthRouter`.
3. Implement the onboarding quiz UI in `frontend/src/pages/OnboardingPage.jsx` against the live endpoints.
4. Add the post-login preferences check: call `GET /preferences` after login succeeds (in `LoginPage.jsx`) and when `/onboarding` is visited directly (in `OnboardingPage.jsx` or a small wrapper), redirecting based on 200 vs 404.
5. No database migration and no rollback complexity — purely additive routes/UI on top of the existing table.
