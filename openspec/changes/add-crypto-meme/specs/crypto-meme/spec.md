## Purpose

Provides the dashboard's Fun Crypto Meme section: a randomly selected crypto-themed meme (image + caption) drawn from a static curated list on each dashboard load. Covers Jira PM-17 (story), PM-44 (static JSON meme list), and PM-45 (meme section UI with random selection).

## ADDED Requirements

### Requirement: Fun Crypto Meme section shows a random meme
The system SHALL provide a Fun Crypto Meme section displaying one meme, consisting of an image and a caption, randomly selected from a static curated list.

#### Scenario: Meme displayed on dashboard load
- **WHEN** an authenticated user views the dashboard
- **THEN** the Fun Crypto Meme section displays one meme's image and caption from the curated list

#### Scenario: Random selection varies across loads
- **WHEN** the authenticated user loads the dashboard multiple times
- **THEN** the meme returned may differ between loads, drawn from the same curated list

### Requirement: Meme content is not personalized
The system SHALL select the displayed meme without regard to the authenticated user's saved preferences (`assetsOfInterest`, investor type, or content types).

#### Scenario: Same curated list regardless of preferences
- **WHEN** two different authenticated users with different saved preferences each view the dashboard
- **THEN** both users' Fun Crypto Meme sections draw from the same curated meme list

### Requirement: Unauthenticated access rejected
The system SHALL reject unauthenticated requests for meme content with an authentication error and return no meme data.

#### Scenario: Unauthenticated request rejected
- **WHEN** an unauthenticated request is made to the meme endpoint
- **THEN** the system rejects it with an authentication error and returns no meme

### Requirement: Fun Crypto Meme section loads independently
The system SHALL load and render the Fun Crypto Meme section independently of any other dashboard section, such that its own loading or error state never blocks or is blocked by another section.

#### Scenario: Meme is slow to load
- **WHEN** the Fun Crypto Meme data takes longer to load than other dashboard content
- **THEN** the Fun Crypto Meme section shows its own loading state without delaying the rest of the dashboard
