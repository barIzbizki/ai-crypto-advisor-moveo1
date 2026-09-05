## Purpose

Defines the initial relational data model - users, their preferences, and their votes - and the integrity constraints the database enforces on that data.

## ADDED Requirements

### Requirement: Users table
The system SHALL persist one record per user, uniquely identifiable, with a unique email address.

#### Scenario: User created with unique email
- **WHEN** a user record is inserted with an email address not already in use
- **THEN** the record is persisted and can be retrieved by its identifier

#### Scenario: Duplicate email rejected
- **WHEN** a user record is inserted with an email address that already exists in the users table
- **THEN** the database rejects the insert with a uniqueness constraint violation

### Requirement: Preferences table
The system SHALL persist preferences associated with exactly one user, and SHALL NOT allow a preferences record to reference a non-existent user.

#### Scenario: Preferences created for an existing user
- **WHEN** a preferences record is inserted referencing a valid, existing user
- **THEN** the record is persisted and associated with that user

#### Scenario: Preferences rejected for missing user
- **WHEN** a preferences record is inserted referencing a user id that does not exist
- **THEN** the database rejects the insert with a foreign key constraint violation

#### Scenario: User deletion cascades or is blocked
- **WHEN** a user with an existing preferences record is deleted
- **THEN** the database either removes the associated preferences record or blocks the deletion, per the defined referential action, rather than leaving an orphaned preferences record

### Requirement: Votes table
The system SHALL persist votes cast by users, each vote associated with exactly one user, and SHALL NOT allow a vote to reference a non-existent user.

#### Scenario: Vote recorded for an existing user
- **WHEN** a vote record is inserted referencing a valid, existing user
- **THEN** the record is persisted with its associated user and vote value/target

#### Scenario: Vote rejected for missing user
- **WHEN** a vote record is inserted referencing a user id that does not exist
- **THEN** the database rejects the insert with a foreign key constraint violation

#### Scenario: Duplicate vote handling
- **WHEN** a user attempts to cast more than one vote on the same target where only one vote per user per target is allowed
- **THEN** the database rejects the duplicate insert with a uniqueness constraint violation
