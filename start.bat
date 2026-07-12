@echo off
echo Starting TransitOps Server...
cd /d %~dp0server
start "TransitOps Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo Starting TransitOps Client...
cd /d %~dp0client
start "TransitOps Client" cmd /k "npm run dev"
echo.
echo TransitOps is starting!
echo Server: http://localhost:5000
echo Client: http://localhost:5173
echo.
timeout /t 4 /nobreak >nul
start http://localhost:5173
