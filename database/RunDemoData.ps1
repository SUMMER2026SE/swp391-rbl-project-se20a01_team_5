param(
    [ValidateSet('Seed', 'Reset', 'Audit', 'All')]
    [string]$Mode = 'Audit',
    [string]$AuthFile = (Join-Path $PSScriptRoot '..\dbauth.txt'),
    [switch]$AllowProduction,
    [string]$ConfirmPhrase
)

$ErrorActionPreference = 'Stop'

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
        if (-not $auth.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($auth[$required])) { throw "Auth file thieu key '$required'." }
    }
    return $auth
}


function Assert-UniBusTarget {
    param([hashtable]$Auth)
    $endpoint = $Auth['endpoint'].Replace('jdbc:postgresql://', '').Split('/')[0].Split(':')[0]
    if ($Auth['initialdb'] -ne 'unibus') { throw "Refusing target database '$($Auth['initialdb'])'; expected 'unibus'." }
    if ($endpoint.EndsWith('.rds.amazonaws.com') -and -not $AllowProduction) {
        throw 'Production RDS detected. Re-run with -AllowProduction after confirming a current snapshot exists.'
    }
}

function Get-SqlFileForMode {
    param([string]$CurrentMode)
    switch ($CurrentMode) {
        'Seed' { return (Join-Path $PSScriptRoot 'SeedDemoDataUntilAugust.sql') }
        'Reset' { return (Join-Path $PSScriptRoot 'ResetDemoScenario.sql') }
        'Audit' { return (Join-Path $PSScriptRoot 'AuditDemoDataUntilAugust.sql') }
        default { throw "Unsupported mode $CurrentMode" }
    }
}

function Invoke-WithPythonPsycopg2 {
    param([hashtable]$Auth, [string]$SqlFile, [string]$CurrentMode)
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { return $false }
    $py = @(
        'import json, os, sys'
        'try:'
        '    import psycopg2'
        'except Exception as exc:'
        '    print(f"PYTHON_PSYCOPG2_UNAVAILABLE: {exc}", file=sys.stderr)'
        '    sys.exit(86)'
        'auth = json.loads(os.environ["UNIBUS_DB_AUTH_JSON"])'
        'sql_file = os.environ["UNIBUS_SQL_FILE"]'
        'mode = os.environ["UNIBUS_SQL_MODE"]'
        'endpoint = auth["endpoint"].replace("jdbc:postgresql://", "")'
        'host = endpoint.split(":")[0].split("/")[0]'
        'conn = psycopg2.connect(host=host, port=int(auth.get("port", 5432)), dbname=auth["initialdb"], user=auth["username"], password=auth["password"], connect_timeout=20)'
        'try:'
        '    with conn:'
        '        with conn.cursor() as cur:'
        '            sql = open(sql_file, "r", encoding="utf-8-sig").read()'
        '            cur.execute(sql)'
        '            if cur.description:'
        '                columns = [desc[0] for desc in cur.description]'
        '                rows = cur.fetchall()'
        '                if mode == "Audit" and "status" in columns:'
        '                    status_index = columns.index("status")'
        '                    if any(str(row[status_index]).upper() == "FAIL" for row in rows):'
        '                        print("AUDIT_CONTAINS_FAIL", file=sys.stderr)'
        '                        sys.exit(2)'
        '                widths = [len(str(col)) for col in columns]'
        '                for row in rows:'
        '                    for index, value in enumerate(row): widths[index] = max(widths[index], len("" if value is None else str(value)))'
        '                print(" | ".join(str(col).ljust(widths[index]) for index, col in enumerate(columns)))'
        '                print("-+-".join("-" * width for width in widths))'
        '                for row in rows: print(" | ".join(("" if value is None else str(value)).ljust(widths[index]) for index, value in enumerate(row)))'
        '    print(f"{mode} completed via python+psycopg2")'
        'finally:'
        '    conn.close()'
    )
    $tempRunner = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_demo_runner.py'
    try {
        Set-Content -LiteralPath $tempRunner -Value ($py -join [Environment]::NewLine) -Encoding UTF8
        $env:PYTHONIOENCODING = 'utf-8'
        $env:UNIBUS_DB_AUTH_JSON = ($Auth | ConvertTo-Json -Compress)
        $env:UNIBUS_SQL_FILE = (Resolve-Path -LiteralPath $SqlFile).Path
        $env:UNIBUS_SQL_MODE = $CurrentMode
        & $python.Source $tempRunner | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -eq 86) { return $false }
        if ($LASTEXITCODE -ne 0) { throw "Python runner failed with exit code $LASTEXITCODE" }
        return $true
    } finally {
        Remove-Item Env:\PYTHONIOENCODING -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_DB_AUTH_JSON -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_SQL_FILE -ErrorAction SilentlyContinue
        Remove-Item Env:\UNIBUS_SQL_MODE -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $tempRunner -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-WithPsql {
    param([hashtable]$Auth, [string]$SqlFile, [string]$CurrentMode)
    $psql = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $psql) { return $false }
    $env:PGPASSWORD = $Auth['password']
    try {
        & $psql.Source --host $Auth['endpoint'] --port $Auth['port'] --username $Auth['username'] --dbname $Auth['initialdb'] --set ON_ERROR_STOP=1 --file $SqlFile | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -ne 0) { throw "psql runner failed with exit code $LASTEXITCODE" }
        Write-Host "$CurrentMode completed via psql"
        return $true
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

function Invoke-DemoSql {
    param([string]$CurrentMode)
    $sqlFile = Get-SqlFileForMode -CurrentMode $CurrentMode
    if (-not (Test-Path -LiteralPath $sqlFile)) { throw "Khong tim thay SQL file: $sqlFile" }
    Write-Host "Running $CurrentMode using $sqlFile"
    if (Invoke-WithPythonPsycopg2 -Auth $auth -SqlFile $sqlFile -CurrentMode $CurrentMode) { return }
    if (Invoke-WithPsql -Auth $auth -SqlFile $sqlFile -CurrentMode $CurrentMode) { return }
    throw 'Khong co runner kha dung: can python+psycopg2 hoac psql.'
}

function Confirm-DemoMutation {
    param([string]$RequestedMode, [hashtable]$Auth)
    $isProduction = $Auth['endpoint'] -like '*.rds.amazonaws.com*'
    $isReset = $RequestedMode -in @('Reset', 'All')
    $requiredPhrase = if ($isProduction) {
        if ($isReset) { 'RESET DEMO PRODUCTION' } else { 'SEED DEMO PRODUCTION' }
    } elseif ($isReset) { 'RESET DEMO' } else { 'SEED DEMO' }
    if ($RequestedMode -eq 'All') {
        Write-Host "Mode All means: restore the demo baseline, then audit it."
    }
    Write-Host "This will modify the target database. Password is not printed."
    $confirmation = if ($ConfirmPhrase) { $ConfirmPhrase } else { Read-Host "Type '$requiredPhrase' to continue" }
    if ($confirmation -ne $requiredPhrase) {
        throw "Confirmation mismatch. Aborted without running $RequestedMode."
    }
}

$auth = Read-UniBusDbAuth -Path $AuthFile
Assert-UniBusTarget -Auth $auth
Write-Host "Target database: host=$($auth['endpoint']); port=$($auth['port']); database=$($auth['initialdb']); user=$($auth['username'])"
if ($Mode -in @('Seed', 'Reset', 'All')) {
    Confirm-DemoMutation -RequestedMode $Mode -Auth $auth
} elseif ($Mode -eq 'Audit') {
    Write-Host 'Mode Audit is read-only and does not require confirmation.'
}
$modes = if ($Mode -eq 'All') { @('Reset', 'Audit') } else { @($Mode) }
foreach ($currentMode in $modes) { Invoke-DemoSql -CurrentMode $currentMode }
