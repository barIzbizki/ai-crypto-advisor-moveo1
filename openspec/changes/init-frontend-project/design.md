## Context

Greenfield frontend - see proposal.md for motivation (Jira PM-9 and subtasks PM-24/25/26). No existing frontend code or specs to reconcile with. The backend ([PM-8](https://barizbizki1.atlassian.net/browse/PM-8), `backend/`) already runs locally on `PORT=3000` and exposes `GET /health` returning `{status: 'ok'}` - this change targets that as its integration point. Target environment is local development only; deployment/production builds are out of scope (tracked separately).

## Goals / Non-Goals

**Goals:**
- A runnable React app with routing conventions (`login`, `signup`, `onboarding`, `dashboard`) to build features on top of.
- A single, shared way to call the backend (base URL + auth token handling) so feature code doesn't hand-roll `fetch` calls.
- Verified, working communication between frontend and backend when both run locally.

**Non-Goals:**
- Real authentication flows (actual login/signup logic, token issuance) - PM-25 only covers the client-side mechanics of attaching a token that already exists; obtaining/refreshing tokens is separate feature work.
- Visual design system, styling framework, or componen­t library choice beyond what's needed for a basic shell.
- Production builds, deployment, or CI/CD for the frontend.

## Decisions

- **Framework: React, bundled with Vite.** Matches the Jira description ("React app") and is the fastest path to a working local dev server with hot reload. Alternative considered: Create React App - unmaintained; Next.js - brings server-side routing/rendering concerns that aren't needed for a local SPA at this stage.
- **Routing: `react-router-dom`.** De facto standard client-side router for React SPAs, directly matches the "routing: login, signup, onboarding, dashboard" framing of PM-24. Alternative considered: hand-rolled route switch on `window.location` - reinvents URL matching, nested layouts, and not-found handling for no benefit.
- **API client: a thin wrapper module around `fetch`**, not a full data-fetching library. Centralizes the base URL and auth-token-attachment logic in one place per the frontend-shell spec, without committing to caching/retry semantics before real feature requirements exist. Alternative considered: React Query/SWR - adds caching and request-state management that's premature before there are real data-fetching screens to justify it; can be layered on top of this client later without changing the spec.
- **Config: Vite env variables (`VITE_API_BASE_URL`) for the API base URL, defaulting to `http://localhost:3000` in local dev.** Matches the backend's default local port and mirrors the backend's env-var-based config approach. Alternative considered: a runtime-fetched config file - unnecessary indirection for a local-only SPA.
- **Auth token storage: browser storage (e.g. `localStorage`), read by the API client on each request.** Simplest mechanism that satisfies "attach token if present" without introducing a state-management library dependency; the spec only requires attach-if-present behavior, not a specific storage backend, so this can change later without a spec change.
- **Integration verification (PM-26): a visible element on the dashboard (or a dedicated debug view) that calls `GET /health` on load and displays the result.** Gives a concrete, observable way to confirm the two run together, matching the local-integration spec's scenarios, without building a full feature around it.
- **Backend CORS support (discovered during implementation): added the `cors` middleware to `backend/`, allowing a configurable `CORS_ORIGIN` (defaulting to the frontend's local dev origin, `http://localhost:5173`).** The browser blocks cross-origin `fetch` calls without response CORS headers, so the local-integration "backend reachable" scenario could not otherwise pass. This touches `backend/`, which is outside this change's original declared impact, but is required for PM-26 to be genuinely verifiable rather than assumed.

## Risks / Trade-offs

- [No data-fetching library means no built-in caching/retry as real API calls are added] → Acceptable at this stage since scope is limited to setup; revisit (e.g. adopt React Query) once real data-fetching screens exist.
- [Token in `localStorage` is readable by any script on the page (XSS exposure)] → Acceptable for local-only scope with no real auth issuance yet; revisit storage choice when real authentication is implemented.
- [Hard-coded local default base URL could mask misconfiguration in other environments] → Mitigated by keeping the default explicit and documented (mirrors backend's `.env.example` pattern), and by this change being local-only in scope.
