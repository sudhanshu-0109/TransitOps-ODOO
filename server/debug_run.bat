@echo off
cd /d %~dp0
echo Running node src/server.js...
node src/server.js > debug.log 2>&1
echo Done.
