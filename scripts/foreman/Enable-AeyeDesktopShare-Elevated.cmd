@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "SCRIPT=%SCRIPT_DIR%Enable-AeyeDesktopShare.ps1"

if not exist "%SCRIPT%" (
  echo BLOCKER: Enable-AeyeDesktopShare.ps1 not found beside this launcher.
  exit /b 2
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath powershell.exe -Verb RunAs -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File','\"%SCRIPT%\"')"
if errorlevel 1 (
  echo BLOCKER: Could not launch elevated PowerShell.
  exit /b 1
)

echo ACK: Elevated AeyeDesktop share bootstrap requested.
echo A Windows admin prompt should appear. Accept it on the source machine to create \\%COMPUTERNAME%\AeyeDesktop.
