## Purpose

Provides the authenticated user's post-login dashboard: a fixed set of 4 content sections, each independently fetched and, where applicable, tailored using the user's saved preferences. Covers Jira PM-13 (story) and PM-37 (dashboard page rendering 4 fixed sections, using saved preferences to filter/tailor content).

## ADDED Requirements

### Requirement: Dashboard renders 4 fixed sections
The system SHALL render the `/dashboard` page, for an authenticated user, with exactly 4 fixed sections in this order: Market News, Coin Prices, AI Insight of the Day, and Fun Crypto Meme.

#### Scenario: Authenticated user views dashboard
- **WHEN** an authenticated user navigates to `/dashboard`
- **THEN** the page renders all 4 sections, in order: Market News, Coin Prices, AI Insight of the Day, Fun Crypto Meme

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/dashboard`
- **THEN** the system redirects them to the login page instead of rendering any section

### Requirement: Dashboard composes the Market News section
The system SHALL render the Market News slot of the dashboard using the `market-news` capability (Jira PM-14/PM-38/PM-39), rather than implementing its own news fetching/fallback logic.

#### Scenario: Market News slot renders the market-news capability's section
- **WHEN** an authenticated user views the dashboard
- **THEN** the Market News slot renders the section provided by the `market-news` capability, with its own independent loading/fallback behavior as defined in that capability's spec

### Requirement: Dashboard composes the Coin Prices section
The system SHALL render the Coin Prices slot of the dashboard using the `coin-prices` capability (Jira PM-15/PM-40/PM-41), rather than implementing its own CoinGecko integration/error-state logic.

#### Scenario: Coin Prices slot renders the coin-prices capability's section
- **WHEN** an authenticated user views the dashboard
- **THEN** the Coin Prices slot renders the section provided by the `coin-prices` capability, with its own independent loading/error behavior as defined in that capability's spec

### Requirement: Dashboard composes the AI Insight of the Day section
The system SHALL render the AI Insight of the Day slot of the dashboard using the `ai-insight` capability (Jira PM-16/PM-42/PM-43), rather than implementing its own Hugging Face integration/fallback logic.

#### Scenario: AI Insight slot renders the ai-insight capability's section
- **WHEN** an authenticated user views the dashboard
- **THEN** the AI Insight of the Day slot renders the section provided by the `ai-insight` capability, with its own independent loading/fallback behavior as defined in that capability's spec

### Requirement: Dashboard composes the Fun Crypto Meme section
The system SHALL render the Fun Crypto Meme slot of the dashboard using the `crypto-meme` capability (Jira PM-17/PM-44/PM-45), rather than implementing its own meme list/selection logic.

#### Scenario: Fun Crypto Meme slot renders the crypto-meme capability's section
- **WHEN** an authenticated user views the dashboard
- **THEN** the Fun Crypto Meme slot renders the section provided by the `crypto-meme` capability, with its own independent loading/error behavior as defined in that capability's spec

### Requirement: Sections fail independently
The system SHALL load each of the 4 dashboard sections independently, such that a failure or delay in one section's data source does not prevent the other sections from rendering.

#### Scenario: One data source fails
- **WHEN** exactly one of the 4 sections' backing data sources fails
- **THEN** that section displays its own fallback/error state while the other 3 sections render normally

#### Scenario: One data source is slow
- **WHEN** one section's data takes longer to load than the others
- **THEN** the other sections render as soon as their own data is ready, without waiting for the slow section
