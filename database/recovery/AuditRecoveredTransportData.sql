WITH route_summary AS (
    SELECT count(*) FILTER (WHERE external_source = 'BUSMAP_DN') AS route_count,
           count(*) FILTER (WHERE external_source = 'BUSMAP_DN' AND status = 'ACTIVE') AS active_route_count
    FROM routes
), route_stop_summary AS (
    SELECT count(*) AS link_count, count(DISTINCT rs.route_id) AS covered_routes
    FROM route_stops rs JOIN routes r ON r.route_id = rs.route_id
    WHERE r.external_source = 'BUSMAP_DN'
), invalid_routes AS (
    SELECT count(*) AS invalid_count
    FROM routes r
    WHERE r.external_source = 'BUSMAP_DN'
      AND (r.route_code IS NULL OR btrim(r.route_code) = '' OR r.route_name IS NULL OR btrim(r.route_name) = ''
           OR (SELECT count(*) FROM route_stops rs WHERE rs.route_id = r.route_id) < 2)
), invalid_stops AS (
    SELECT count(*) AS invalid_count
    FROM stops s
    WHERE s.external_source = 'BUSMAP_DN'
      AND (s.stop_code IS NULL OR btrim(s.stop_code) = '' OR s.stop_name IS NULL OR btrim(s.stop_name) = ''
           OR lower(btrim(s.stop_name)) IN ('đại học việt', 'không xác định', 'chưa xác định')
           OR s.latitude IS NULL OR s.longitude IS NULL
           OR s.latitude NOT BETWEEN 15.5 AND 16.5 OR s.longitude NOT BETWEEN 107.5 AND 108.7)
), duplicate_orders AS (
    SELECT count(*) AS duplicate_count
    FROM (SELECT route_id, station_direction, stop_order FROM route_stops
          GROUP BY route_id, station_direction, stop_order HAVING count(*) > 1) duplicate_rows
), fake_routes AS (
    SELECT count(*) AS fake_count FROM routes WHERE route_code LIKE 'UB-DN-%'
), interregional_routes AS (
    SELECT count(*) AS interregional_count FROM routes WHERE external_source = 'BUSMAP_DN' AND is_interregional
), ordered_geometry AS (
    SELECT r.route_code, rs.path_points, s.latitude, s.longitude,
           lag(s.latitude) OVER route_order AS previous_latitude,
           lag(s.longitude) OVER route_order AS previous_longitude
    FROM route_stops rs
    JOIN routes r ON r.route_id = rs.route_id
    JOIN stops s ON s.stop_id = rs.stop_id
    WHERE r.external_source = 'BUSMAP_DN'
    WINDOW route_order AS (PARTITION BY rs.route_id, rs.station_direction ORDER BY rs.stop_order)
), gross_geometry_mismatches AS (
    SELECT count(*) AS mismatch_count
    FROM ordered_geometry
    WHERE previous_latitude IS NOT NULL
      AND (
          path_points IS NULL OR btrim(path_points) = ''
          OR abs(split_part(split_part(path_points, ' ', 1), ',', 1)::numeric - previous_longitude) > 0.02
          OR abs(split_part(split_part(path_points, ' ', 1), ',', 2)::numeric - previous_latitude) > 0.02
          OR abs(split_part(regexp_replace(btrim(path_points), '^.* ', ''), ',', 1)::numeric - longitude) > 0.02
          OR abs(split_part(regexp_replace(btrim(path_points), '^.* ', ''), ',', 2)::numeric - latitude) > 0.02
      )
)
SELECT 'BUSMAP routes' AS subject,
       CASE WHEN route_count = 19 AND active_route_count = 19 THEN 'PASS' ELSE 'FAIL' END AS status,
       concat('routes=', route_count, '; active=', active_route_count) AS detail FROM route_summary
UNION ALL SELECT 'BUSMAP route-stop coverage',
       CASE WHEN link_count = 837 AND covered_routes = 19 THEN 'PASS' ELSE 'FAIL' END,
       concat('links=', link_count, '; covered_routes=', covered_routes) FROM route_stop_summary
UNION ALL SELECT 'valid routes', CASE WHEN invalid_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('invalid=', invalid_count) FROM invalid_routes
UNION ALL SELECT 'valid stops', CASE WHEN invalid_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('invalid=', invalid_count) FROM invalid_stops
UNION ALL SELECT 'unique route stop order', CASE WHEN duplicate_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('duplicates=', duplicate_count) FROM duplicate_orders
UNION ALL SELECT 'no fake UB-DN routes', CASE WHEN fake_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('fake_routes=', fake_count) FROM fake_routes
UNION ALL SELECT 'no interregional routes', CASE WHEN interregional_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('interregional_routes=', interregional_count) FROM interregional_routes
UNION ALL SELECT 'route geometry alignment', CASE WHEN mismatch_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('gross_mismatches=', mismatch_count) FROM gross_geometry_mismatches
ORDER BY subject;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM stops WHERE stop_code = 'BUSMAP-DN-48659' AND stop_name <> 'Đại học Việt Hàn') THEN
        RAISE EXCEPTION 'BUSMAP-DN-48659 was not normalized.';
    END IF;
    IF EXISTS (SELECT 1 FROM routes WHERE route_code LIKE 'UB-DN-%') THEN
        RAISE EXCEPTION 'Fake UB-DN routes remain in recovered data.';
    END IF;
    IF EXISTS (SELECT 1 FROM routes WHERE external_source = 'BUSMAP_DN' AND is_interregional) THEN
        RAISE EXCEPTION 'Interregional routes remain in recovered data.';
    END IF;
END $$;
