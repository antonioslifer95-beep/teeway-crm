@echo off
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install
)

echo Starting Teeway CRM dev server...
echo Open http://localhost:3000 in your browser once it says "Ready".
echo Press Ctrl+C to stop.
echo.

call npm run dev
pause
