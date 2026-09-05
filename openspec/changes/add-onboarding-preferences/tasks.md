## 1. Backend save endpoint (PM-33)

- [x] 1.1 Add a small validator for `POST /preferences` requiring `assetsOfInterest`, `investorType`, and `contentTypes`
- [x] 1.2 Create `backend/src/routes/preferences.js` exporting `createPreferencesRouter(pool, config)`
- [x] 1.3 Add `POST /preferences` behind `requireAuth(config)`: upsert into the existing `preferences` table via `INSERT ... ON CONFLICT (user_id) DO UPDATE SET settings = ...`, storing `{ assetsOfInterest, investorType, contentTypes }` in the `settings` jsonb column
- [x] 1.4 On missing required field(s), return a 400 with an error identifying which field(s) are missing, without writing to the table
- [x] 1.5 On success, respond with a 2xx status and the saved preferences
- [x] 1.6 Add backend tests covering: first-time save, resubmission overwriting prior answers, missing field, unauthenticated request

## 2. Backend fetch endpoint (PM-34)

- [x] 2.1 Add `GET /preferences` to `backend/src/routes/preferences.js` behind `requireAuth(config)`: look up the `preferences` row by `req.user.id`
- [x] 2.2 On no saved row, respond with a 404 status
- [x] 2.3 On a saved row, respond with a 2xx status containing the stored `assetsOfInterest`, `investorType`, and `contentTypes`
- [x] 2.4 Wire `createPreferencesRouter(pool, config)` into `backend/src/routes/index.js` alongside `createAuthRouter`
- [x] 2.5 Add backend tests covering: preferences already saved, no preferences saved yet, unauthenticated request

## 3. Onboarding quiz UI (PM-35)

- [x] 3.1 Replace the `frontend/src/pages/OnboardingPage.jsx` placeholder with a form presenting three questions: crypto assets of interest (multi-select/checkboxes), investor type (single-select/radio), content type preferences (multi-select/checkboxes)
- [x] 3.2 Add client-side validation that blocks submission and shows an inline message when any question is left unanswered
- [x] 3.3 On submit, call `POST /preferences` via `apiFetch` from `frontend/src/api/client.js`
- [x] 3.4 On success, navigate the user to `/dashboard`

## 4. Post-login redirect logic (PM-36)

- [x] 4.1 After a successful login in `frontend/src/pages/LoginPage.jsx`, call `GET /preferences` before navigating: on 404 navigate to `/onboarding`, on 2xx navigate to `/dashboard` (or the originally requested page)
- [x] 4.2 Guard direct navigation to `/onboarding`: if `GET /preferences` returns a 2xx (preferences already saved), redirect to `/dashboard` instead of showing the quiz again
- [x] 4.3 Handle the in-flight `GET /preferences` check with a minimal loading state so neither page flashes before the redirect decision is made

## 5. Verification

- [x] 5.1 Manually exercise the full flow: log in as a first-time user → redirected to onboarding → complete quiz → redirected to dashboard
- [x] 5.2 Manually verify a returning user (preferences already saved) is redirected straight to the dashboard on login and when navigating directly to `/onboarding`
- [x] 5.3 Manually verify submitting the onboarding quiz with a question unanswered blocks submission and shows a validation message
- [x] 5.4 Manually verify `POST /preferences` and `GET /preferences` both reject requests without a valid token
- [x] 5.5 Run `openspec validate add-onboarding-preferences --strict` and fix any reported issues
