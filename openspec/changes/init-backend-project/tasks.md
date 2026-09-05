## 1. Backend scaffold (PM-21)

- [x] 1.1 Initialize backend project (`package.json`, directory structure: `src/`, `src/routes/`, `src/config/`, `src/middleware/`)
- [x] 1.2 Add Express and set up the app entry point with a basic health-check route
- [x] 1.3 Implement environment-based configuration loading (`.env` + validation), including a fail-fast check for required variables
- [x] 1.4 Commit a `.env.example` documenting all configuration variables and local defaults
- [x] 1.5 Implement the routing layer (router registration, 404 handler for unmatched routes)
- [x] 1.6 Implement baseline error-handling middleware (structured JSON error responses, server-side logging, no stack traces leaked to clients)

## 2. Database connectivity & migration tooling (PM-22)

- [x] 2.1 Add PostgreSQL client dependency (`pg`) and a connection/pool module read from environment configuration
- [x] 2.2 Fail backend startup with a clear error when the database is unreachable or misconfigured
- [x] 2.3 Add migration tool dependency (`node-pg-migrate`) and wire up npm scripts to create/run/rollback migrations
- [x] 2.4 Verify migrations tracking table is created and re-running migrations against an up-to-date database is a no-op

## 3. Initial database schema (PM-23)

- [x] 3.1 Write migration for `users` table (unique identifier, unique `email`, timestamps)
- [x] 3.2 Write migration for `preferences` table (foreign key to `users`, referential action on user deletion)
- [x] 3.3 Write migration for `votes` table (foreign key to `users`, uniqueness constraint on `(user_id, target)`)
- [x] 3.4 Run migrations against a local PostgreSQL instance and verify constraint behavior (duplicate email rejected, orphaned preferences/votes rejected, duplicate vote rejected)

## 4. Verification

- [x] 4.1 Start the backend locally end-to-end (server boots, connects to DB, health-check route responds)
- [x] 4.2 Confirm invalid/missing configuration causes startup to fail with a clear error (backend-server + database-connectivity specs)
- [x] 4.3 Confirm unknown routes return 404 and a thrown handler error returns a structured error response
