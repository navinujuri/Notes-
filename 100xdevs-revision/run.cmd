@echo off
REM Double-click to open the 100xDevs revision notes in your browser.
if not exist "%~dp0out\revision.html" (
  echo [!] Output not built yet. In this folder run:  npm install ^&^& npm run build
  pause
  exit /b 1
)
start "" "%~dp0out\revision.html"
