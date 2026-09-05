## Why

New visitors currently have no way to create an account: the backend exposes only a `/health` route and the frontend's `/signup` route is a static placeholder. Without registration, no other authenticated flow (login, onboarding, dashboard) can be exercised end-to-end. This change implements Jira story [PM-10] "User registration", covering its two subtasks: [PM-27] (backend signup endpoint) and [PM-28] (signup page UI).

## What Changes

- Add a `POST /auth/signup` backend endpoint that accepts email, name, and password, validates input, hashes the password, persists a new user row, and rejects duplicate emails (PM-27).
- Extend the `users` table (migration) with `name` and `password_hash` columns to support the above.
- Build out the `/signup` frontend page with a real form (name, email, password, confirm password), client-side validation, submission to the new endpoint, and display of server-side error responses (e.g. duplicate email, validation failures) (PM-28).
- On successful signup, store the returned auth token via the existing `frontend/src/api/client.js` token helpers and redirect to onboarding.

## Capabilities

### New Capabilities
- `user-registration`: End-to-end email/name/password signup — backend validation, password hashing, duplicate-email rejection, and the signup form UI with client- and server-side error display. Covers PM-10, PM-27, and PM-28 in one spec.

### Modified Capabilities
<!-- none: no existing openspec/specs/ capability changes behavior -->

## Impact

- **Backend**: new route module (e.g. `backend/src/routes/auth.js`), a password-hashing dependency (e.g. `bcrypt`), a new migration adding `name`/`password_hash` to `users`, wiring into `backend/src/routes/index.js`.
- **Frontend**: `frontend/src/pages/SignupPage.jsx` (replaces placeholder), form/validation logic, calls through `frontend/src/api/client.js` (`apiFetch`, `setAuthToken`), routing already exists in `App.jsx`.
- **Database**: `users` table schema change (additive columns) via a new node-pg-migrate migration.
- **No breaking changes** — all affected surfaces are currently unimplemented placeholders.
