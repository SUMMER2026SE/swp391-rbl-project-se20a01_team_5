param(
    [ValidateSet('Seed', 'Reset', 'Audit', 'All')]
    [string]$Mode = 'Audit',
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
            $separator = $line.IndexOf(':')
            if ($separator -gt 0) {
                $auth[$line.Substring(0, $separator).Trim().ToLowerInvariant()] = $line.Substring($separator + 1).Trim()
            }
        }
    }
    foreach ($required in @('endpoint', 'username', 'password')) {
        if (-not $auth.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($auth[$required])) { throw "Auth file thieu key '$required'." }
    }
    if (-not $auth.ContainsKey('port')) { $auth['port'] = '5432' }
    if (-not $auth.ContainsKey('initialdb')) { $auth['initialdb'] = 'postgres' }
    return $auth
}

function Get-SqlFileForMode {
    param([string]$CurrentMode)
    switch ($CurrentMode) {
        'Seed' { return (Join-Path $PSScriptRoot 'SeedStableDemoDataUntilAugust.sql') }
        'Reset' { return (Join-Path $PSScriptRoot 'ResetStableDemoScenario.sql') }
        'Audit' { return (Join-Path $PSScriptRoot 'AuditStableDemoDataUntilAugust.sql') }
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
        'conn = psycopg2.connect(host=host, port=int(auth.get("port", 5432)), dbname=auth.get("initialdb", "postgres"), user=auth["username"], password=auth["password"], connect_timeout=20)'
        'try:'
        '    with conn:'
        '        with conn.cursor() as cur:'
        '            sql = open(sql_file, "r", encoding="utf-8-sig").read()'
        '            cur.execute(sql)'
        '            if cur.description:'
        '                columns = [desc[0] for desc in cur.description]'
        '                rows = cur.fetchall()'
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
    $tempRunner = Join-Path ([System.IO.Path]::GetTempPath()) 'unibus_stable_demo_runner.py'
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

function Invoke-StableDemoSql {
    param([string]$CurrentMode)
    $sqlFile = Get-SqlFileForMode -CurrentMode $CurrentMode
    if (-not (Test-Path -LiteralPath $sqlFile)) { throw "Khong tim thay SQL file: $sqlFile" }
    Write-Host "Running $CurrentMode using $sqlFile"
    if (Invoke-WithPythonPsycopg2 -Auth $auth -SqlFile $sqlFile -CurrentMode $CurrentMode) { return }
    if (Invoke-WithPsql -Auth $auth -SqlFile $sqlFile -CurrentMode $CurrentMode) { return }
    throw 'Khong co runner kha dung: can python+psycopg2 hoac psql.'
}

function Confirm-StableDemoMutation {
    param([string]$RequestedMode, [hashtable]$Auth)
    $requiredPhrase = if ($RequestedMode -eq 'Reset') { 'RESET DEMO' } else { 'SEED DEMO' }
    if ($RequestedMode -eq 'All') {
        Write-Host "Mode All means: run Seed, then Audit. It does not run Reset."
    }
    Write-Host "This will modify the target database. Password is not printed."
    $confirmation = Read-Host "Type '$requiredPhrase' to continue"
    if ($confirmation -ne $requiredPhrase) {
        throw "Confirmation mismatch. Aborted without running $RequestedMode."
    }
}

$auth = Read-UniBusDbAuth -Path $AuthFile
Write-Host "Target database: host=$($auth['endpoint']); port=$($auth['port']); database=$($auth['initialdb']); user=$($auth['username'])"
if ($Mode -in @('Seed', 'Reset', 'All')) {
    Confirm-StableDemoMutation -RequestedMode $Mode -Auth $auth
} elseif ($Mode -eq 'Audit') {
    Write-Host 'Mode Audit is read-only and does not require confirmation.'
}
$modes = if ($Mode -eq 'All') { @('Seed', 'Audit') } else { @($Mode) }
foreach ($currentMode in $modes) { Invoke-StableDemoSql -CurrentMode $currentMode }

