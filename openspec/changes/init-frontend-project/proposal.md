## Why

The project has a running backend ([PM-8](https://barizbizki1.atlassian.net/browse/PM-8)) but no frontend yet. Before any feature work can happen, we need a scaffolded React application with its core routes in place and a working API client, so the frontend can talk to the real backend instead of being built in isolation. This change covers Jira story [PM-9](https://barizbizki1.atlassian.net/browse/PM-9) (Initialize frontend project) and its subtasks [PM-24](https://barizbizki1.atlassian.net/browse/PM-24), [PM-25](https://barizbizki1.atlassian.net/browse/PM-25), and [PM-26](https://barizbizki1.atlassian.net/browse/PM-26).

## What Changes

- Scaffold a React application with client-side routing for `login`, `signup`, `onboarding`, and `dashboard` pages. (PM-24)
- Build a basic application shell/layout and an API client module with a configurable base URL and auth token handling (attaching a stored token to outgoing requests). (PM-25)
- Verify the frontend and backend run together locally and can successfully communicate (frontend calls the backend's `GET /health` endpoint and reflects the result). (PM-26)
- Deployment and production build concerns are explicitly out of scope; this change only covers running the frontend locally against the local backend.

## Capabilities

### New Capabilities
- `frontend-app`: React application scaffold - project structure and client-side routing for login, signup, onboarding, and dashboard pages. (PM-24)
- `frontend-shell`: Application shell/layout and an API client with configurable base URL and auth token handling. (PM-25)
- `local-integration`: Local frontend-backend integration - the frontend successfully reaches the backend's health endpoint when both are run together locally. (PM-26)

### Modified Capabilities
- None (greenfield frontend).

## Impact

- **Affected code**: New frontend project directory (e.g. `frontend/`), including `src/` (app entry, routes/pages, layout components, API client module).
- **Dependencies**: React, a client-side router (to be chosen in design.md), and an HTTP client for the API layer.
- **Systems**: Requires the local backend (`backend/`, see [PM-8](https://barizbizki1.atlassian.net/browse/PM-8)) running locally on its configured port for integration verification; no external/deployed infrastructure is touched.
- **Jira**: PM-9 and subtasks PM-24, PM-25, PM-26.
