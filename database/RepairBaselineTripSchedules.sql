BEGIN;

WITH baseline AS (
  SELECT DISTINCT t.route_id, t.bus_id, t.driver_id, t.conductor_id,
         EXTRACT(ISODOW FROM t.service_date)::int AS weekday_number,
         CASE substring(t.notes from ':([1-4])$')
           WHEN '1' THEN TIME '06:30' WHEN '2' THEN TIME '09:00'
           WHEN '3' THEN TIME '14:00' WHEN '4' THEN TIME '17:30'
         END AS departure_time
  FROM trips t
  WHERE t.schedule_id IS NULL
    AND t.notes ~ '^DEMO_DATA:BASELINE:.*:[1-4]$'
)
INSERT INTO bus_schedules(route_id,bus_id,driver_id,conductor_id,weekday_number,departure_time,status,assigned_at)
SELECT b.route_id,b.bus_id,b.driver_id,b.conductor_id,b.weekday_number,b.departure_time,'ACTIVE',CURRENT_TIMESTAMP
FROM baseline b
WHERE b.departure_time IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM bus_schedules s
    WHERE s.route_id=b.route_id AND s.bus_id=b.bus_id AND s.driver_id=b.driver_id
      AND s.conductor_id=b.conductor_id AND s.weekday_number=b.weekday_number
      AND s.departure_time=b.departure_time
  );

UPDATE trips t
SET schedule_id=s.schedule_id
FROM bus_schedules s
WHERE t.schedule_id IS NULL
  AND t.notes ~ '^DEMO_DATA:BASELINE:.*:[1-4]$'
  AND s.route_id=t.route_id AND s.bus_id=t.bus_id AND s.driver_id=t.driver_id
  AND s.conductor_id=t.conductor_id
  AND s.weekday_number=EXTRACT(ISODOW FROM t.service_date)::int
  AND s.departure_time=CASE substring(t.notes from ':([1-4])$')
    WHEN '1' THEN TIME '06:30' WHEN '2' THEN TIME '09:00'
    WHEN '3' THEN TIME '14:00' WHEN '4' THEN TIME '17:30' END;

COMMIT;
