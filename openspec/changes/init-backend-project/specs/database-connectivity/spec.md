## Purpose

Provides a managed connection from the backend to a local PostgreSQL database, plus tooling to apply and track schema migrations in a repeatable, versioned way.

## ADDED Requirements

### Requirement: Database connection management
The system SHALL establish and manage a connection (or connection pool) to PostgreSQL using configuration supplied via environment variables, and SHALL make that connection available to request handlers.

#### Scenario: Successful connection on startup
- **WHEN** the backend starts with valid PostgreSQL connection configuration and the database is reachable
- **THEN** the system establishes a connection/pool and becomes ready to serve database-backed requests

#### Scenario: Database unreachable on startup
- **WHEN** the backend starts but the configured PostgreSQL instance is unreachable
- **THEN** the system SHALL fail startup with a clear error rather than silently serving requests that will fail on first database access

#### Scenario: Connection used per request
- **WHEN** a request handler needs to read or write data
- **THEN** it obtains a database connection from the shared pool rather than opening a new raw connection per request

### Requirement: Versioned schema migrations
The system SHALL provide tooling to apply database schema changes as ordered, versioned migrations, and to track which migrations have already been applied to a given database.

#### Scenario: Apply pending migrations
- **WHEN** the migration tool is run against a database that is missing one or more migrations
- **THEN** it applies the missing migrations in order and records each as applied

#### Scenario: Re-running migrations is a no-op
- **WHEN** the migration tool is run against a database where all migrations are already applied
- **THEN** it applies no changes and reports the database as up to date

#### Scenario: Migration failure stops the run
- **WHEN** a migration fails to apply (e.g. invalid SQL)
- **THEN** the tool SHALL stop, leave already-applied migrations recorded as applied, and report the failing migration clearly
