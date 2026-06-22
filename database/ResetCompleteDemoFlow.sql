-- Return the dedicated demo account to a brand-new verified-student state.
-- Login: student.flow@unibus.local / Password123!
-- The identity, university link and VERIFIED status remain intact.

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

DELETE FROM notifications
WHERE recipient_user_id = (
    SELECT user_id
    FROM users
    WHERE email = 'student.flow@unibus.local'
);

COMMIT;
