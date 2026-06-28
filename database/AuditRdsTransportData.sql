-- UniBus RDS transport data audit.
-- Read-only diagnostics for demo/AI route-stop cleanup.

SELECT 'flyway_latest_success' AS check_name,
       COALESCE((
           SELECT version
           FROM flyway_schema_history
           WHERE success = TRUE
           ORDER BY installed_rank DESC
           LIMIT 1
       ), 'none') AS value
FROM flyway_schema_history
WHERE success = TRUE;

SELECT 'routes_total' AS check_name, COUNT(*)::TEXT AS value FROM routes;
SELECT 'routes_active' AS check_name, COUNT(*)::TEXT AS value FROM routes WHERE status = 'ACTIVE';
SELECT 'routes_missing_code' AS check_name, COUNT(*)::TEXT AS value
FROM routes
WHERE status = 'ACTIVE'
  AND (route_code IS NULL OR trim(route_code) = '');
SELECT 'routes_demo_or_seed_like' AS check_name, COUNT(*)::TEXT AS value
FROM routes
WHERE status = 'ACTIVE'
  AND (
      route_name ILIKE '%demo%'
      OR route_name ILIKE 'Tuyến số %'
      OR COALESCE(description, '') ILIKE '%demo seed%'
      OR COALESCE(description, '') ILIKE '%prototype fidelity%'
      OR COALESCE(description, '') ILIKE '%iteration%'
      OR COALESCE(description, '') ILIKE '%iter%'
  );

SELECT 'stops_total' AS check_name, COUNT(*)::TEXT AS value FROM stops;
SELECT 'stops_active' AS check_name, COUNT(*)::TEXT AS value FROM stops WHERE status = 'ACTIVE';
SELECT 'stops_missing_code' AS check_name, COUNT(*)::TEXT AS value
FROM stops
WHERE status = 'ACTIVE'
  AND (stop_code IS NULL OR trim(stop_code) = '');
SELECT 'stops_demo_or_seed_like' AS check_name, COUNT(*)::TEXT AS value
FROM stops
WHERE status = 'ACTIVE'
  AND (
      COALESCE(description, '') ILIKE '%demo seed%'
      OR COALESCE(description, '') ILIKE '%prototype fidelity%'
      OR COALESCE(description, '') ILIKE '%iteration%'
      OR COALESCE(description, '') ILIKE '%iter%'
  );

SELECT 'route_stops_total' AS check_name, COUNT(*)::TEXT AS value FROM route_stops;
SELECT 'active_routes_with_less_than_two_stops' AS check_name, COUNT(*)::TEXT AS value
FROM (
    SELECT r.route_id
    FROM routes r
    LEFT JOIN route_stops rs ON rs.route_id = r.route_id
    WHERE r.status = 'ACTIVE'
    GROUP BY r.route_id
    HAVING COUNT(rs.route_stop_id) < 2
) broken;

SELECT 'duplicate_route_stop_order' AS check_name, COUNT(*)::TEXT AS value
FROM (
    SELECT route_id, stop_order
    FROM route_stops
    GROUP BY route_id, stop_order
    HAVING COUNT(*) > 1
) dup;

SELECT 'duplicate_stop_code' AS check_name, COUNT(*)::TEXT AS value
FROM (
    SELECT stop_code
    FROM stops
    WHERE stop_code IS NOT NULL
    GROUP BY stop_code
    HAVING COUNT(*) > 1
) dup;

SELECT 'active_fares' AS check_name, COUNT(*)::TEXT AS value
FROM fares
WHERE effective_until IS NULL;

SELECT 'active_routes_missing_single_or_monthly_fare' AS check_name, COUNT(*)::TEXT AS value
FROM routes r
WHERE r.status = 'ACTIVE'
  AND (
      NOT EXISTS (
          SELECT 1 FROM fares f
          WHERE f.route_id = r.route_id
            AND f.fare_type = 'SINGLE'
            AND f.effective_until IS NULL
      )
      OR NOT EXISTS (
          SELECT 1 FROM fares f
          WHERE f.route_id = r.route_id
            AND f.fare_type = 'MONTHLY'
            AND f.effective_until IS NULL
      )
  );

SELECT 'active_route_universities' AS check_name, COUNT(*)::TEXT AS value
FROM route_universities
WHERE status = 'ACTIVE';

SELECT 'student_flow_exists' AS check_name, COUNT(*)::TEXT AS value
FROM users
WHERE email = 'student.flow@unibus.local';

SELECT 'student_flow_transactional_rows' AS check_name,
       (
           (SELECT COUNT(*) FROM route_registrations WHERE student_code = 'SV-FLOW-001')
         + (SELECT COUNT(*) FROM monthly_passes WHERE student_code = 'SV-FLOW-001')
         + (SELECT COUNT(*) FROM single_trip_tickets WHERE student_code = 'SV-FLOW-001')
         + (SELECT COUNT(*) FROM payments WHERE student_code = 'SV-FLOW-001')
         + (SELECT COUNT(*) FROM invoices WHERE student_code = 'SV-FLOW-001')
         + (SELECT COUNT(*) FROM travel_history WHERE student_code = 'SV-FLOW-001')
       )::TEXT AS value;

SELECT r.route_code,
       r.route_name,
       r.status,
       COUNT(DISTINCT rs.route_stop_id) AS stop_count,
       BOOL_OR(f.fare_type = 'SINGLE' AND f.effective_until IS NULL) AS has_single_fare,
       BOOL_OR(f.fare_type = 'MONTHLY' AND f.effective_until IS NULL) AS has_monthly_fare
FROM routes r
LEFT JOIN route_stops rs ON rs.route_id = r.route_id
LEFT JOIN fares f ON f.route_id = r.route_id
WHERE r.status = 'ACTIVE'
GROUP BY r.route_id, r.route_code, r.route_name, r.status
ORDER BY r.route_code NULLS LAST, r.route_id;
