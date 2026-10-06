#!/usr/bin/env bash
# =========================================================================
# InfiniteCareers PostgreSQL Automated Backup Script
# =========================================================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/infinitecareers_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "💾 Starting database backup to ${BACKUP_FILE}..."

docker exec -t infinitecareers-postgres pg_dump -U postgres -d infinitecareers | gzip > "$BACKUP_FILE"

echo "✅ Backup created successfully: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
