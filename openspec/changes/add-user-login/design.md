## Context

See proposal.md - Why. Relevant current state:
- `users` table already has `email` (unique), `name`, `password_hash` (added by the registration change) — no schema change needed here.
- `backend/src/routes/auth.js` exports `createAuthRouter(pool, config)` with `POST /auth/signup`; it signs JWTs with `jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' })` and hashes passwords with `bcrypt` (cost 10). `config.jwtSecret` already exists (loaded via `backend/src/config`).
- `backend/src/routes/index.js` wires `createAuthRouter` and a `/health` route; no auth middleware exists yet in `backend/src/middleware/` (only `errorHandler.js`, `notFound.js`).
- `frontend/src/api/client.js` has `apiFetch` (auto-attaches `Authorization: Bearer <token>` when a token is stored), `getAuthToken`/`setAuthToken` (`localStorage`). `LoginPage.jsx` is a static placeholder. `App.jsx` defines flat routes (`login`, `signup`, `onboarding`, `dashboard`) with no guarding — any route renders regardless of auth state.

## Goals / Non-Goals

**Goals:**
- Working login end-to-end: form → verified backend endpoint → token returned → frontend stores token and reaches the intended page.
- Reuse the exact token shape/verification key established by signup (PM-27) so one token works for both flows.
- Protected frontend routes and protected backend routes both consistently require a valid token.

**Non-Goals:**
- Signup endpoint/page — already implemented (PM-10/27/28).
- Password reset, "remember me", account lockout/rate limiting on failed logins.
- Token refresh or server-side revocation/logout beyond clearing the client-stored token.
- Applying auth middleware retroactively to `/health` or `/auth/*` routes — only newly designated protected routes (and any future ones) use it.

## Decisions

- **Reuse `jsonwebtoken` + `config.jwtSecret` for login, verified with `jwt.verify`.** Already the mechanism signup uses to issue tokens; login must accept the same tokens, so there is no alternative to consider — this is the existing contract.
- **Generic 401 for both "unknown email" and "wrong password".** Prevents user enumeration via the login endpoint. Alternative considered: distinct messages for each case — rejected as a security anti-pattern (confirms which emails are registered).
- **Auth middleware as Express middleware (`backend/src/middleware/auth.js`) reading `req.headers.authorization`, verifying with `jwt.verify`, and attaching `req.user = { id: payload.sub }`.** Matches the project's existing middleware pattern (`errorHandler.js`, `asyncHandler`) rather than introducing a new library (e.g. `passport`) for a single verification step.
- **Frontend route guarding via a `RequireAuth` wrapper component used in `App.jsx` around `onboarding`/`dashboard`, checking `getAuthToken()`.** Consistent with the project's existing plain-React/react-router-dom approach (no new routing or state-management library); mirrors the signup page's direct use of `api/client.js` helpers.
- **No new dependencies.** `bcrypt` and `jsonwebtoken` are already installed; nothing new is required for login, middleware, or route guarding.

## Risks / Trade-offs

- [Auth middleware only guards routes it's explicitly applied to] → Acceptable: no protected backend routes exist yet beyond what this change introduces guarding for; applying middleware per-route (not globally) keeps `/health` and `/auth/*` reachable without a token, which is required for login itself to work.
- [Frontend route guard is a client-side check only (no server-rendered gate)] → Acceptable: the frontend is a client-rendered SPA with no sensitive data fetched before the guard runs, and any real protection is enforced server-side by the auth middleware on the underlying API calls.
- [JWT still has no server-side revocation, same as signup] → Unchanged from the registration change's accepted risk; still no logout/session-management story in scope.

## Migration Plan

1. Add `backend/src/middleware/auth.js` (JWT verification middleware).
2. Add `POST /auth/login` to `backend/src/routes/auth.js`, reusing `validateSignupInput`'s style for a smaller email/password validator.
3. Apply the auth middleware to any route requiring protection (wired via `backend/src/routes/index.js`).
4. Implement the login form UI against the live endpoint.
5. Add the `RequireAuth` route-guard wrapper and apply it to `onboarding`/`dashboard` in `App.jsx`.
6. No database migration and no rollback complexity — purely additive route/middleware/UI changes.
