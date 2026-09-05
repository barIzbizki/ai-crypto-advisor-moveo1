## Purpose

Captures a user's crypto assets of interest, investor type, and content type preferences once after their first login, persists them, and uses their presence to route the user to onboarding or straight to the dashboard on future logins. Covers Jira PM-12 (story), PM-33 (save endpoint), PM-34 (fetch endpoint), PM-35 (onboarding quiz UI), and PM-36 (post-login redirect logic).

## ADDED Requirements

### Requirement: Save endpoint persists user preferences
The system SHALL expose `POST /preferences`, protected by authentication, that accepts the authenticated user's assets of interest, investor type, and content type selections and persists them as that user's preferences, replacing any previously saved values.

#### Scenario: First-time save
- **WHEN** an authenticated user with no previously saved preferences submits `POST /preferences` with valid selections for assets of interest, investor type, and content types
- **THEN** the system persists the selections as that user's preferences and responds with a 2xx status

#### Scenario: Resubmission overwrites prior answers
- **WHEN** an authenticated user who already has saved preferences submits `POST /preferences` again with different selections
- **THEN** the system replaces the previously saved preferences with the new selections and responds with a 2xx status

#### Scenario: Unauthenticated request rejected
- **WHEN** a request to `POST /preferences` has no valid auth token
- **THEN** the system responds with a 401 status and does not persist anything

#### Scenario: Missing required selection
- **WHEN** an authenticated user submits `POST /preferences` missing one of assets of interest, investor type, or content types
- **THEN** the system responds with a 400 status identifying which selection(s) are missing, without persisting partial data

### Requirement: Fetch endpoint returns saved preferences
The system SHALL expose `GET /preferences`, protected by authentication, that returns the authenticated user's previously saved preferences, or an explicit not-found response if none have been saved yet.

#### Scenario: Preferences already saved
- **WHEN** an authenticated user who has previously submitted preferences requests `GET /preferences`
- **THEN** the system responds with a 2xx status containing their saved assets of interest, investor type, and content type selections

#### Scenario: No preferences saved yet
- **WHEN** an authenticated user who has never submitted preferences requests `GET /preferences`
- **THEN** the system responds with a 404 status (or equivalent explicit empty result) rather than an error

#### Scenario: Unauthenticated request rejected
- **WHEN** a request to `GET /preferences` has no valid auth token
- **THEN** the system responds with a 401 status

### Requirement: Onboarding quiz UI
The system SHALL provide an onboarding page at `/onboarding` presenting three questions — crypto assets of interest, investor type, and content type preferences — using selectable form controls, and SHALL submit the answers to the save endpoint only once all three are answered.

#### Scenario: Incomplete quiz blocks submission
- **WHEN** a user attempts to submit the onboarding quiz having left one or more of the three questions unanswered
- **THEN** the page displays a validation message and does not submit the request

#### Scenario: Completed quiz is saved
- **WHEN** a user answers all three onboarding questions and submits
- **THEN** the frontend calls the save endpoint with the user's selections and, on success, navigates the user to `/dashboard`

### Requirement: Post-login redirect based on saved preferences
The system SHALL determine, immediately after a successful login, whether the user has saved preferences and SHALL redirect a user with none to `/onboarding` and a user with saved preferences to `/dashboard`.

#### Scenario: First-time login redirects to onboarding
- **WHEN** a user logs in successfully and the fetch endpoint indicates no saved preferences exist for them
- **THEN** the frontend navigates the user to `/onboarding` instead of `/dashboard`

#### Scenario: Returning user skips onboarding
- **WHEN** a user logs in successfully and the fetch endpoint returns previously saved preferences for them
- **THEN** the frontend navigates the user directly to `/dashboard`, bypassing the onboarding quiz

#### Scenario: Direct navigation to onboarding after completion
- **WHEN** a user who already has saved preferences navigates directly to `/onboarding`
- **THEN** the frontend redirects them to `/dashboard` instead of showing the quiz again
