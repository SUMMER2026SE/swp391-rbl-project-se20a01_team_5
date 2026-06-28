param(
    [string]$OutputPath = "database/SeedOfficialDanangBusMapData.sql"
)

$ErrorActionPreference = "Stop"
$Headers = @{
    "User-Agent" = "Mozilla/5.0 UniBus data importer"
    "Referer" = "https://map.busmap.vn/dn"
    "Origin" = "https://map.busmap.vn"
}

function ConvertFrom-BusMapEncryptedJson {
    param([string]$Url, [string]$Key)
    $payload = (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 60 -Headers $Headers).Content.Trim('"')
    if ($payload.StartsWith("{") -or $payload.StartsWith("[")) {
        return $payload | ConvertFrom-Json
    }
    $bytes = for ($i = 0; $i -lt $payload.Length; $i += 2) {
        [Convert]::ToByte($payload.Substring($i, 2), 16)
    }
    $iv = [byte[]]($bytes[0..15])
    $cipher = [byte[]]($bytes[16..($bytes.Count - 1)])
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = [System.Text.Encoding]::UTF8.GetBytes($Key)
    $aes.IV = $iv
    $plain = [System.Text.Encoding]::UTF8.GetString($aes.CreateDecryptor().TransformFinalBlock($cipher, 0, $cipher.Length))
    return $plain | ConvertFrom-Json
}

function Escape-Sql {
    param($Value)
    if ($null -eq $Value) { return "NULL" }
    $text = [string]$Value
    if ([string]::IsNullOrWhiteSpace($text)) { return "NULL" }
    return "'" + $text.Replace("'", "''") + "'"
}

function Clean-RouteCode {
    param([string]$Value)
    return ($Value -replace "\.$", "").Trim()
}

function Fare-Number {
    param($Value)
    if ($null -eq $Value) { return 5000 }
    $digits = ([string]$Value) -replace "[^\d]", ""
    if ([string]::IsNullOrWhiteSpace($digits)) { return 5000 }
    return [int]$digits
}

function Monthly-Fare {
    param([int]$SingleFare)
    if ($SingleFare -le 5000) { return 100000 }
    if ($SingleFare -le 20000) { return 200000 }
    return [Math]::Min($SingleFare * 10, 700000)
}

function Is-Interregional {
    param($Route)
    $code = Clean-RouteCode $Route.routeNo
    $interregionalCodes = @("01", "06", "09", "LK01", "LK02", "LK21")
    if ($interregionalCodes -contains $code) { return $true }
    $name = "$($Route.routeName) $($Route.routeNo)"
    $plain = $name.ToLowerInvariant()
    return $plain -match "hội an|hoi an|huế|hue|tam kỳ|tam ky|quế sơn|que son|phú đa|phu da"
}

function Stop-Name {
    param($Station)
    if ($Station.stationName) { return [string]$Station.stationName }
    if ($Station.stationAddress) { return (([string]$Station.stationAddress).Split(",")[0]).Trim() }
    return "Trạm BusMap $($Station.stationId)"
}

$key = (Invoke-WebRequest -Uri "https://api-web.busmap.vn/web/public/auth/decrypt_key" -UseBasicParsing -TimeoutSec 30 -Headers $Headers).Content.Trim('"')
$routes = ConvertFrom-BusMapEncryptedJson "https://api-web.busmap.vn/web/public/route/list?regionCode=dn" $key
$details = @()
foreach ($route in $routes) {
    $details += ConvertFrom-BusMapEncryptedJson "https://api-web.busmap.vn/web/public/route/detail?routeId=$($route.routeId)&regionCode=dn" $key
}

$generatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("-- Official-ish Da Nang bus seed generated from BusMap/DanaBus public web data.")
$lines.Add("-- Source pages: https://danangbus.vn/ and https://map.busmap.vn/dn")
$lines.Add("-- Generated at UTC: $generatedAt")
$lines.Add("-- Run after V14__danang_journey_planner_foundation.sql.")
$lines.Add("")
$lines.Add("BEGIN;")
$lines.Add("")

foreach ($route in $details) {
    $routeCode = Clean-RouteCode $route.routeNo
    $interregional = if (Is-Interregional $route) { "TRUE" } else { "FALSE" }
    $singleFare = Fare-Number $route.normalTicket
    $monthlyFare = Monthly-Fare $singleFare
    $descriptionParts = @(
        "source=BUSMAP",
        "operationTime=$($route.operationTime)",
        "outBound=$($route.outBoundDescription)",
        "inBound=$($route.inBoundDescription)"
    )
    $description = ($descriptionParts -join " | ")
    if ($description.Length -gt 500) { $description = $description.Substring(0, 500) }
    $distanceKm = if ($route.distance -and [double]$route.distance -gt 0) {
        [Math]::Round(([double]$route.distance) / 1000, 2).ToString([System.Globalization.CultureInfo]::InvariantCulture)
    } else {
        "NULL"
    }
    $frequency = if ($route.headway -match "\d+") { [int]$Matches[0] } else { 15 }
    $color = switch -Regex ($routeCode) {
        "^R" { "#16a34a"; break }
        "^N" { "#f59e0b"; break }
        "^LK" { "#7c3aed"; break }
        default { "#144fcc" }
    }
    $lines.Add("INSERT INTO routes (route_name, route_code, description, distance_km, estimated_minutes, frequency_min, color_hex, is_circular, status, created_at, external_source, external_route_id, source_updated_at, is_interregional)")
    $lines.Add("VALUES ($(Escape-Sql $route.routeName), $(Escape-Sql $routeCode), $(Escape-Sql $description), $distanceKm, NULL, $frequency, $(Escape-Sql $color), FALSE, 'ACTIVE', CURRENT_TIMESTAMP, 'BUSMAP_DN', $(Escape-Sql $route.routeId), CURRENT_TIMESTAMP, $interregional)")
    $lines.Add("ON CONFLICT (route_code) DO UPDATE SET")
    $lines.Add("    route_name = EXCLUDED.route_name,")
    $lines.Add("    description = EXCLUDED.description,")
    $lines.Add("    distance_km = EXCLUDED.distance_km,")
    $lines.Add("    frequency_min = EXCLUDED.frequency_min,")
    $lines.Add("    color_hex = EXCLUDED.color_hex,")
    $lines.Add("    external_source = EXCLUDED.external_source,")
    $lines.Add("    external_route_id = EXCLUDED.external_route_id,")
    $lines.Add("    source_updated_at = EXCLUDED.source_updated_at,")
    $lines.Add("    is_interregional = EXCLUDED.is_interregional,")
    $lines.Add("    status = 'ACTIVE';")
    $lines.Add("")
    $lines.Add("WITH route_data AS (SELECT route_id FROM routes WHERE route_code = $(Escape-Sql $routeCode))")
    $lines.Add("DELETE FROM route_stops rs USING route_data WHERE rs.route_id = route_data.route_id;")
    $lines.Add("")

    foreach ($station in $route.stations) {
        if ($null -eq $station.lat -or $null -eq $station.lng) { continue }
        $stopCode = "BUSMAP-DN-$($station.stationId)"
        $stopName = Stop-Name $station
        $lines.Add("INSERT INTO stops (stop_name, stop_code, address, longitude, latitude, has_shelter, description, status, created_at, external_source, external_stop_id, source_updated_at)")
        $lines.Add("VALUES ($(Escape-Sql $stopName), $(Escape-Sql $stopCode), $(Escape-Sql $station.stationAddress), $($station.lng), $($station.lat), FALSE, 'BUSMAP_DN official stop', 'ACTIVE', CURRENT_TIMESTAMP, 'BUSMAP_DN', $(Escape-Sql $station.stationId), CURRENT_TIMESTAMP)")
        $lines.Add("ON CONFLICT (stop_code) DO UPDATE SET")
        $lines.Add("    stop_name = EXCLUDED.stop_name,")
        $lines.Add("    address = EXCLUDED.address,")
        $lines.Add("    longitude = EXCLUDED.longitude,")
        $lines.Add("    latitude = EXCLUDED.latitude,")
        $lines.Add("    external_source = EXCLUDED.external_source,")
        $lines.Add("    external_stop_id = EXCLUDED.external_stop_id,")
        $lines.Add("    source_updated_at = EXCLUDED.source_updated_at,")
        $lines.Add("    status = 'ACTIVE';")
        $lines.Add("")
        $minutes = if ([int]$station.stationOrder -eq 0) { 0 } else { 3 }
        $direction = if ($null -eq $station.stationDirection) { 0 } else { [int]$station.stationDirection }
        $lines.Add("WITH route_data AS (SELECT route_id FROM routes WHERE route_code = $(Escape-Sql $routeCode)),")
        $lines.Add("stop_data AS (SELECT stop_id FROM stops WHERE stop_code = $(Escape-Sql $stopCode))")
        $lines.Add("INSERT INTO route_stops (route_id, stop_id, stop_order, minutes_from_previous_stop, station_direction, path_points)")
        $lines.Add("SELECT route_data.route_id, stop_data.stop_id, $($station.stationOrder), $minutes, $direction, $(Escape-Sql $station.pathPoints)")
        $lines.Add("FROM route_data CROSS JOIN stop_data")
        $lines.Add("ON CONFLICT (route_id, station_direction, stop_order) DO UPDATE SET")
        $lines.Add("    stop_id = EXCLUDED.stop_id,")
        $lines.Add("    minutes_from_previous_stop = EXCLUDED.minutes_from_previous_stop,")
        $lines.Add("    path_points = EXCLUDED.path_points;")
        $lines.Add("")
    }

    $lines.Add("WITH route_data AS (SELECT route_id FROM routes WHERE route_code = $(Escape-Sql $routeCode))")
    $lines.Add("INSERT INTO fares (route_id, fare_type, amount, effective_from, notes)")
    $lines.Add("SELECT route_id, 'SINGLE', $singleFare, CURRENT_DATE - 1, 'BusMap/DanaBus imported fare' FROM route_data")
    $lines.Add("WHERE NOT EXISTS (SELECT 1 FROM fares f WHERE f.route_id = route_data.route_id AND f.fare_type = 'SINGLE' AND f.effective_until IS NULL);")
    $lines.Add("WITH route_data AS (SELECT route_id FROM routes WHERE route_code = $(Escape-Sql $routeCode))")
    $lines.Add("INSERT INTO fares (route_id, fare_type, amount, effective_from, notes)")
    $lines.Add("SELECT route_id, 'MONTHLY', $monthlyFare, CURRENT_DATE - 1, 'UniBus demo monthly fare derived from BusMap single fare' FROM route_data")
    $lines.Add("WHERE NOT EXISTS (SELECT 1 FROM fares f WHERE f.route_id = route_data.route_id AND f.fare_type = 'MONTHLY' AND f.effective_until IS NULL);")
    $lines.Add("")
}

$lines.Add("-- Demo university can buy passes for university-oriented public routes.")
$lines.Add("WITH university_data AS (SELECT university_id FROM universities WHERE code = 'UNIBUS_DEMO_FLOW'),")
$lines.Add("linked_routes AS (SELECT route_id FROM routes WHERE route_code IN ('02', '16', 'R16'))")
$lines.Add("INSERT INTO route_universities (route_id, university_id, active_from, status, created_at, updated_at)")
$lines.Add("SELECT linked_routes.route_id, university_data.university_id, CURRENT_DATE - 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP")
$lines.Add("FROM linked_routes CROSS JOIN university_data")
$lines.Add("WHERE NOT EXISTS (")
$lines.Add("    SELECT 1 FROM route_universities ru")
$lines.Add("    WHERE ru.route_id = linked_routes.route_id")
$lines.Add("      AND ru.university_id = university_data.university_id")
$lines.Add("      AND ru.status = 'ACTIVE'")
$lines.Add(");")
$lines.Add("")
$lines.Add("COMMIT;")

$resolved = Resolve-Path -Path "." | Select-Object -ExpandProperty Path
$target = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $resolved $OutputPath }
$dir = Split-Path $target -Parent
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[System.IO.File]::WriteAllLines($target, $lines, [System.Text.Encoding]::UTF8)
Write-Host "Wrote $($details.Count) routes to $target"
