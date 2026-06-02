@echo off
title Werkles Crew Dispatch
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\foreman\crew-dispatch-console.ps1"
if errorlevel 1 (
  echo.
  echo DISPATCH FAILED - see above
  pause
)
