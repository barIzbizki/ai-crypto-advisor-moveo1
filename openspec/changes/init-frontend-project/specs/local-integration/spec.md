## Purpose

Confirms that the frontend and backend can be run together on a local machine and can actually communicate, so integration is verified rather than assumed.

## ADDED Requirements

### Requirement: Frontend reaches the local backend
When the frontend is run locally against a locally running backend, the system SHALL successfully call the backend's health endpoint and reflect the result in the application.

#### Scenario: Backend is reachable
- **WHEN** the frontend and backend are both running locally and the frontend calls the backend's `GET /health` endpoint
- **THEN** the frontend receives a successful response and reflects the healthy status somewhere observable in the running application

#### Scenario: Backend is unreachable
- **WHEN** the frontend is running locally but the backend is not reachable
- **THEN** the frontend surfaces the failure (e.g. an error state) instead of hanging indefinitely or crashing
