## Context

See proposal.md - Why. Relevant current state:
- `users` table (migration `1788636266054_create-users-table.js`) has only `id`, `email` (unique), `created_at` — no `name` or password column.
- Backend (`backend/src/`) is a plain Express app (CommonJS, no auth/session layer yet); routes are wired in `backend/src/routes/index.js` via `createRouter(pool)`.
- Frontend (`frontend/src/`) is React 19 + react-router-dom 7; `frontend/src/api/client.js` already has `apiFetch`, `getAuthToken`/`setAuthToken` (Bearer token in `localStorage`), anticipating token-based auth. `SignupPage.jsx` and `LoginPage.jsx` are both static placeholders.
- No password-hashing or JWT/session library is installed in `backend/package.json` yet.

## Goals / Non-Goals

**Goals:**
- Working signup end-to-end: form → validated backend endpoint → persisted user → token returned → frontend stores token and redirects.
- Passwords never stored or logged in plaintext.

**Non-Goals:**
- Login endpoint/page (PM-? separate story) — out of scope beyond reusing the same token shape.
- Email verification, password reset, rate limiting/anti-abuse on signup.
- Session/token revocation and refresh — a minimal token strategy is enough to unblock onboarding.

## Decisions

- **Password hashing: `bcrypt`.** Widely used, purpose-built for password hashing (built-in salting, tunable cost factor), and pairs with a plain Express/pg stack without extra infra. Alternative considered: `argon2` (stronger but adds a native-build dependency with less mature Windows/Node support here); not worth it for this scope.
- **Auth token: JWT signed with a server secret (`jsonwebtoken`), no server-side session store.** Matches the frontend's existing Bearer-token client (`api/client.js`) and needs no new infrastructure (Redis/session table). Alternative considered: opaque token in a new `sessions` table — more robust (revocable) but unnecessary complexity for unblocking onboarding now; can be swapped later without changing the spec's observable behavior (still "an auth token" from the client's perspective).
- **Migration adds `name` (text, not null) and `password_hash` (text, not null) to `users`** via a new node-pg-migrate migration, rather than altering the existing migration — existing migrations are treated as immutable history.
- **Validation lives in the route handler (or a small shared validator function), not a full framework** (e.g. no `joi`/`zod` added) — the field set is small (email, name, password) and the project has no validation library precedent yet; keeps the dependency footprint minimal. Revisit if more auth endpoints add validation needs.
- **Frontend form is plain React state (`useState`), no form library** — consistent with the project's current lack of any form/state-management dependency.

## Risks / Trade-offs

- [JWT has no server-side revocation] → Acceptable for this scope since there's no login/logout/session-management story yet; revisit when a logout or account-suspension flow is added.
- [bcrypt is a native addon] → It's a mature, widely-deployed package with prebuilt binaries for standard Node versions; low risk given `engines.node >=18` is already set.
- [Adding NOT NULL columns to an existing table] → The `users` table has no rows yet in any real environment for this pre-launch project, so no backfill migration is needed; if that assumption is wrong, the migration must backfill existing rows before adding the NOT NULL constraint.

## Migration Plan

1. Add the `name`/`password_hash` migration; run it in dev before the endpoint lands.
2. Add `bcrypt` and `jsonwebtoken` to `backend/package.json`.
3. Implement and wire the `/auth/signup` route.
4. Implement the signup form UI against the live endpoint.
5. No rollback complexity beyond the standard `migrate:down` for the new migration; no data migration of existing rows is required (see Risks).
