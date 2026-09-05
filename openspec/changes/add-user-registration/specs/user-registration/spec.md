## Purpose

Lets a new visitor create an account with an email, name, and password, so they can subsequently authenticate and reach onboarding/dashboard. Covers Jira PM-10 (story), PM-27 (backend endpoint), and PM-28 (signup UI).

## ADDED Requirements

### Requirement: Signup endpoint accepts valid registrations
The system SHALL expose `POST /auth/signup` that accepts `email`, `name`, and `password`, creates a new user with a securely hashed password, and returns an authenticated session token for the new user.

#### Scenario: Successful signup
- **WHEN** a client submits `POST /auth/signup` with a well-formed, unused email, a non-empty name, and a password meeting the minimum length policy
- **THEN** the system creates a new user record with the password stored only as a salted hash (never in plaintext), and responds with a 2xx status containing an auth token and the new user's public profile (id, email, name)

### Requirement: Signup input validation
The system SHALL validate `email`, `name`, and `password` on `POST /auth/signup` and reject the request with a 4xx status and a machine-readable error before creating any user record if validation fails.

#### Scenario: Missing required field
- **WHEN** a client submits `POST /auth/signup` missing `email`, `name`, or `password`
- **THEN** the system responds with a 400 status and an error response identifying which field(s) are invalid, and no user record is created

#### Scenario: Malformed email
- **WHEN** a client submits `POST /auth/signup` with a value in `email` that is not a valid email address
- **THEN** the system responds with a 400 status and an error indicating the email is invalid, and no user record is created

#### Scenario: Password below minimum length
- **WHEN** a client submits `POST /auth/signup` with a `password` shorter than the system's minimum length policy
- **THEN** the system responds with a 400 status and an error indicating the password does not meet the policy, and no user record is created

### Requirement: Duplicate email rejection
The system SHALL reject `POST /auth/signup` when the submitted email already belongs to an existing user, without disclosing which other account fields collided.

#### Scenario: Email already registered
- **WHEN** a client submits `POST /auth/signup` with an email that already exists on another user account
- **THEN** the system responds with a 409 status and an error indicating the email is already in use, and no duplicate user record is created

### Requirement: Signup form UI
The system SHALL provide a signup page at `/signup` with fields for name, email, password, and password confirmation, that submits to the signup endpoint and only allows submission once client-side validation passes.

#### Scenario: Client-side validation blocks incomplete submission
- **WHEN** a user attempts to submit the signup form with a missing field, an invalid email format, or a password/confirmation mismatch
- **THEN** the form displays an inline validation error next to the offending field(s) and does not send a request to the backend

#### Scenario: Successful signup redirects the user
- **WHEN** a user submits a complete, valid signup form and the backend responds successfully
- **THEN** the frontend stores the returned auth token and navigates the user to the onboarding page

### Requirement: Signup form displays server-side errors
The system SHALL display a user-visible error message on the signup page when the backend rejects a signup submission, without losing the user's already-entered form input.

#### Scenario: Backend reports duplicate email
- **WHEN** the signup endpoint responds with a duplicate-email error
- **THEN** the signup page displays a message telling the user that email is already registered, and retains the name/email/password values the user had entered

#### Scenario: Backend reports validation failure
- **WHEN** the signup endpoint responds with a validation error for a field
- **THEN** the signup page displays that error next to the corresponding field
