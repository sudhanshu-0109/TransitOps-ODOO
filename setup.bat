@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo  ████████╗██████╗  █████╗ ███╗   ██╗███████╗██╗████████╗ ██████╗ ██████╗ ███████╗
echo  ╚══██╔══╝██╔══██╗██╔══██╗████╗  ██║██╔════╝██║╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
echo     ██║   ██████╔╝███████║██╔██╗ ██║███████╗██║   ██║   ██║   ██║██████╔╝███████╗
echo     ██║   ██╔══██╗██╔══██║██║╚██╗██║╚════██║██║   ██║   ██║   ██║██╔═══╝ ╚════██║
echo     ██║   ██║  ██║██║  ██║██║ ╚████║███████║██║   ██║   ╚██████╔╝██║     ███████║
echo     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝   ╚═╝    ╚═════╝ ╚═╝     ╚══════╝
echo.
echo  Smart Transport Operations Platform — Full Setup Script
echo  =========================================================
echo.

:: Check Node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js not found in PATH. Please install Node.js 18+ from https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODEVERSION=%%i
echo [OK] Node.js: %NODEVERSION%

:: Check npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] npm not found. Please install Node.js 18+ from https://nodejs.org
  pause
  exit /b 1
)

echo.
echo ─────────────────────────────────────────────────────────────────
echo  STEP 1: Installing SERVER dependencies
echo ─────────────────────────────────────────────────────────────────
cd /d %~dp0server
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
  echo [WARN] npm install had warnings, continuing...
)
echo [OK] Server dependencies installed.

echo.
echo ─────────────────────────────────────────────────────────────────
echo  STEP 2: Generating Prisma Client
echo ─────────────────────────────────────────────────────────────────
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Prisma generate failed. Check your DATABASE_URL in server\.env
  pause
  exit /b 1
)
echo [OK] Prisma client generated.

echo.
echo ─────────────────────────────────────────────────────────────────
echo  STEP 3: Pushing Database Schema to Neon
echo ─────────────────────────────────────────────────────────────────
call npx prisma db push --accept-data-loss
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Database push failed. Check your internet connection and DATABASE_URL.
  pause
  exit /b 1
)
echo [OK] Database schema synchronized.

echo.
echo ─────────────────────────────────────────────────────────────────
echo  STEP 4: Seeding Database with Demo Data
echo ─────────────────────────────────────────────────────────────────
call node prisma/seed.js
if %ERRORLEVEL% NEQ 0 (
  echo [WARN] Seed had errors (may be duplicate data if re-running). Continuing...
)
echo [OK] Database seeded.

echo.
echo ─────────────────────────────────────────────────────────────────
echo  STEP 5: Installing CLIENT dependencies
echo ─────────────────────────────────────────────────────────────────
cd /d %~dp0client
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
  echo [WARN] Client npm install had warnings, continuing...
)
echo [OK] Client dependencies installed.

echo.
echo ═════════════════════════════════════════════════════════════════
echo  SETUP COMPLETE! 
echo ═════════════════════════════════════════════════════════════════
echo.
echo  To start TransitOps:
echo.
echo  Terminal 1 (Server):   cd server  ^&^&  npm run dev
echo                          Server runs on: http://localhost:5000
echo.
echo  Terminal 2 (Client):   cd client  ^&^&  npm run dev
echo                          App opens at:   http://localhost:5173
echo.
echo  Demo Login Credentials (password: password123):
echo    Admin:             admin@transitops.com
echo    Fleet Manager:     fleet@transitops.com
echo    Dispatcher:        dispatch@transitops.com
echo    Safety Officer:    safety@transitops.com
echo    Financial Analyst: finance@transitops.com
echo.
echo ═════════════════════════════════════════════════════════════════
pause
