param(
    [string]$AuthFile = (Join-Path $PSScriptRoot "..\dbauth.txt")
)

$ErrorActionPreference = "Stop"

$sqlFile = Join-Path $PSScriptRoot "SeedCompleteDemoFlow.sql"
$driver = Get-ChildItem `
    -Path (Join-Path $HOME ".m2\repository\org\postgresql\postgresql") `
    -Recurse `
    -Filter "postgresql-*.jar" `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike "*sources*" -and $_.Name -notlike "*javadoc*" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

if (-not (Test-Path -LiteralPath $AuthFile)) {
    throw "Khong tim thay dbauth.txt. File nay chi luu local va khong duoc commit."
}
if (-not (Test-Path -LiteralPath $sqlFile)) {
    throw "Khong tim thay SeedCompleteDemoFlow.sql."
}
if (-not $driver) {
    throw "Chua co PostgreSQL JDBC driver trong ~/.m2. Hay chay backend Maven test mot lan."
}

$runnerSource = @'
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

class UniBusDemoSqlRunner {
    public static void main(String[] args) throws Exception {
        Map<String, String> auth = new LinkedHashMap<>();
        for (String line : Files.readAllLines(Path.of(args[0]))) {
            int separator = line.indexOf(':');
            if (separator > 0) {
                auth.put(
                    line.substring(0, separator).trim().toLowerCase(),
                    line.substring(separator + 1).trim()
                );
            }
        }

        String endpoint = auth.get("endpoint");
        String database = auth.getOrDefault("initialdb", "postgres");
        String url = endpoint.startsWith("jdbc:")
            ? endpoint
            : "jdbc:postgresql://" + endpoint + ":5432/" + database + "?sslmode=require";
        String sql = Files.readString(Path.of(args[1]));

        try (Connection connection = DriverManager.getConnection(
                    url, auth.get("username"), auth.get("password"));
             Statement statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            try {
                for (String fragment : sql.split(";\\s*(?:\\r?\\n|$)")) {
                    String executable = fragment.trim();
                    if (executable.isBlank()
                            || executable.equalsIgnoreCase("BEGIN")
                            || executable.equalsIgnoreCase("COMMIT")) {
                        continue;
                    }
                    statement.execute(executable);
                }
                connection.commit();
            } catch (Exception exception) {
                connection.rollback();
                throw exception;
            }
        }
    }
}
'@

$tempSource = Join-Path ([System.IO.Path]::GetTempPath()) "UniBusDemoSqlRunner.java"
try {
    Set-Content -LiteralPath $tempSource -Value $runnerSource -Encoding UTF8
    & java -cp $driver.FullName $tempSource `
        (Resolve-Path -LiteralPath $AuthFile).Path `
        (Resolve-Path -LiteralPath $sqlFile).Path
    if ($LASTEXITCODE -ne 0) {
        throw "Khong the chuan bi lai du lieu demo."
    }
    Write-Host "Da reset student.flow ve trang thai sinh vien moi da xac minh."
} finally {
    Remove-Item -LiteralPath $tempSource -Force -ErrorAction SilentlyContinue
}
