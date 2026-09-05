## Why

The project has no backend yet. Before any feature work can happen, we need a running Node/Express server wired to a local PostgreSQL database with the initial schema in place, so the frontend has a real API to integrate against. This change covers Jira epic [PM-1](https://barizbizki1.atlassian.net/browse/PM-1) (Local Project Setup), story [PM-8](https://barizbizki1.atlassian.net/browse/PM-8) (Initialize backend project), and its subtasks [PM-21](https://barizbizki1.atlassian.net/browse/PM-21), [PM-22](https://barizbizki1.atlassian.net/browse/PM-22), and [PM-23](https://barizbizki1.atlassian.net/browse/PM-23).

## What Changes

- Scaffold a Node/Express application: project structure, routing layer, environment-based configuration, and a baseline error-handling middleware. (PM-21)
- Establish a local PostgreSQL connection and set up migration/schema tooling so schema changes are versioned and repeatable. (PM-22)
- Define the initial database schema: `users`, `preferences`, and `votes` tables, including their relationships and constraints. (PM-23)
- Deployment concerns are explicitly out of scope; this change only covers running the backend locally.

## Capabilities

### New Capabilities
- `backend-server`: Express application scaffold - project structure, routing, environment configuration, and baseline error handling. (PM-21)
- `database-connectivity`: Local PostgreSQL connection management and migration/schema tooling. (PM-22)
- `database-schema`: Initial relational schema for `users`, `preferences`, and `votes`. (PM-23)

### Modified Capabilities
- None (greenfield backend).

## Impact

- **Affected code**: New backend project directory (e.g. `backend/`), including `src/` (app entry, routes, middleware, config), migration files, and DB client setup.
- **Dependencies**: Node.js, Express, a PostgreSQL driver/ORM or query builder, and a migration tool (to be chosen in design.md).
- **Systems**: Requires a locally running PostgreSQL instance; no external/deployed infrastructure is touched.
- **Jira**: PM-8 and subtasks PM-21, PM-22, PM-23.
