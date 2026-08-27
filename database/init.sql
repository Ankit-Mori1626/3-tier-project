-- This runs automatically once, the first time the Postgres container starts,
-- because it's placed in /docker-entrypoint-initdb.d/ (see Dockerfile).
-- Django's migrations will create the actual app tables; this is just a placeholder
-- for anything you want pre-seeded (extensions, roles, etc).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
