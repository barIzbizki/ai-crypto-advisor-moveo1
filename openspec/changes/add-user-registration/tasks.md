## 1. Database (supports PM-27)

- [x] 1.1 Add a new node-pg-migrate migration adding `name` (text, not null) and `password_hash` (text, not null) columns to `users`
- [x] 1.2 Run `migrate:up` locally and confirm `migrate:down` cleanly reverts

## 2. Backend signup endpoint (PM-27)

- [x] 2.1 Add `bcrypt` and `jsonwebtoken` to `backend/package.json`
- [x] 2.2 Create `backend/src/routes/auth.js` exporting a router with `POST /auth/signup`
- [x] 2.3 Validate `email`, `name`, `password` (presence, email format, minimum password length); return 400 with field-level errors on failure
- [x] 2.4 Hash the password with bcrypt before insert; never log or return the raw password or hash
- [x] 2.5 Insert the new user; on unique-constraint violation for `email`, return 409 with a duplicate-email error (no user record created)
- [x] 2.6 On success, sign a JWT for the new user and return it with the public user profile (id, email, name) in the response body
- [x] 2.7 Wire the new router into `backend/src/routes/index.js`
- [x] 2.8 Add/update backend tests covering: successful signup, missing field, malformed email, short password, duplicate email

## 3. Signup form UI (PM-28)

- [x] 3.1 Replace the `frontend/src/pages/SignupPage.jsx` placeholder with a form (name, email, password, confirm password fields) using local component state
- [x] 3.2 Add client-side validation (required fields, email format, password/confirmation match) that blocks submission and shows inline errors per field
- [x] 3.3 On submit, call the signup endpoint via `apiFetch` from `frontend/src/api/client.js`
- [x] 3.4 On success, store the returned token via `setAuthToken` and navigate to `/onboarding`
- [x] 3.5 On failure, display the server-returned error (duplicate email or field-level validation) next to the relevant field/form, preserving the user's entered values

## 4. Verification

- [x] 4.1 Manually exercise the full flow: submit signup form → new user in `users` table → token stored → redirected to onboarding
- [x] 4.2 Manually verify duplicate-email and validation-error paths surface the correct message in the UI
- [x] 4.3 Run `openspec validate add-user-registration --strict` and fix any reported issues
