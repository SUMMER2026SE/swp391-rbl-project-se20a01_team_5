-- Data QA for the map-first Da Nang journey planner.
-- Expected: zero rows in the *_issues result sets before demo.

SELECT 'missing_stop_coordinates' AS check_name, COUNT(*) AS issue_count
FROM stops
WHERE status = 'ACTIVE'
  AND external_source = 'BUSMAP_DN'
  AND (latitude IS NULL OR longitude IS NULL);

SELECT 'routes_without_shape_points' AS check_name, r.route_code, r.route_name
FROM routes r
WHERE r.external_source = 'BUSMAP_DN'
  AND r.status = 'ACTIVE'
  AND NOT EXISTS (
      SELECT 1
      FROM route_stops rs
      WHERE rs.route_id = r.route_id
        AND rs.path_points IS NOT NULL
        AND trim(rs.path_points) <> ''
  )
ORDER BY r.route_code;

SELECT 'duplicate_route_codes' AS check_name, route_code, COUNT(*) AS issue_count
FROM routes
WHERE route_code IS NOT NULL
GROUP BY route_code
HAVING COUNT(*) > 1;

SELECT 'duplicate_stop_codes' AS check_name, stop_code, COUNT(*) AS issue_count
FROM stops
WHERE stop_code IS NOT NULL
GROUP BY stop_code
HAVING COUNT(*) > 1;

SELECT 'route_stop_order_gaps' AS check_name, r.route_code, rs.station_direction,
       COUNT(*) AS stop_count, MIN(rs.stop_order) AS min_order, MAX(rs.stop_order) AS max_order
FROM route_stops rs
JOIN routes r ON r.route_id = rs.route_id
WHERE r.external_source = 'BUSMAP_DN'
GROUP BY r.route_code, rs.station_direction
HAVING COUNT(*) <> MAX(rs.stop_order) - MIN(rs.stop_order) + 1
ORDER BY r.route_code, rs.station_direction;

SELECT 'planner_published_routes' AS check_name, COUNT(*) AS route_count
FROM routes
WHERE external_source = 'BUSMAP_DN'
  AND status = 'ACTIVE'
  AND is_interregional = false;

SELECT 'interregional_hidden_by_default' AS check_name, route_code, route_name
FROM routes
WHERE external_source = 'BUSMAP_DN'
  AND is_interregional = true
ORDER BY route_code;
