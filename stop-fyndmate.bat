@echo off
setlocal
title Stop FyndMate

echo Stopping FyndMate processes on ports 5173 and 8000...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
  taskkill /PID %%p /F >nul 2>nul
)

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
  taskkill /PID %%p /F >nul 2>nul
)

echo Done.
pause
