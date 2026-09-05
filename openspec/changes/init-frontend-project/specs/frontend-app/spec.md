## Purpose

Provides the React application scaffold and client-side routing that every frontend page and feature is built on top of.

## ADDED Requirements

### Requirement: Application scaffold
The system SHALL provide a runnable React application with a defined project structure (entry point, pages/routes, shared components) that can be started for local development.

#### Scenario: Application starts successfully
- **WHEN** the frontend development server is started
- **THEN** the application compiles without errors and is reachable in a browser at the configured local URL

### Requirement: Client-side routing
The system SHALL provide client-side routes for `login`, `signup`, `onboarding`, and `dashboard`, each rendering a distinct page.

#### Scenario: Navigating to a known route
- **WHEN** a user navigates to `/login`, `/signup`, `/onboarding`, or `/dashboard`
- **THEN** the application renders the corresponding page without a full page reload

#### Scenario: Navigating to an unknown route
- **WHEN** a user navigates to a path that does not match any registered route
- **THEN** the application renders a not-found state instead of a blank page or crash
