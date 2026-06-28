-- Reset the shared demo transport dataset before seeding canonical routes/stops.
-- Requires a fresh RDS snapshot before execution.
-- Keeps users, students, universities, roles, and staff identities.

BEGIN;

DELETE FROM invoices;
DELETE FROM payments;
DELETE FROM travel_history;
DELETE FROM monthly_passes;
DELETE FROM single_trip_tickets;
DELETE FROM tb_transactions;
DELETE FROM tb_orders;
DELETE FROM route_registrations;

DELETE FROM vehicle_locations;
DELETE FROM feedback;
DELETE FROM driver_ratings;
DELETE FROM incidents;
DELETE FROM internal_messages;
DELETE FROM lost_item_reports;
DELETE FROM trips;
DELETE FROM bus_schedules;

DELETE FROM daily_statistics;
DELETE FROM notification_campaigns;
DELETE FROM fare_changes;
DELETE FROM fares;
DELETE FROM route_universities;
DELETE FROM route_stops;

DELETE FROM routes;
DELETE FROM stops;

COMMIT;
