-- Reset only the transactional state for the dedicated complete-flow account.
-- The student remains VERIFIED and linked to UniBus Demo University.
-- After running this file, log in as student.flow@unibus.local / Password123!
-- and demonstrate route registration followed by SePay order creation.

BEGIN;

DELETE FROM invoices
WHERE payment_id IN (
    SELECT payment_id
    FROM payments
    WHERE student_code = 'SV-FLOW-001'
);

DELETE FROM payments
WHERE student_code = 'SV-FLOW-001';

DELETE FROM travel_history
WHERE student_code = 'SV-FLOW-001';

DELETE FROM monthly_passes
WHERE student_code = 'SV-FLOW-001';

DELETE FROM single_trip_tickets
WHERE student_code = 'SV-FLOW-001';

DELETE FROM tb_transactions
WHERE matched_order_id IN (
    SELECT id
    FROM tb_orders
    WHERE student_code = 'SV-FLOW-001'
);

DELETE FROM tb_orders
WHERE student_code = 'SV-FLOW-001';

DELETE FROM route_registrations
WHERE student_code = 'SV-FLOW-001';

COMMIT;
