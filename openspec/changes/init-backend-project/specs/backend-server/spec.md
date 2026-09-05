## Purpose

Provides the running Node/Express HTTP server that hosts the API: request routing, environment-based configuration, and a consistent baseline for handling errors.

## ADDED Requirements

### Requirement: Application startup
The system SHALL start an HTTP server that listens on a configurable port and responds to requests once initialization completes.

#### Scenario: Server starts successfully
- **WHEN** the backend process is started with a valid configuration
- **THEN** the server binds to the configured port and begins accepting HTTP requests

#### Scenario: Server fails fast on invalid configuration
- **WHEN** the backend process is started with missing or invalid required configuration (e.g. no database connection string)
- **THEN** the process SHALL exit with a non-zero status and log a clear error identifying the missing/invalid configuration, instead of starting in a broken state

### Requirement: Environment-based configuration
The system SHALL load its configuration (port, database connection info, environment name) from environment variables, with distinct values supported per environment (e.g. local development vs. test).

#### Scenario: Configuration loaded from environment
- **WHEN** the server starts with environment variables set for port and database connection
- **THEN** the server uses those values instead of hard-coded defaults

#### Scenario: Sensible local defaults
- **WHEN** the server starts with no environment variables set, in a local development context
- **THEN** the server SHALL fall back to documented default values so it can run locally without additional setup

### Requirement: Request routing
The system SHALL route incoming HTTP requests to the appropriate handler based on method and path, and respond with a 404 for unmatched routes.

#### Scenario: Known route is handled
- **WHEN** a client sends a request matching a registered route and method
- **THEN** the corresponding handler processes the request and returns a response

#### Scenario: Unknown route returns 404
- **WHEN** a client sends a request to a path/method with no registered handler
- **THEN** the server responds with HTTP 404 and a structured error body

### Requirement: Baseline error handling
The system SHALL catch unhandled errors from request handlers and respond with a structured error response instead of crashing the process or leaking internal details.

#### Scenario: Handler throws an error
- **WHEN** a route handler throws an error or rejects a promise
- **THEN** the server responds with an appropriate HTTP error status (default 500) and a structured JSON error body, without exposing stack traces or internal details to the client

#### Scenario: Error is logged
- **WHEN** an unhandled error is caught by the baseline error handler
- **THEN** the system logs the error details server-side for debugging
