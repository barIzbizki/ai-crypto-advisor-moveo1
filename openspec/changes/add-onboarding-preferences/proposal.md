## Why

New users can sign up and log in, but nothing captures their interests: the `preferences` table exists in the schema but no route reads or writes it, and `/onboarding` is a static placeholder reachable (or skippable) regardless of whether the user has already answered it. This change implements Jira story [PM-12] "Capture user preferences on first login", covering its four subtasks: [PM-33] (backend save endpoint), [PM-34] (backend fetch endpoint), [PM-35] (onboarding quiz UI), and [PM-36] (post-login redirect logic).

## What Changes

- Add a `POST /preferences` backend endpoint that accepts the authenticated user's assets of interest, investor type, and content type selections and upserts them into the existing `preferences` table (PM-33).
- Add a `GET /preferences` backend endpoint that returns the authenticated user's saved preferences, or a 404/empty result if none have been saved yet (PM-34).
- Build out the `/onboarding` frontend page with a 3-question quiz (crypto assets of interest, investor type, content type preferences) using simple form controls (checkboxes/radio/select), submitting to the new endpoint (PM-35).
- Add post-login redirect logic so a first-time login (no saved preferences) sends the user to `/onboarding`, while a returning user (preferences already saved) goes straight to `/dashboard` (PM-36).

## Capabilities

### New Capabilities
- `onboarding-preferences`: End-to-end first-login onboarding — backend endpoints to save and fetch a user's preferences (assets of interest, investor type, content types), the onboarding quiz UI, and post-login redirect logic that routes first-time users to onboarding and returning users to the dashboard. Covers PM-12, PM-33, PM-34, PM-35, and PM-36 in one spec.

### Modified Capabilities
<!-- none: no existing openspec/specs/ capability changes behavior -->

## Impact

- **Backend**: add `backend/src/routes/preferences.js` (or similar) exposing `POST /preferences` and `GET /preferences`, both protected by the existing `requireAuth` middleware; wire it into `backend/src/routes/index.js`.
- **Database**: none — reuses the existing `preferences` table (`user_id` unique FK to `users`, `settings` jsonb, `created_at`) already defined in `backend/migrations/1788636268349_create-preferences-table.js`.
- **Frontend**: replace the `frontend/src/pages/OnboardingPage.jsx` placeholder with a real quiz form; extend post-login navigation (in `LoginPage.jsx` and/or `RequireAuth.jsx`) to check for saved preferences via `GET /preferences` and redirect accordingly.
- **No breaking changes** — all affected surfaces are currently unimplemented placeholders or unused table/routes.
