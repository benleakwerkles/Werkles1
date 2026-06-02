@echo off
title Foreman Control Panel
cd /d "C:\Users\benle\Desktop\github\Werkles"
echo Starting Foreman Control Panel on http://127.0.0.1:4317 ...
echo (NOT localhost:3000 — that is the Werkles app preview / npm run dev)
node "C:\Users\benle\Desktop\github\Werkles\scripts\foreman\foreman-control-server.mjs"
if errorlevel 1 (
  echo.
  echo FOREMAN CONTROL PANEL FAILED - see above
  echo If port 4317 is occupied by an unknown process: HUMAN GATE REQUIRED - close it manually.
  pause
  exit /b %errorlevel%
)
