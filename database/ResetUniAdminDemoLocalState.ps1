param(
    [string]$AuthFile = (Join-Path $PSScriptRoot '..\dbauth.txt'),
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

function Read-UniBusDbAuth {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        $fallback = Join-Path $PSScriptRoot '..\backend\.env.local'
        if (Test-Path -LiteralPath $fallback) {
            $Path = $fallback
        } else {
            throw "Khong tim thay auth file: $Path"
        }
    }

    $auth = @{}
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith('#')) { return }

        $separator = $line.IndexOf(':')
        if ($separator -gt 0 -and -not $line.Contains('=')) {
            $auth[$line.Substring(0, $separator).Trim().ToLowerInvariant()] = $line.Substring($separator + 1).Trim()
            return
        }

        $separator = $line.IndexOf('=')
        if ($separator -gt 0) {
            $key = $line.Substring(0, $separator).Trim()
            $value = $line.Substring($separator + 1).Trim()
            switch ($key) {
                'DB_URL' {
                    $uri = $value.Replace('jdbc:postgresql://', '')
                    $uri = $uri.Split('?')[0]
                    $hostPortDb = $uri.Split('/')
                    $hostPort = $hostPortDb[0].Split(':')
                    $auth['endpoint'] = $hostPort[0]
                    $auth['port'] = if ($hostPort.Count -gt 1) { $hostPort[1] } else { '5432' }
                    $auth['initialdb'] = if ($hostPortDb.Count -gt 1) { $hostPortDb[1] } else { 'postgres' }
                }
                'DB_USERNAME' { $auth['username'] = $value }
                'DB_PASSWORD' { $auth['password'] = $value }
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

function Invoke-WithPythonPsycopg2 {
    param([hashtable]$Auth, [string]$SqlFile)
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { return $false }

    $runner = @'
import json, os, sys
try:
    import psycopg2
except Exception as exc:
    print(f"PYTHON_PSYCOPG2_UNAVAILABLE: {exc}", file=sys.stderr)
    sys.exit(86)

auth = json.loads(os.environ["UNIBUS_DB_AUTH_JSON"])
sql_file = os.environ["UNIBUS_SQL_FILE"]
conn = psycopg2.connect(
    host=auth["endpoint"],
    port=int(auth.get("port", 5432)),
    dbname=auth["initialdb"],
    user=auth["username"],
    password=auth["password"],
    connect_timeout=30,
)
try:
    with conn:
        with conn.cursor() as cur:
            sql = open(sql_file, "r", encoding="utf-8-sig").read()
            cur.execute(sql)
            if cur.description:
                columns = [desc[0] for desc in cur.description]
                rows = cur.fetchall()
                print(" | ".join(columns))
                print("-+-".join("-" * len(column) for column in columns))
                for row in rows:
                    print(" | ".join("" if value is None else str(value) for value in row))
    print("ResetUniAdminDemoLocalState completed via python+psycopg2")
finally:
    conn.close()
'@

    $tempRunner = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_reset_uniadmin_demo_local_state.py'
    try {
        Set-Content -LiteralPath $tempRunner -Value $runner -Encoding UTF8
        $env:PYTHONIOENCODING = 'utf-8'
        $env:UNIBUS_DB_AUTH_JSON = ($Auth | ConvertTo-Json -Compress)
        $env:UNIBUS_SQL_FILE = (Resolve-Path -LiteralPath $SqlFile).Path
        & $python.Source $tempRunner
        if ($LASTEXITCODE -eq 86) { return $false }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Python runner unavailable or failed with exit code $LASTEXITCODE. Trying psql fallback..."
            return $false
        }
        return $true
    } finally {
        Remove-Item Env:\PYTHONIOENCODING -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_DB_AUTH_JSON -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_SQL_FILE -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $tempRunner -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-WithPsql {
    param([hashtable]$Auth, [string]$SqlFile)
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) {
        $commonPath = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
        if (Test-Path -LiteralPath $commonPath) {
            $psql = @{ Source = $commonPath }
        } else {
            return $false
        }
    }

    $env:PGPASSWORD = $Auth['password']
    try {
        & $psql.Source --host $Auth['endpoint'] --port $Auth['port'] --username $Auth['username'] --dbname $Auth['initialdb'] --set ON_ERROR_STOP=1 --file $SqlFile
        if ($LASTEXITCODE -ne 0) { throw "psql runner failed with exit code $LASTEXITCODE" }
        Write-Host "ResetUniAdminDemoLocalState completed via psql"
        return $true
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

$auth = Read-UniBusDbAuth -Path $AuthFile
$sqlFile = Join-Path $PSScriptRoot 'ResetUniAdminDemoLocalState.sql'

Write-Host "Target database: host=$($auth['endpoint']); port=$($auth['port']); database=$($auth['initialdb']); user=$($auth['username'])"
Write-Host "Scope: reset uniadmin.demo@unibus.local DTU roster/domain/campus demo state and remove bad imported students."

if (-not $Yes) {
    $confirmation = Read-Host "Type 'RESET UNIADMIN DEMO' to continue"
    if ($confirmation.Trim().ToUpperInvariant() -ne 'RESET UNIADMIN DEMO') {
        throw 'Confirmation mismatch. No data changed.'
    }
}

if (Invoke-WithPythonPsycopg2 -Auth $auth -SqlFile $sqlFile) { exit 0 }
if (Invoke-WithPsql -Auth $auth -SqlFile $sqlFile) { exit 0 }

throw 'Khong co runner kha dung: can python+psycopg2 hoac psql.'
