## Purpose

Provides the dashboard's Market News section: crypto news headlines fetched from an external source and filtered by the authenticated user's saved interests, with a safe fallback when that source is unavailable. Covers Jira PM-14 (story), PM-38 (backend CryptoPanic integration + static fallback), and PM-39 (news section UI).

## ADDED Requirements

### Requirement: Market News section filtered by assets of interest
The system SHALL provide a Market News section showing crypto news headlines filtered by the authenticated user's saved `assetsOfInterest`, sourced from the CryptoPanic API.

#### Scenario: News available for saved assets
- **WHEN** the user has saved `assetsOfInterest` and the news source returns headlines for at least one of them
- **THEN** the Market News section displays those headlines, each with a title and a link to its source

#### Scenario: No saved preferences yet
- **WHEN** the authenticated user has no saved preferences
- **THEN** the Market News section displays general, unfiltered headlines rather than an empty or error state

#### Scenario: Unauthenticated access rejected
- **WHEN** an unauthenticated request is made to the Market News endpoint
- **THEN** the system rejects it with an authentication error and returns no headlines

### Requirement: Static fallback when the news source is unavailable
The system SHALL display a static, curated list of fallback headlines when the CryptoPanic API call fails, times out, is rate-limited, or is unconfigured, instead of an error or empty state.

#### Scenario: News source unavailable falls back to static content
- **WHEN** the CryptoPanic API request fails, is rate-limited, or times out
- **THEN** the Market News section displays the static fallback headlines instead of an error state

#### Scenario: News source unconfigured
- **WHEN** the CryptoPanic API key/base URL is not configured
- **THEN** the Market News section displays the static fallback headlines without attempting a live API call

### Requirement: Market News section loads independently
The system SHALL load and render the Market News section independently of any other dashboard section, such that its own loading, success, or fallback state never blocks or is blocked by another section.

#### Scenario: News is slow to load
- **WHEN** the Market News data takes longer to load than other dashboard content
- **THEN** the Market News section shows its own loading state without delaying the rest of the dashboard
