#!/usr/bin/env bash
# ==============================================================================
# Lahana Resort PMS — Automated Production Database Backup Script
# ==============================================================================
# Executed via daily cron: 0 3 * * * /bin/bash /opt/lahana/scripts/backup.sh
# ==============================================================================

set -euo pipefail

# Directories & Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/lahana_pms_backup_${TIMESTAMP}.sql.gz"

# Ensure the backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "Starting database backup at $(date)"

# Perform pg_dump inside postgres container and compress it
# Reads environment variables (POSTGRES_DB, POSTGRES_USER) set in docker-compose
if docker ps --format '{{.Names}}' | grep -q "^db$"; then
    echo "Exporting PostgreSQL dump from 'db' container..."
    docker exec -t db pg_dumpall -U lahana_user | gzip > "${BACKUP_FILE}"
    echo "Database backup successfully saved to: ${BACKUP_FILE}"
else
    echo "ERROR: PostgreSQL container 'db' is not running!" >&2
    exit 1
fi

# Clean up backups older than the retention days
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "lahana_pms_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "Database backup and cleanup completed successfully at $(date)"
