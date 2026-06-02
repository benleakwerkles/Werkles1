@echo off
title Werkles Aeye Crew Dispatch Bay

set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not exist "%EDGE_EXE%" (
  echo Microsoft Edge was not found at the usual install paths.
  echo Open Edge manually and use the tab list in foreman\crew-dispatch\EDGE_DISPATCH_BAY.md
  pause
  exit /b 1
)

set "REPO=C:\Users\benle\Desktop\github\Werkles"
set "PROFILE=%REPO%\foreman\.edge-aeye-crew-profile"

echo Opening Werkles Aeye Crew Dispatch Bay...
echo Repo: %REPO%
echo.

start "" "%EDGE_EXE%" ^
  --new-window ^
  --user-data-dir="%PROFILE%" ^
  "https://chatgpt.com/" ^
  "https://gemini.google.com/" ^
  "https://claude.ai/" ^
  "https://chat.deepseek.com/" ^
  "https://www.perplexity.ai/" ^
  "http://localhost:4317" ^
  "https://github.com/benleakwerkles/Werkles1" ^
  "https://dashboard.render.com/" ^
  "https://supabase.com/dashboard" ^
  "https://werkles.com/"

echo Edge Dispatch Bay launch command sent.
echo Or use Foreman Dashboard: http://localhost:4317 - Open Aeye Crew Bay button
echo Review tabs manually. No packets were sent.
pause
