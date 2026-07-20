param(
    [string]$AuthFile = (Join-Path $PSScriptRoot '..\dbauth.txt'),
    [string]$DbHost = $env:UNIBUS_DB_HOST,
    [int]$Port = $(if ($env:UNIBUS_DB_PORT) { [int]$env:UNIBUS_DB_PORT } else { 5432 }),
    [string]$Database = $(if ($env:UNIBUS_DB_NAME) { $env:UNIBUS_DB_NAME } else { 'unibus' }),
    [string]$Username = $env:UNIBUS_DB_USERNAME,
    [string]$Password = $env:UNIBUS_DB_PASSWORD,
    [switch]$AllowProduction,
    [string]$ConfirmPhrase
)

$ErrorActionPreference = 'Stop'

if (Test-Path -LiteralPath $AuthFile) {
    Get-Content -LiteralPath $AuthFile | ForEach-Object {
        if ($_ -match '^\s*([^:#]+):\s*(.+?)\s*$') {
            switch ($matches[1].Trim().ToLowerInvariant()) {
                'endpoint' { if (-not $DbHost) { $DbHost = $matches[2].Trim() } }
                'port' { $Port = [int]$matches[2].Trim() }
                'initialdb' { $Database = $matches[2].Trim() }
                'username' { if (-not $Username) { $Username = $matches[2].Trim() } }
                'password' { if (-not $Password) { $Password = $matches[2].Trim() } }
            }
        }
    }
}

$DbHost = ([string]$DbHost).Replace('jdbc:postgresql://', '').Split('/')[0].Split(':')[0]
if (-not $DbHost -or -not $Username -or -not $Password) { throw 'Missing database connection values.' }
if ($Database -ne 'unibus') { throw "Refusing database '$Database'; expected 'unibus'." }
$isProduction = $DbHost.EndsWith('.rds.amazonaws.com')
if ($isProduction -and -not $AllowProduction) { throw 'RDS detected. Add -AllowProduction to continue.' }
$requiredPhrase = if ($isProduction) { 'RESET DEMO PRODUCTION' } else { 'RESET DEMO' }
$confirmation = if ($ConfirmPhrase) { $ConfirmPhrase } else { Read-Host "Type '$requiredPhrase' to continue" }
if ($confirmation -ne $requiredPhrase) { throw 'Confirmation mismatch; database was not changed.' }
Write-Host "Target database: host=$DbHost; port=$Port; database=$Database; user=$Username"

$sql = @'
SET TIME ZONE 'Asia/Ho_Chi_Minh';
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('unibus-cross-role-practice-reset'));

DO $reset$
DECLARE
    v_student_code text := '27211200001';
    v_student_user_id integer;
    v_dispatcher_user_id integer;
    v_schedule_ids integer[];
    v_preserved_history_id integer;
BEGIN
    SELECT user_id INTO STRICT v_student_user_id FROM users WHERE email = 'student.supported@unibus.local';
    SELECT user_id INTO STRICT v_dispatcher_user_id FROM users WHERE email = 'dispatcher.demo@unibus.local';

    SELECT array_agg(DISTINCT bs.schedule_id) INTO v_schedule_ids
    FROM bus_schedules bs
    LEFT JOIN trips t ON t.schedule_id = bs.schedule_id
    WHERE bs.assigned_by_user_id = v_dispatcher_user_id
      AND (t.service_date >= CURRENT_DATE - 1 OR (t.trip_id IS NULL AND bs.assigned_at >= CURRENT_TIMESTAMP - INTERVAL '2 days'));

    SELECT th.travel_history_id INTO v_preserved_history_id
    FROM travel_history th
    WHERE th.student_code = v_student_code
      AND th.trip_id NOT IN (
          SELECT trip_id FROM trips
          WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[]))
      )
    ORDER BY th.boarded_at NULLS LAST, th.travel_history_id
    LIMIT 1;

    DELETE FROM vehicle_locations WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM internal_messages WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM feedback WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM incidents WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM driver_ratings WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM lost_item_reports WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM travel_history
    WHERE trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])))
      AND travel_history_id IS DISTINCT FROM v_preserved_history_id;
    UPDATE single_trip_tickets SET used_on_trip_id = NULL, scanned_by_conductor_id = NULL
    WHERE used_on_trip_id IN (SELECT trip_id FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[])));
    DELETE FROM trips WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[]));
    DELETE FROM bus_schedules WHERE schedule_id = ANY(COALESCE(v_schedule_ids, ARRAY[]::integer[]));

    DELETE FROM notifications WHERE recipient_user_id = v_student_user_id OR sender_user_id = v_student_user_id;
    DELETE FROM lost_item_reports WHERE reported_by_user_id = v_student_user_id;
    DELETE FROM feedback WHERE student_code = v_student_code;
    DELETE FROM driver_ratings WHERE student_code = v_student_code;
    DELETE FROM travel_history
    WHERE student_code = v_student_code
      AND travel_history_id IS DISTINCT FROM v_preserved_history_id;
    DELETE FROM invoices WHERE student_code = v_student_code;
    DELETE FROM payments WHERE student_code = v_student_code;
    DELETE FROM monthly_passes WHERE student_code = v_student_code;
    DELETE FROM single_trip_tickets WHERE student_code = v_student_code;
    DELETE FROM tb_transactions WHERE matched_order_id IN (SELECT id FROM tb_orders WHERE student_code = v_student_code);
    DELETE FROM tb_orders WHERE student_code = v_student_code;
    DELETE FROM route_registrations WHERE student_code = v_student_code;
    DELETE FROM ai_chat_history WHERE user_id = v_student_user_id;

    INSERT INTO lost_item_reports (reported_by_user_id, trip_id, item_description, reported_at, status, notes, assisted_by_user_id)
    SELECT v_student_user_id, th.trip_id, 'Tai nghe', th.boarded_at + INTERVAL '30 minutes',
           'FOUND', 'Đã tìm thấy tại khu vực ghế cuối xe.', v_dispatcher_user_id
    FROM travel_history th
    WHERE th.travel_history_id = v_preserved_history_id;

    INSERT INTO notifications (recipient_user_id, sender_user_id, title, content, notification_type, is_read, sent_at)
    VALUES (v_student_user_id, v_dispatcher_user_id, 'Đã tìm thấy đồ thất lạc',
            'Tai nghe của bạn đã được tìm thấy. Mở mục Đồ thất lạc để xem chi tiết.',
            'ALERT', false, CURRENT_TIMESTAMP);
END
$reset$;

COMMIT;

WITH checks AS (
    SELECT 'student purchase state is clean' AS subject,
           CASE WHEN NOT EXISTS (SELECT 1 FROM route_registrations WHERE student_code = '27211200001')
                 AND NOT EXISTS (SELECT 1 FROM tb_orders WHERE student_code = '27211200001')
                 AND NOT EXISTS (SELECT 1 FROM payments WHERE student_code = '27211200001')
                 AND NOT EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = '27211200001')
                 AND NOT EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = '27211200001')
           THEN 'PASS' ELSE 'FAIL' END AS status
    UNION ALL
    SELECT 'recent dispatcher rehearsal shifts removed', CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END
    FROM bus_schedules bs LEFT JOIN trips t ON t.schedule_id = bs.schedule_id
    JOIN users u ON u.user_id = bs.assigned_by_user_id
    WHERE u.email = 'dispatcher.demo@unibus.local'
      AND (t.service_date >= CURRENT_DATE - 1 OR (t.trip_id IS NULL AND bs.assigned_at >= CURRENT_TIMESTAMP - INTERVAL '2 days'))
    UNION ALL
    SELECT 'student history is limited to one checkpoint', CASE WHEN count(*) <= 1 THEN 'PASS' ELSE 'FAIL' END
    FROM travel_history
    WHERE student_code = '27211200001'
    UNION ALL
    SELECT 'student baseline lost item is ready', CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END
    FROM lost_item_reports
    WHERE reported_by_user_id = (SELECT user_id FROM users WHERE email = 'student.supported@unibus.local')
      AND trip_id = 1450
      AND item_description = 'Tai nghe'
      AND status = 'FOUND'
    UNION ALL
    SELECT 'student baseline notification is ready', CASE WHEN count(*) = 1 THEN 'PASS' ELSE 'FAIL' END
    FROM notifications
    WHERE recipient_user_id = (SELECT user_id FROM users WHERE email = 'student.supported@unibus.local')
      AND title = 'Đã tìm thấy đồ thất lạc'
      AND notification_type = 'ALERT'
    UNION ALL
    SELECT 'real FPT and DTU route data remains available',
           CASE WHEN EXISTS (SELECT 1 FROM stops WHERE stop_id IN (38,84) AND latitude IS NOT NULL AND longitude IS NOT NULL)
                  AND EXISTS (
                      SELECT 1 FROM route_universities ru
                      JOIN universities u ON u.university_id = ru.university_id
                      JOIN routes r ON r.route_id = ru.route_id
                      WHERE u.code = 'DTU' AND ru.status = 'ACTIVE' AND r.status = 'ACTIVE'
                  )
           THEN 'PASS' ELSE 'FAIL' END
    UNION ALL
    SELECT 'other demo history is preserved', CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END
    FROM travel_history
    WHERE student_code <> '27211200001'
      AND student_code IN (SELECT s.student_code FROM students s JOIN users u ON u.user_id=s.user_id WHERE u.email LIKE 'student.%@unibus.local')
)
SELECT subject,status FROM checks ORDER BY subject;
'@

$auth = @{ host = $DbHost; port = $Port; dbname = $Database; user = $Username; password = $Password }
$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
    $runner = @'
import json, os, sys
import psycopg2
conn=psycopg2.connect(**json.loads(os.environ['UNIBUS_DB_AUTH']), connect_timeout=20)
try:
    with conn:
        with conn.cursor() as cur:
            cur.execute(os.environ['UNIBUS_DEMO_SQL'])
            rows=cur.fetchall()
            for subject,status in rows: print(f'{status}: {subject}')
            if any(status != 'PASS' for _,status in rows): sys.exit(2)
finally:
    conn.close()
'@
    $temp = Join-Path ([IO.Path]::GetTempPath()) 'unibus_demo_reset.py'
    try {
        Set-Content -LiteralPath $temp -Value $runner -Encoding UTF8
        $env:UNIBUS_DB_AUTH = $auth | ConvertTo-Json -Compress
        $env:UNIBUS_DEMO_SQL = $sql
        $env:PYTHONIOENCODING = 'utf-8'
        & $python.Source $temp
        if ($LASTEXITCODE -ne 0) { throw "Reset/audit failed: exit $LASTEXITCODE" }
        exit 0
    } finally {
        Remove-Item Env:\UNIBUS_DB_AUTH,Env:\UNIBUS_DEMO_SQL,Env:\PYTHONIOENCODING -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue
    }
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) { throw 'python + psycopg2 or psql is required.' }
$env:PGPASSWORD = $Password
try {
    $result = $sql | & $psql.Source --host $DbHost --port $Port --username $Username --dbname $Database --set ON_ERROR_STOP=1 2>&1
    $result | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) { throw "Reset/audit failed: exit $LASTEXITCODE" }
    if (($result | Out-String) -match '\bFAIL\b') { throw 'Audit contains FAIL.' }
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
