## 1. Backend login endpoint (PM-29)

- [x] 1.1 Add a small `email`/`password` presence validator (or extend the existing validator module) for `POST /auth/login`
- [x] 1.2 Add `POST /auth/login` to `backend/src/routes/auth.js`: look up the user by normalized email, compare `password` against `password_hash` with `bcrypt.compare`
- [x] 1.3 On missing user or password mismatch, return a 401 with a generic invalid-credentials error (identical message/shape for both cases)
- [x] 1.4 On success, sign a JWT the same way as signup (`jwt.sign({ sub: user.id }, config.jwtSecret, ...)`) and return it with the public user profile (id, email, name)
- [x] 1.5 Add/update backend tests covering: successful login, missing field, unknown email, wrong password

## 2. Backend auth middleware (PM-31)

- [x] 2.1 Create `backend/src/middleware/auth.js` exporting a middleware that reads `Authorization: Bearer <token>`, verifies it with `jwt.verify(token, config.jwtSecret)`, and attaches `req.user = { id: payload.sub }`
- [x] 2.2 Return 401 (via the existing `asyncHandler`/error-handling convention) when the header is missing, malformed, or the token fails verification (invalid signature or expired)
- [x] 2.3 Apply the middleware to the routes designated as protected, wired through `backend/src/routes/index.js`
- [x] 2.4 Add backend tests covering: missing token, malformed token, expired/invalid-signature token, valid token reaching the handler

## 3. Login form UI (PM-30)

- [x] 3.1 Replace the `frontend/src/pages/LoginPage.jsx` placeholder with a form (email, password fields) using local component state
- [x] 3.2 Add client-side validation (required fields) that blocks submission and shows inline errors per field
- [x] 3.3 On submit, call the login endpoint via `apiFetch` from `frontend/src/api/client.js`
- [x] 3.4 On success, store the returned token via `setAuthToken` and navigate to the originally requested page (or `/dashboard` if none)
- [x] 3.5 On failure, display the server-returned invalid-credentials error, preserving the user's entered email

## 4. Frontend route guarding (PM-32)

- [x] 4.1 Add a `RequireAuth` wrapper component that checks `getAuthToken()` and either renders its children or redirects to `/login` (preserving the intended destination)
- [x] 4.2 Apply `RequireAuth` around the `onboarding` and `dashboard` routes in `frontend/src/App.jsx`
- [x] 4.3 Confirm `apiFetch` continues to attach the stored token automatically to requests made from protected pages (already implemented — verify, no change expected)

## 5. Verification

- [x] 5.1 Manually exercise the full flow: submit login form with valid credentials → token stored → redirected to dashboard
- [x] 5.2 Manually verify invalid-credentials path surfaces the correct message in the UI without leaking whether the email exists
- [x] 5.3 Manually verify visiting `/dashboard` or `/onboarding` while logged out redirects to `/login`, and a protected backend route rejects requests without a valid token
- [x] 5.4 Run `openspec validate add-user-login --strict` and fix any reported issues
