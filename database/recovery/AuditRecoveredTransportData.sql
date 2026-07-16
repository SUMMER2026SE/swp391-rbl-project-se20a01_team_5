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
)
SELECT 'BUSMAP routes' AS subject,
       CASE WHEN route_count = 25 AND active_route_count = 25 THEN 'PASS' ELSE 'FAIL' END AS status,
       concat('routes=', route_count, '; active=', active_route_count) AS detail FROM route_summary
UNION ALL SELECT 'BUSMAP route-stop coverage',
       CASE WHEN link_count = 1165 AND covered_routes = 25 THEN 'PASS' ELSE 'FAIL' END,
       concat('links=', link_count, '; covered_routes=', covered_routes) FROM route_stop_summary
UNION ALL SELECT 'valid routes', CASE WHEN invalid_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('invalid=', invalid_count) FROM invalid_routes
UNION ALL SELECT 'valid stops', CASE WHEN invalid_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('invalid=', invalid_count) FROM invalid_stops
UNION ALL SELECT 'unique route stop order', CASE WHEN duplicate_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('duplicates=', duplicate_count) FROM duplicate_orders
UNION ALL SELECT 'no fake UB-DN routes', CASE WHEN fake_count = 0 THEN 'PASS' ELSE 'FAIL' END,
       concat('fake_routes=', fake_count) FROM fake_routes
ORDER BY subject;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM stops WHERE stop_code = 'BUSMAP-DN-48659' AND stop_name <> 'Đại học Việt Hàn') THEN
        RAISE EXCEPTION 'BUSMAP-DN-48659 was not normalized.';
    END IF;
    IF EXISTS (SELECT 1 FROM routes WHERE route_code LIKE 'UB-DN-%') THEN
        RAISE EXCEPTION 'Fake UB-DN routes remain in recovered data.';
    END IF;
END $$;

