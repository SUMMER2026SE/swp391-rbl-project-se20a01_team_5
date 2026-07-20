param(
    [string]$Email = '0x23null@gmail.com',
    [string]$AuthFile = (Join-Path $PSScriptRoot '..\dbauth.txt')
)

$ErrorActionPreference = 'Stop'

function Read-UniBusDbAuth {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "Khong tim thay auth file: $Path" }
    $auth = @{}
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#')) {
            $colon = $line.IndexOf(':')
            $equals = $line.IndexOf('=')
            $separator = if ($colon -gt 0 -and ($equals -lt 0 -or $colon -lt $equals)) { $colon } else { $equals }
            if ($separator -gt 0) {
                $auth[$line.Substring(0, $separator).Trim().ToLowerInvariant()] = $line.Substring($separator + 1).Trim()
            }
        }
    }
    if ($auth.ContainsKey('db_url')) {
        $dbUrl = $auth['db_url']
        $withoutPrefix = $dbUrl -replace '^jdbc:postgresql://', ''
        $withoutQuery = $withoutPrefix.Split('?')[0]
        $slash = $withoutQuery.IndexOf('/')
        $hostPort = if ($slash -gt 0) { $withoutQuery.Substring(0, $slash) } else { $withoutQuery }
        $auth['endpoint'] = $hostPort.Split(':')[0]
        $auth['port'] = if ($hostPort.Contains(':')) { $hostPort.Split(':')[1] } else { '5432' }
        $auth['initialdb'] = if ($slash -gt 0) { $withoutQuery.Substring($slash + 1) } else { 'postgres' }
    }
    if ($auth.ContainsKey('db_username')) { $auth['username'] = $auth['db_username'] }
    if ($auth.ContainsKey('db_password')) { $auth['password'] = $auth['db_password'] }
    foreach ($required in @('endpoint', 'port', 'initialdb', 'username', 'password')) {
        if (-not $auth.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($auth[$required])) {
            throw "Auth file thieu key '$required'."
        }
    }
    return $auth
}

$normalizedEmail = $Email.Trim().ToLowerInvariant()
if ([string]::IsNullOrWhiteSpace($normalizedEmail)) { throw 'Email is required.' }

$auth = Read-UniBusDbAuth -Path $AuthFile
Write-Host "Target: host=$($auth['endpoint']); port=$($auth['port']); database=$($auth['initialdb']); user=$($auth['username'])"
Write-Host "Account: $normalizedEmail"
Write-Host 'Chi reset trang thai xac minh sinh vien; giu tai khoan, mat khau va du lieu nghiep vu khac.'
$confirmation = Read-Host "Type 'RESET VERIFY $normalizedEmail' to continue"
if ($confirmation -ne "RESET VERIFY $normalizedEmail") { throw 'Confirmation mismatch. No data changed.' }

$runner = @'
import json, os
import psycopg2

auth = json.loads(os.environ["UNIBUS_DB_AUTH_JSON"])
email = os.environ["UNIBUS_RESET_EMAIL"]
endpoint = auth["endpoint"].replace("jdbc:postgresql://", "")
host = endpoint.split(":")[0].split("/")[0]
conn = psycopg2.connect(
    host=host,
    port=int(auth.get("port", 5432)),
    dbname=auth["initialdb"],
    user=auth["username"],
    password=auth["password"],
    connect_timeout=20,
)

sql = r'''
CREATE TEMP TABLE reset_verification_target ON COMMIT DROP AS
SELECT user_id, email, role, student_verification_status
FROM users
WHERE lower(email) = lower(%s);

DO $$
BEGIN
    IF (SELECT count(*) FROM reset_verification_target) <> 1 THEN
        RAISE EXCEPTION 'Safety assertion failed: expected exactly one account for email';
    END IF;
    IF EXISTS (SELECT 1 FROM reset_verification_target WHERE role <> 'STUDENT') THEN
        RAISE EXCEPTION 'Safety assertion failed: account is not STUDENT';
    END IF;
END $$;

UPDATE student_verifications
SET current = false,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id IN (SELECT user_id FROM reset_verification_target)
  AND current = true;

UPDATE users
SET student_verification_status = 'NOT_SUBMITTED',
    email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
    updated_at = CURRENT_TIMESTAMP
WHERE user_id IN (SELECT user_id FROM reset_verification_target);

SELECT
    u.user_id,
    u.email,
    t.student_verification_status AS before_status,
    u.student_verification_status AS after_status,
    (SELECT count(*) FROM student_verifications sv WHERE sv.user_id = u.user_id AND sv.current = true) AS current_verifications,
    (SELECT count(*) FROM students s WHERE s.user_id = u.user_id) AS linked_student_profiles
FROM users u
JOIN reset_verification_target t ON t.user_id = u.user_id;
'''

try:
    with conn:
        with conn.cursor() as cur:
            cur.execute(sql, [email])
            rows = cur.fetchall()
    print("Reset committed.")
    for row in rows:
        print(
            "user_id={0}; email={1}; before_status={2}; after_status={3}; "
            "current_verifications={4}; linked_student_profiles={5}".format(*row)
        )
finally:
    conn.close()
'@

function Invoke-WithPython {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { return $false }
    $tempRunner = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_reset_student_verification_demo.py'
    try {
        Set-Content -LiteralPath $tempRunner -Value $runner -Encoding UTF8
        $env:PYTHONIOENCODING = 'utf-8'
        $env:UNIBUS_DB_AUTH_JSON = ($auth | ConvertTo-Json -Compress)
        $env:UNIBUS_RESET_EMAIL = $normalizedEmail
        & $python.Source $tempRunner
        if ($LASTEXITCODE -eq 0) { return $true }
        Write-Host "Python runner unavailable or failed with exit code $LASTEXITCODE. Trying Java JDBC fallback..."
        return $false
    } finally {
        Remove-Item Env:\PYTHONIOENCODING -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_DB_AUTH_JSON -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_RESET_EMAIL -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $tempRunner -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-WithJavaJdbc {
    $java = Get-Command java -ErrorAction SilentlyContinue
    if (-not $java) { return $false }
    $driverJar = Get-ChildItem -Path (Join-Path $env:USERPROFILE '.m2\repository\org\postgresql\postgresql') -Recurse -Filter 'postgresql-*.jar' -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notlike '*sources*' -and $_.Name -notlike '*javadoc*' } |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if (-not $driverJar) { return $false }

    $jdbcUrl = "jdbc:postgresql://$($auth['endpoint']):$($auth['port'])/$($auth['initialdb'])?sslmode=require"
    $javaSource = @'
import java.sql.*;

class ResetStudentVerificationDemoJdbc {
    public static void main(String[] args) throws Exception {
        String jdbcUrl = System.getenv("UNIBUS_JDBC_URL");
        String username = System.getenv("UNIBUS_DB_USERNAME");
        String password = System.getenv("UNIBUS_DB_PASSWORD");
        String email = System.getenv("UNIBUS_RESET_EMAIL");
        if (jdbcUrl == null || username == null || password == null || email == null) {
            throw new IllegalStateException("Missing required environment variables for reset.");
        }
        try (Connection conn = DriverManager.getConnection(jdbcUrl, username, password)) {
            conn.setAutoCommit(false);
            try {
                try (PreparedStatement ps = conn.prepareStatement(
                        "CREATE TEMP TABLE reset_verification_target ON COMMIT DROP AS " +
                        "SELECT user_id, email, role, student_verification_status " +
                        "FROM users WHERE lower(email) = lower(?)")) {
                    ps.setString(1, email);
                    ps.executeUpdate();
                }
                try (Statement st = conn.createStatement()) {
                    st.execute("DO $$ BEGIN " +
                            "IF (SELECT count(*) FROM reset_verification_target) <> 1 THEN " +
                            "RAISE EXCEPTION 'Safety assertion failed: expected exactly one account for email'; " +
                            "END IF; " +
                            "IF EXISTS (SELECT 1 FROM reset_verification_target WHERE role <> 'STUDENT') THEN " +
                            "RAISE EXCEPTION 'Safety assertion failed: account is not STUDENT'; " +
                            "END IF; " +
                            "END $$");
                    int verificationRows = st.executeUpdate(
                            "UPDATE student_verifications " +
                            "SET current = false, updated_at = CURRENT_TIMESTAMP " +
                            "WHERE user_id IN (SELECT user_id FROM reset_verification_target) AND current = true");
                    int userRows = st.executeUpdate(
                            "UPDATE users " +
                            "SET student_verification_status = 'NOT_SUBMITTED', " +
                            "email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP), " +
                            "updated_at = CURRENT_TIMESTAMP " +
                            "WHERE user_id IN (SELECT user_id FROM reset_verification_target)");
                    try (ResultSet rs = st.executeQuery(
                            "SELECT u.user_id, u.email, " +
                            "t.student_verification_status AS before_status, " +
                            "u.student_verification_status AS after_status, " +
                            "(SELECT count(*) FROM student_verifications sv WHERE sv.user_id = u.user_id AND sv.current = true) AS current_verifications, " +
                            "(SELECT count(*) FROM students s WHERE s.user_id = u.user_id) AS linked_student_profiles " +
                            "FROM users u JOIN reset_verification_target t ON t.user_id = u.user_id")) {
                        while (rs.next()) {
                            System.out.println(
                                "user_id=" + rs.getInt("user_id")
                                + "; email=" + rs.getString("email")
                                + "; before_status=" + rs.getString("before_status")
                                + "; after_status=" + rs.getString("after_status")
                                + "; current_verifications=" + rs.getInt("current_verifications")
                                + "; linked_student_profiles=" + rs.getInt("linked_student_profiles")
                            );
                        }
                    }
                    conn.commit();
                    System.out.println("Reset committed.");
                    System.out.println("current_verifications_disabled=" + verificationRows);
                    System.out.println("users_updated=" + userRows);
                }
            } catch (Exception exception) {
                conn.rollback();
                throw exception;
            }
        }
    }
}
'@
    $tempJava = Join-Path ([System.IO.Path]::GetTempPath()) 'ResetStudentVerificationDemoJdbc.java'
    $stdout = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_reset_student_verification_stdout.log'
    $stderr = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_reset_student_verification_stderr.log'
    try {
        [System.IO.File]::WriteAllText($tempJava, $javaSource, [System.Text.UTF8Encoding]::new($false))
        $env:UNIBUS_JDBC_URL = $jdbcUrl
        $env:UNIBUS_DB_USERNAME = $auth['username']
        $env:UNIBUS_DB_PASSWORD = $auth['password']
        $env:UNIBUS_RESET_EMAIL = $normalizedEmail
        & $java.Source -cp $driverJar.FullName $tempJava 1> $stdout 2> $stderr
        if (Test-Path -LiteralPath $stdout) { Get-Content -LiteralPath $stdout | ForEach-Object { Write-Host $_ } }
        if ($LASTEXITCODE -ne 0) {
            if (Test-Path -LiteralPath $stderr) { Get-Content -LiteralPath $stderr | ForEach-Object { Write-Host $_ } }
            throw "Java JDBC reset failed with exit code $LASTEXITCODE. Transaction rolled back."
        }
        return $true
    } finally {
        Remove-Item Env:\UNIBUS_JDBC_URL -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_DB_USERNAME -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_DB_PASSWORD -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_RESET_EMAIL -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $tempJava -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stdout -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $stderr -Force -ErrorAction SilentlyContinue
    }
}

if (Invoke-WithPython) {
    return
}
if (Invoke-WithJavaJdbc) {
    return
}

throw 'Khong co runner kha dung: can python+psycopg2 hoac java + PostgreSQL JDBC driver trong Maven cache.'
