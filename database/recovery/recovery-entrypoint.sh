#!/bin/sh
set -eu
export PGPASSWORD="$DB_PASSWORD"
PSQL="psql -v ON_ERROR_STOP=1 -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USERNAME -d ${DB_NAME:-unibus}"
case "${RECOVERY_MODE:-}" in
  base)
    $PSQL -f /recovery/V6BaseSchema.sql
    ;;
  data)
    $PSQL -f /recovery/RecoveredSchemaCompatibility.sql
    $PSQL -f /recovery/OfficialUniversityMasterData.sql
    $PSQL -f /recovery/OfficialDanangTransportData.sql
    $PSQL -f /recovery/NormalizeRecoveredTransportData.sql
    $PSQL -f /recovery/RepairRecoveredRouteGeometry.sql
    $PSQL -f /recovery/AuditRecoveredTransportData.sql
    $PSQL -f /recovery/SeedDemoDataUntilAugust.sql
    $PSQL -f /recovery/AuditDemoDataUntilAugust.sql | tee /tmp/demo-audit.log
    if grep -Eq '\|[[:space:]]*FAIL[[:space:]]*\|' /tmp/demo-audit.log; then
      echo 'Demo audit contains FAIL rows.' >&2
      exit 2
    fi
    ;;
  *)
    echo 'RECOVERY_MODE must be base or data.' >&2
    exit 64
    ;;
esac
