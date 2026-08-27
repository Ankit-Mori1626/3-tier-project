FROM postgres:15-alpine

# Values below are defaults; override via env vars / Kubernetes Secret at runtime.
ENV POSTGRES_DB=appdb \
    POSTGRES_USER=appuser \
    POSTGRES_PASSWORD=apppassword

COPY init.sql /docker-entrypoint-initdb.d/init.sql

EXPOSE 5432
