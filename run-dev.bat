@echo off
setlocal

set "PROJECT_DIR=%~dp0"

echo Starting UniBus backend and frontend...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:3000

start "UniBus Backend" "%PROJECT_DIR%run-backend.bat"
start "UniBus Frontend" "%PROJECT_DIR%run-frontend.bat"

endlocal
