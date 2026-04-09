@echo off
setlocal
title FyndMate Launcher

set ROOT=%~dp0
cd /d "%ROOT%"

echo ===============================================
echo Starting FyndMate (Frontend + Backend)
echo ===============================================
echo.

if not exist "%ROOT%backend\.env" (
  echo backend\.env not found. Creating template...
  call "%ROOT%setup-env-template.bat"
)

where py >nul 2>nul
if %errorlevel% neq 0 (
  echo Python not found in PATH. Install Python 3.11+ and restart.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if %errorlevel% neq 0 (
  echo pnpm not found. Installing pnpm globally...
  where npm >nul 2>nul
  if %errorlevel% neq 0 (
    echo npm not found. Please install Node.js LTS first.
    pause
    exit /b 1
  )
  call npm install -g pnpm
)

if not exist "%ROOT%backend\.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv "%ROOT%backend\.venv"
)

echo Installing backend dependencies...
call "%ROOT%backend\.venv\Scripts\python.exe" -m pip install --upgrade pip
call "%ROOT%backend\.venv\Scripts\python.exe" -m pip install -r "%ROOT%backend\requirements.txt"

echo Installing frontend dependencies...
call pnpm install --dir "%ROOT%frontend"

echo.
echo Launching backend API on http://localhost:8000
start "FyndMate Backend" cmd /k "cd /d "%ROOT%backend" && ..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Launching frontend on http://localhost:5173
start "FyndMate Frontend" cmd /k "cd /d "%ROOT%frontend" && pnpm dev --host --port 5173"

echo.
echo FyndMate is starting...
echo Frontend: http://localhost:5173
echo Backend : http://localhost:8000/health
echo.
echo Use stop-fyndmate.bat to close running servers.
pause
