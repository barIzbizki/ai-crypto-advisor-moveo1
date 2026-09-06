## Purpose

Lets an authenticated user record their own thumbs up/down reaction to any dashboard section (or a specific item within one), and see that reaction reflected back on the dashboard. Covers Jira PM-18 (story), PM-46 (votes schema), PM-47 (backend `POST /votes`), and PM-48 (thumbs up/down UI on all 4 sections).

## ADDED Requirements

### Requirement: Cast a vote on a dashboard target
The system SHALL let an authenticated user record a thumbs up (`+1`) or thumbs down (`-1`) vote for a given target identifying a dashboard section or a specific item within one.

#### Scenario: First vote on a target
- **WHEN** an authenticated user casts a vote (up or down) on a target they have not voted on before
- **THEN** the system records the vote and returns the resulting vote state for that target

#### Scenario: Invalid vote value rejected
- **WHEN** a vote request is submitted with a value other than up or down (e.g. `0`, `5`, a string)
- **THEN** the system rejects the request with a validation error and does not record a vote

#### Scenario: Unauthenticated request rejected
- **WHEN** a vote is submitted without a valid Authorization token
- **THEN** the system rejects the request with an authentication error and does not record a vote

### Requirement: Changing or retracting a vote
The system SHALL let a user change an existing vote on a target to the opposite value, and retract it by casting the same value again, such that each user holds at most one active vote per target.

#### Scenario: Changing a vote
- **WHEN** a user who previously voted down on a target casts an up vote on the same target
- **THEN** the system replaces the stored vote with the up vote

#### Scenario: Retracting a vote
- **WHEN** a user casts the same vote value they already have recorded for a target
- **THEN** the system removes the user's vote for that target, leaving them with no active vote on it

### Requirement: Read current vote state for dashboard targets
The system SHALL let an authenticated user retrieve their current vote (up, down, or none) for one or more targets, so the dashboard can display the correct state on load.

#### Scenario: Fetching vote state for known targets
- **WHEN** an authenticated user requests vote state for a set of targets, some of which they have voted on and some they have not
- **THEN** the system returns the recorded value for each voted target and indicates no vote for the rest

#### Scenario: Unauthenticated read rejected
- **WHEN** a request for vote state is made without a valid Authorization token
- **THEN** the system rejects it with an authentication error and returns no vote data

### Requirement: Thumbs up/down control on every dashboard section
The system SHALL display a thumbs up/down control on each of the dashboard's sections (Market News, Coin Prices, AI Insight, Crypto Meme), reflecting the authenticated user's current vote for that section's target and allowing them to cast, change, or retract it without leaving the dashboard.

#### Scenario: Voting from a section
- **WHEN** a user selects thumbs up or thumbs down on a dashboard section
- **THEN** the section's control immediately reflects the selected state and the vote is recorded for that section's target

#### Scenario: Vote state restored on reload
- **WHEN** a user who previously voted on a section reloads the dashboard
- **THEN** that section's control shows their existing vote rather than a neutral/unvoted state

#### Scenario: Voting on one section does not affect others
- **WHEN** a user votes on one dashboard section
- **THEN** the vote controls on the other three sections are unaffected
