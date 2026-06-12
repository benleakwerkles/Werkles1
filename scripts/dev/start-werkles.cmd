@echo off
REM ============================================================
REM  Werkles local dev launcher (Windows) - one safe path.
REM  Double-click this file, or run it from a terminal.
REM  Starts the app at http://localhost:3000 and opens a browser.
REM  Uses npm.cmd (avoids PowerShell npm.ps1 execution-policy issues).
REM ============================================================
setlocal

REM Move to repo root (this file lives in scripts\dev\).
cd /d "%~dp0..\.."

title Werkles Dev Server

REM 1) Node present?
where node >nul 2>nul
if errorlevel 1 (
  echo [Werkles] Node.js was not found.
  echo [Werkles] Install Node 18+ ^(LTS^) from https://nodejs.org then run this again.
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do echo [Werkles] Node %%v detected.

REM 2) Dependencies installed? (first run only)
if not exist "node_modules" (
  echo [Werkles] Installing dependencies ^(first run only, may take a minute^)...
  call npm.cmd install
  if errorlevel 1 (
    echo [Werkles] npm install failed. See messages above.
    echo.
    pause
    exit /b 1
  )
)

REM 3) Open the browser shortly after the server starts.
echo [Werkles] Starting dev server at http://localhost:3000
echo [Werkles] Browser opens in ~6 seconds. Keep this window open. Press Ctrl+C to stop.
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 6; Start-Process 'http://localhost:3000'"

REM 4) Run the dev server (foreground; this window stays open).
call npm.cmd run dev

REM If npm run dev exits, pause so the window does not vanish.
echo.
echo [Werkles] Dev server stopped.
pause
endlocal
