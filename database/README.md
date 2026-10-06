# InfiniteCareers - Database Architecture

Production PostgreSQL multi-tenant database design for **InfiniteCareers** ATS, Recruitment, Hiring, Preboarding, and Employee Onboarding SaaS Platform.

## Features
- **Strict Multi-Tenancy**: `tenant_id` on every tenant-owned table with composite foreign keys.
- **Row-Level Security (RLS)**: Enforced isolation at PostgreSQL engine level via `app.current_tenant_id`.
- **UUID Primary Keys**: Uniform `gen_random_uuid()` identifiers across all entities.
- **Full Audit Trails**: `created_at`, `updated_at`, `created_by`, `updated_by` on all business records.
- **High-Performance Indexes**: GIN trigram indexes for candidate resume search, partial indexes on active records, and composite indexes for multi-tenant queries.
- **No Binary Blobs**: S3 / object storage URLs stored in DB with JSONB metadata schemas.

## Directory Structure
```
database/
├── schema/
│   └── 01_production_schema.sql      # Full DDL (55+ tables, views, RLS policies, indexes)
├── seeds/
│   └── 01_indian_workforce_seed.sql  # Multi-tenant enterprise seed dataset (Telugu, Kannada, Hindi)
├── migrations/
│   ├── V1__initial_schema.sql        # Flyway schema migration
│   └── V2__seed_enterprise_data.sql  # Flyway seed migration
└── init-db.sh                        # Docker container init script
```

## Running Manually via psql

```bash
# Connect and apply schema
psql "postgresql://postgres:postgrespassword@localhost:5432/infinitecareers" -f schema/01_production_schema.sql

# Seed data
psql "postgresql://postgres:postgrespassword@localhost:5432/infinitecareers" -f seeds/01_indian_workforce_seed.sql
```
