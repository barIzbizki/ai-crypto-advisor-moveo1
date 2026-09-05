## Purpose

Lets a registered user authenticate with their email and password, receive an auth token, and reach protected pages, while unauthenticated users and requests are blocked from them. Covers Jira PM-11 (story), PM-29 (backend endpoint), PM-30 (login UI), PM-31 (auth middleware), and PM-32 (frontend route guarding).

## ADDED Requirements

### Requirement: Login endpoint authenticates valid credentials
The system SHALL expose `POST /auth/login` that accepts `email` and `password`, verifies the password against the stored hash for that email, and returns an auth token and the user's public profile on success.

#### Scenario: Successful login
- **WHEN** a client submits `POST /auth/login` with an email that has a registered account and the correct password for that account
- **THEN** the system responds with a 2xx status containing an auth token and the user's public profile (id, email, name)

### Requirement: Login rejects invalid credentials
The system SHALL reject `POST /auth/login` with a 401 status and a generic invalid-credentials error when the email does not match a registered account or the password does not match the stored hash, without indicating which of the two was wrong.

#### Scenario: Unknown email
- **WHEN** a client submits `POST /auth/login` with an email that has no registered account
- **THEN** the system responds with a 401 status and a generic invalid-credentials error, not indicating whether the email exists

#### Scenario: Wrong password
- **WHEN** a client submits `POST /auth/login` with an email that has a registered account but an incorrect password
- **THEN** the system responds with a 401 status and the same generic invalid-credentials error used for an unknown email

### Requirement: Login input validation
The system SHALL validate that `email` and `password` are present on `POST /auth/login` and reject the request with a 400 status before checking credentials if either is missing.

#### Scenario: Missing required field
- **WHEN** a client submits `POST /auth/login` missing `email` or `password`
- **THEN** the system responds with a 400 status and an error identifying which field(s) are missing, without querying stored credentials

### Requirement: Protected backend routes require a valid token
The system SHALL protect designated backend routes with authentication middleware that verifies the `Authorization: Bearer <token>` auth token, rejecting the request with a 401 status when the token is missing, malformed, expired, or otherwise invalid.

#### Scenario: Missing token
- **WHEN** a client sends a request to a protected route with no `Authorization` header
- **THEN** the system responds with a 401 status and does not execute the route handler

#### Scenario: Invalid or expired token
- **WHEN** a client sends a request to a protected route with an `Authorization` header containing a malformed, tampered, or expired token
- **THEN** the system responds with a 401 status and does not execute the route handler

#### Scenario: Valid token
- **WHEN** a client sends a request to a protected route with a valid, unexpired token issued by the system
- **THEN** the system executes the route handler with the authenticated user's identity available to it

### Requirement: Login form UI
The system SHALL provide a login page at `/login` with fields for email and password that submits to the login endpoint and only allows submission once client-side validation passes.

#### Scenario: Client-side validation blocks incomplete submission
- **WHEN** a user attempts to submit the login form with a missing email or password
- **THEN** the form displays an inline validation error next to the offending field(s) and does not send a request to the backend

#### Scenario: Successful login redirects the user
- **WHEN** a user submits a complete login form and the backend responds successfully
- **THEN** the frontend stores the returned auth token and navigates the user to the page they were trying to reach, or to the dashboard if none was specified

### Requirement: Login form displays authentication errors
The system SHALL display a user-visible error message on the login page when the backend rejects a login submission, without losing the user's already-entered email.

#### Scenario: Backend reports invalid credentials
- **WHEN** the login endpoint responds with an invalid-credentials error
- **THEN** the login page displays a message telling the user their email or password is incorrect, and retains the entered email

### Requirement: Frontend route guarding for protected pages
The system SHALL prevent an unauthenticated user from viewing a protected frontend page (onboarding, dashboard) by redirecting them to `/login`, and SHALL allow a request to reach the page once an auth token is present.

#### Scenario: Unauthenticated access redirected to login
- **WHEN** a user with no stored auth token navigates directly to a protected route
- **THEN** the frontend redirects them to `/login` instead of rendering the protected page

#### Scenario: Authenticated access allowed
- **WHEN** a user with a stored auth token navigates to a protected route
- **THEN** the frontend renders the protected page and includes the token on any API requests it makes
