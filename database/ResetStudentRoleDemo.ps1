param(
    [string]$AuthFile = (Join-Path $PSScriptRoot '..\dbauth.txt')
)

$ErrorActionPreference = 'Stop'
$expectedEmail = 'student.supported@unibus.local'
$expectedStudentCode = '27211200001'

function Read-UniBusDbAuth {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "Khong tim thay auth file: $Path" }
    $auth = @{}
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#')) {
            $separator = $line.IndexOf(':')
            if ($separator -gt 0) {
                $auth[$line.Substring(0, $separator).Trim().ToLowerInvariant()] = $line.Substring($separator + 1).Trim()
            }
        }
    }
    foreach ($required in @('endpoint', 'port', 'initialdb', 'username', 'password')) {
        if (-not $auth.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($auth[$required])) {
            throw "Auth file thieu key '$required'."
        }
    }
    return $auth
}

$auth = Read-UniBusDbAuth -Path $AuthFile
Write-Host "Target: host=$($auth['endpoint']); port=$($auth['port']); database=$($auth['initialdb']); user=$($auth['username'])"
Write-Host "Account: $expectedEmail ($expectedStudentCode)"
Write-Host 'Chi xoa du lieu phat sinh cua account nay; giu tai khoan, mat khau, DTU va trang thai VERIFIED.'
$confirmation = Read-Host "Type 'RESET STUDENT DEMO' to continue"
if ($confirmation -ne 'RESET STUDENT DEMO') { throw 'Confirmation mismatch. No data changed.' }

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { throw 'Can python with psycopg2 de chay reset.' }

$runner = @'
import json, os, sys
import psycopg2

auth = json.loads(os.environ["UNIBUS_DB_AUTH_JSON"])
endpoint = auth["endpoint"].replace("jdbc:postgresql://", "")
host = endpoint.split(":")[0].split("/")[0]
conn = psycopg2.connect(host=host, port=int(auth.get("port", 5432)), dbname=auth["initialdb"], user=auth["username"], password=auth["password"], connect_timeout=20)
email = "student.supported@unibus.local"
student_code = "27211200001"

sql = r'''
CREATE TEMP TABLE reset_student_target ON COMMIT DROP AS
SELECT u.user_id, s.student_code
FROM users u
JOIN students s ON s.user_id = u.user_id
JOIN universities uni ON uni.university_id = s.university_id
WHERE lower(u.email) = lower(%s)
  AND s.student_code = %s
  AND u.role = 'STUDENT'
  AND u.status = 'ACTIVE'
  AND u.email_verified_at IS NOT NULL
  AND u.student_verification_status = 'VERIFIED'
  AND uni.code = 'DTU';

DO $$
BEGIN
    IF (SELECT count(*) FROM reset_student_target) <> 1 THEN
        RAISE EXCEPTION 'Safety assertion failed: expected exactly one active verified DTU student';
    END IF;
END $$;

DELETE FROM journey_order_items WHERE journey_order_id IN (SELECT journey_order_id FROM journey_orders WHERE student_code = %s);
DELETE FROM journey_orders WHERE student_code = %s;
DELETE FROM invoices WHERE student_code = %s;
DELETE FROM payments WHERE student_code = %s;
DELETE FROM travel_history WHERE student_code = %s;
DELETE FROM feedback WHERE student_code = %s;
DELETE FROM driver_ratings WHERE student_code = %s;
DELETE FROM lost_item_reports WHERE reported_by_user_id IN (SELECT user_id FROM reset_student_target);
DELETE FROM notifications WHERE recipient_user_id IN (SELECT user_id FROM reset_student_target);
DELETE FROM ai_chat_history WHERE user_id IN (SELECT user_id FROM reset_student_target);
DELETE FROM tb_transactions WHERE matched_order_id IN (SELECT id FROM tb_orders WHERE student_code = %s);
DELETE FROM tb_orders WHERE student_code = %s;
DELETE FROM monthly_passes WHERE student_code = %s;
DELETE FROM single_trip_tickets WHERE student_code = %s;
DELETE FROM route_registrations WHERE student_code = %s;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM journey_orders WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM invoices WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM payments WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM travel_history WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM tb_orders WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM monthly_passes WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM single_trip_tickets WHERE student_code = '27211200001')
       OR EXISTS (SELECT 1 FROM route_registrations WHERE student_code = '27211200001') THEN
        RAISE EXCEPTION 'Post-reset assertion failed; transaction will roll back';
    END IF;
END $$;

SELECT 'route_registrations' AS item, count(*) AS remaining FROM route_registrations WHERE student_code = %s
UNION ALL SELECT 'monthly_passes', count(*) FROM monthly_passes WHERE student_code = %s
UNION ALL SELECT 'single_trip_tickets', count(*) FROM single_trip_tickets WHERE student_code = %s
UNION ALL SELECT 'orders', count(*) FROM tb_orders WHERE student_code = %s
UNION ALL SELECT 'travel_history', count(*) FROM travel_history WHERE student_code = %s
UNION ALL SELECT 'feedback', count(*) FROM feedback WHERE student_code = %s
UNION ALL SELECT 'notifications', count(*) FROM notifications WHERE recipient_user_id IN (SELECT user_id FROM reset_student_target)
UNION ALL SELECT 'ai_chat_history', count(*) FROM ai_chat_history WHERE user_id IN (SELECT user_id FROM reset_student_target)
ORDER BY item;
'''
params = [email, student_code] + [student_code] * 12 + [student_code] * 6
try:
    with conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
    print("Reset committed.")
    for item, remaining in rows:
        print(f"{item}: {remaining}")
except Exception:
    conn.rollback()
    raise
finally:
    conn.close()
'@

$tempRunner = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_reset_student_role_demo.py'
try {
    Set-Content -LiteralPath $tempRunner -Value $runner -Encoding UTF8
    $env:PYTHONIOENCODING = 'utf-8'
    $env:UNIBUS_DB_AUTH_JSON = ($auth | ConvertTo-Json -Compress)
    & $python.Source $tempRunner
    if ($LASTEXITCODE -ne 0) { throw "Reset failed with exit code $LASTEXITCODE. Transaction rolled back." }
} finally {
    Remove-Item Env:\PYTHONIOENCODING -ErrorAction SilentlyContinue
    Remove-Item Env:\UNIBUS_DB_AUTH_JSON -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $tempRunner -Force -ErrorAction SilentlyContinue
}
