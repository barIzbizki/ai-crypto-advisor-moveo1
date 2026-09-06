## Purpose

Generates and renders a short AI-written insight for the dashboard's AI Insight of the Day section, tailored to the user's saved investor type where available, backed by the Hugging Face Inference API with a static fallback on failure.

## ADDED Requirements

### Requirement: AI Insight of the Day tailored by investor type
The system SHALL provide a `GET /dashboard/insight` endpoint, behind authentication, that returns a short generated insight from the Hugging Face Inference API, tailored to the authenticated user's saved `investorType` where available.

#### Scenario: Insight generated for saved investor type
- **WHEN** an authenticated user with a saved `investorType` requests `GET /dashboard/insight`
- **THEN** the response contains a generated insight consistent with that investor type

#### Scenario: No saved preferences yet
- **WHEN** an authenticated user with no saved preferences requests `GET /dashboard/insight`
- **THEN** the response contains a generic, non-tailored insight rather than an empty result or an error

#### Scenario: Unauthenticated request rejected
- **WHEN** an unauthenticated request is made to `GET /dashboard/insight`
- **THEN** the system rejects it with an authentication error

### Requirement: Static fallback on LLM failure
The system SHALL serve a static fallback insight when the Hugging Face Inference API call fails, times out, is rate-limited, or its configuration is missing, rather than surfacing an error state.

#### Scenario: LLM provider unavailable or unconfigured
- **WHEN** the Hugging Face Inference API call fails, times out, is rate-limited, or `LLM_API_KEY`/`LLM_API_BASE_URL` is unconfigured
- **THEN** `GET /dashboard/insight` responds successfully with a static fallback insight instead of an error

### Requirement: AI Insight section UI
The system SHALL render an AI Insight of the Day section that fetches and displays the generated (or fallback) insight text, with independent loading and error states, so a slow or failed fetch never blocks other dashboard content.

#### Scenario: Insight loads successfully
- **WHEN** the AI Insight section's fetch of `GET /dashboard/insight` succeeds
- **THEN** the section displays the returned insight text

#### Scenario: Insight fetch is in progress
- **WHEN** the AI Insight section's fetch of `GET /dashboard/insight` has not yet resolved
- **THEN** the section displays a loading state instead of stale or empty content

#### Scenario: Insight fetch fails at the network/request level
- **WHEN** the AI Insight section's request to `GET /dashboard/insight` fails outright (e.g. network error), as opposed to the backend's own LLM-failure fallback
- **THEN** the section displays its own error state rather than the rest of the dashboard failing to render
