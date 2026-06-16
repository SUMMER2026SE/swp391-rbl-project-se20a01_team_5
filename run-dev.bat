@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"
set "BACKEND_ENV=%BACKEND_DIR%\.env.local"

if not exist "%BACKEND_DIR%\pom.xml" (
  echo Backend folder not found: %BACKEND_DIR%
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo Frontend folder not found: %FRONTEND_DIR%
  exit /b 1
)

if not exist "%BACKEND_ENV%" (
  echo Missing backend env file: %BACKEND_ENV%
  echo Create it with lines like:
  echo DB_URL=jdbc:postgresql://host:5432/database
  echo DB_USERNAME=postgres
  echo DB_PASSWORD=your-password
  echo JWT_SECRET=change-this-to-a-long-secret-at-least-32-chars
  exit /b 1
)

start "UniBus Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && for /f "usebackq eol=# tokens=1,* delims==" %%A in (""%BACKEND_ENV%"") do set "%%A=%%B" && mvn spring-boot:run"
start "UniBus Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm.cmd run dev"

echo Started backend and frontend in separate terminal windows.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:3000

endlocal
