#!/usr/bin/env bash
# =========================================================================
# InfiniteCareers PostgreSQL Initialization Script
# Executed automatically when PostgreSQL container starts
# =========================================================================

set -e

echo "🚀 [InfiniteCareers DB] Initializing PostgreSQL extensions & schema..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "btree_gist";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOSQL

echo "📄 [InfiniteCareers DB] Applying production DDL schema..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/schema/01_production_schema.sql

echo "🌱 [InfiniteCareers DB] Applying Indian workforce seed data..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seeds/01_indian_workforce_seed.sql

echo "✅ [InfiniteCareers DB] Database initialization completed successfully!"
