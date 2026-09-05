## Why

Registered users currently have no way to authenticate: the backend exposes only `POST /auth/signup`, and the frontend's `/login` route is a static placeholder. Without login, no authenticated route (dashboard, onboarding) can be protected or reached by a returning user. This change implements Jira story [PM-11] "User login", covering its four subtasks: [PM-29] (backend login endpoint), [PM-30] (login page UI), [PM-31] (auth middleware), and [PM-32] (frontend route guarding).

## What Changes

- Add a `POST /auth/login` backend endpoint that accepts email and password, verifies credentials against the stored password hash, and returns a JWT and the user's public profile on success (PM-29).
- Add backend auth middleware that verifies the `Authorization: Bearer <token>` JWT on protected routes and rejects missing/invalid/expired tokens with 401 (PM-31).
- Build out the `/login` frontend page with a real form (email, password), client-side validation, submission to the new endpoint, storage of the returned token, and display of server-side errors (e.g. invalid credentials) (PM-30).
- Add frontend route guarding that redirects unauthenticated users attempting to reach protected routes (onboarding, dashboard) to `/login`, and attaches the stored JWT to outgoing API requests (already partly handled by `apiFetch`) (PM-32).

## Capabilities

### New Capabilities
- `user-login`: End-to-end email/password login — backend credential verification and JWT issuance, backend route protection via auth middleware, the login form UI with error display, and frontend route guarding for protected pages. Covers PM-11, PM-29, PM-30, PM-31, and PM-32 in one spec.

### Modified Capabilities
<!-- none: no existing openspec/specs/ capability changes behavior -->

## Impact

- **Backend**: extend `backend/src/routes/auth.js` (or a sibling module) with `POST /auth/login`; add `backend/src/middleware/auth.js` (JWT verification middleware); apply the middleware to routes that must be protected.
- **Frontend**: `frontend/src/pages/LoginPage.jsx` (replaces placeholder), form/validation logic, calls through `frontend/src/api/client.js` (`apiFetch`, `setAuthToken`, `getAuthToken`); add a route-guarding mechanism (e.g. a `RequireAuth` wrapper) used in `App.jsx` for `onboarding`/`dashboard`.
- **Database**: none — reuses the existing `users` table (`email`, `password_hash`) added by the registration change.
- **No breaking changes** — all affected surfaces are currently unimplemented placeholders or unprotected routes.
