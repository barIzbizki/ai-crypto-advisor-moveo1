## Context

Greenfield backend - see proposal.md for motivation (Jira PM-8 and subtasks PM-21/22/23). No existing code or specs to reconcile with. Target environment for this change is local development only; deployment is out of scope (tracked separately under the Deployment epic).

## Goals / Non-Goals

**Goals:**
- A runnable Express backend with clear config, routing, and error-handling conventions to build features on top of.
- A repeatable way to create and evolve the PostgreSQL schema (migrations), starting with `users`, `preferences`, and `votes`.
- A schema that enforces its own integrity (uniqueness, foreign keys) at the database level, not just in application code.

**Non-Goals:**
- Authentication/authorization, request validation middleware, or business-logic routes - this change only establishes the scaffold and schema they'll sit on.
- Deployment, containerization, or CI/CD for the backend.
- Seed/fixture data beyond what's needed to verify migrations run.

## Decisions

- **Framework: Express.** Minimal, well-understood, matches the Jira description ("Node/Express"). Alternative considered: Fastify (faster, but adds learning overhead with no requirement driving the need for it here).
- **DB access: `pg` (node-postgres) with a small query/connection module, no full ORM initially.** Keeps the connectivity layer thin and matches the "connection + migration tooling" framing of PM-22, deferring an ORM decision until real query patterns exist. Alternative considered: Prisma/Sequelize - heavier, and would also dictate the migration tool; revisit once feature work shows the need.
- **Migrations: `node-pg-migrate`.** Plain SQL/JS migrations, tracks applied migrations in a table in the target database, no ORM lock-in. Alternative considered: Knex migrations - similar fit, `node-pg-migrate` chosen for being Postgres-specific and lighter.
- **Config: environment variables via `.env` for local dev (e.g. `dotenv`), validated at startup.** Matches the spec requirement to fail fast on invalid config. Alternative considered: a config file format (YAML/JSON) - env vars are simpler for local-only scope and match typical Node/Express convention.
- **Schema shape:** `users(id, email UNIQUE, created_at, ...)`, `preferences(id, user_id FK -> users, ...)`, `votes(id, user_id FK -> users, target, value, created_at, UNIQUE(user_id, target))`. Foreign keys enforce referential integrity per the database-schema spec; exact additional columns (beyond what the spec requires) are an implementation detail decided during the migration itself, not fixed here.

## Risks / Trade-offs

- [No ORM means more hand-written SQL as features grow] → Acceptable at this stage since scope is limited to setup; revisit if/when query complexity grows.
- [Env-var-only config can drift between local setups] → Mitigated by committing a `.env.example` with documented defaults.
- [Cascade vs. restrict on `preferences`/`votes` foreign keys affects delete behavior] → Decided per table during migration authoring (PM-22/PM-23 implementation); the spec only requires that orphaned rows never exist, not which specific referential action is used.
