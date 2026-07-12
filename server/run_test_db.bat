@echo off
cd /d %~dp0
echo Testing database connection...
call npx prisma generate
node test_db.js
echo.
pause
