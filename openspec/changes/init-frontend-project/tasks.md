## 1. React app scaffold & routing (PM-24)

- [x] 1.1 Initialize frontend project with Vite + React (`package.json`, directory structure: `src/`, `src/pages/`, `src/components/`, `src/api/`)
- [x] 1.2 Add `react-router-dom` and configure the router with routes for `/login`, `/signup`, `/onboarding`, `/dashboard`
- [x] 1.3 Create placeholder page components for each route
- [x] 1.4 Add a not-found route/component for unmatched paths

## 2. Application shell & API client (PM-25)

- [x] 2.1 Build a shared layout component (header/navigation + content area) wrapping all routed pages
- [x] 2.2 Create an API client module wrapping `fetch`, reading the base URL from `VITE_API_BASE_URL` with a local default (`http://localhost:3000`)
- [x] 2.3 Commit a `.env.example` documenting `VITE_API_BASE_URL` and its local default
- [x] 2.4 Implement auth token storage/retrieval (e.g. `localStorage`) and have the API client attach it to outgoing requests when present, omit it otherwise

## 3. Local frontend-backend integration (PM-26)

- [x] 3.1 Add a health-check call on the dashboard (or a dedicated debug view) that calls the backend's `GET /health` via the API client on load
- [x] 3.2 Display the health-check result (healthy status) in the running application
- [x] 3.3 Handle the backend-unreachable case by surfacing an error state instead of hanging or crashing
- [x] 3.4 Add CORS support to the backend (`cors` middleware, configurable `CORS_ORIGIN`, defaulting to the frontend's local dev origin) - discovered during verification: browsers block the cross-origin request without it, so the "backend reachable" scenario cannot pass otherwise

## 4. Verification

- [x] 4.1 Start the backend locally, then start the frontend locally, and confirm both are reachable in a browser
- [x] 4.2 Confirm navigating to `/login`, `/signup`, `/onboarding`, `/dashboard` renders the corresponding page, and an unknown path renders the not-found state (frontend-app spec)
- [x] 4.3 Confirm the dashboard's health check reflects a successful `GET /health` call while the backend is running (local-integration spec)
- [x] 4.4 Stop the backend and confirm the frontend surfaces an error state instead of hanging (local-integration spec)
