## Purpose

Provides the application shell/layout shared across pages and the API client used to communicate with the backend, including how requests are targeted and authenticated.

## ADDED Requirements

### Requirement: Application shell
The system SHALL render a shared layout (e.g. header/navigation and content area) around every page so common UI is not duplicated per page.

#### Scenario: Shell renders around a page
- **WHEN** any registered route is rendered
- **THEN** the shared layout is displayed around that page's content

### Requirement: Configurable API base URL
The system SHALL send API requests to a base URL read from build/environment configuration rather than a hard-coded value.

#### Scenario: Base URL from configuration
- **WHEN** the frontend is built or started with an API base URL configured
- **THEN** the API client sends requests to that base URL

#### Scenario: Sensible local default
- **WHEN** the frontend is started with no API base URL configured, in a local development context
- **THEN** the API client SHALL fall back to a documented local default so it can run against a locally running backend without additional setup

### Requirement: Auth token attached to requests
The system SHALL attach a stored authentication token, when present, to outgoing API requests, and SHALL omit it when no token is stored.

#### Scenario: Token present
- **WHEN** an auth token is stored and the API client makes a request to a backend endpoint that requires authentication
- **THEN** the request includes the stored token

#### Scenario: No token stored
- **WHEN** no auth token is stored and the API client makes a request
- **THEN** the request is sent without an authentication token
