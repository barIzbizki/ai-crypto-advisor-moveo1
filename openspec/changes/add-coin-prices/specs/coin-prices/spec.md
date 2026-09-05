## Purpose

Provides the dashboard's Coin Prices section: current coin prices fetched from an external source and filtered by the authenticated user's saved interests, with an explicit error state when that source is unavailable. Covers Jira PM-15 (story), PM-40 (backend CoinGecko integration), and PM-41 (Coin Prices UI).

## ADDED Requirements

### Requirement: Coin Prices section filtered by assets of interest
The system SHALL provide a Coin Prices section showing current prices, sourced from the CoinGecko API, for the coins in the authenticated user's saved `assetsOfInterest`.

#### Scenario: Prices available for saved assets
- **WHEN** the user has saved `assetsOfInterest` and the price source returns prices for those coins
- **THEN** the Coin Prices section displays the current price for each of those coins

#### Scenario: No saved preferences yet
- **WHEN** the authenticated user has no saved preferences
- **THEN** the Coin Prices section displays current prices for a default set of coins rather than an empty or error state

#### Scenario: Unauthenticated access rejected
- **WHEN** an unauthenticated request is made to the Coin Prices endpoint
- **THEN** the system rejects it with an authentication error and returns no prices

### Requirement: Explicit error state when the price source is unavailable
The system SHALL display an explicit error/unavailable state when the CoinGecko API call fails, times out, or is rate-limited, instead of showing stale or fabricated prices.

#### Scenario: Price source unavailable
- **WHEN** the CoinGecko API request fails, is rate-limited, or times out
- **THEN** the Coin Prices section displays an explicit error/unavailable state instead of stale or fabricated prices

### Requirement: Coin Prices section loads independently
The system SHALL load and render the Coin Prices section independently of any other dashboard section, such that its own loading, success, or error state never blocks or is blocked by another section.

#### Scenario: Prices are slow to load
- **WHEN** the Coin Prices data takes longer to load than other dashboard content
- **THEN** the Coin Prices section shows its own loading state without delaying the rest of the dashboard
