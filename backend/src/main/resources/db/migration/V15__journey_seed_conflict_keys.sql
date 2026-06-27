DROP INDEX IF EXISTS uq_routes_route_code_not_null;
DROP INDEX IF EXISTS uq_stops_stop_code_not_null;
DROP INDEX IF EXISTS uq_routes_route_code;
DROP INDEX IF EXISTS uq_stops_stop_code;

CREATE UNIQUE INDEX IF NOT EXISTS uq_routes_route_code
    ON routes(route_code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_stops_stop_code
    ON stops(stop_code);
