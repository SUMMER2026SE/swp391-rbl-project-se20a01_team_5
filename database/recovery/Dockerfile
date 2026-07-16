FROM postgres:17-alpine

COPY recovery/V6BaseSchema.sql recovery/OfficialUniversityMasterData.sql recovery/OfficialDanangTransportData.sql recovery/RecoveredSchemaCompatibility.sql recovery/NormalizeRecoveredTransportData.sql recovery/AuditRecoveredTransportData.sql /recovery/
COPY SeedDemoDataUntilAugust.sql AuditDemoDataUntilAugust.sql /recovery/
COPY recovery/recovery-entrypoint.sh /recovery/recovery-entrypoint.sh
RUN chmod +x /recovery/recovery-entrypoint.sh

ENTRYPOINT ["/recovery/recovery-entrypoint.sh"]
