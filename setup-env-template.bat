@echo off
setlocal
title FyndMate Env Setup

set ROOT=%~dp0
set ENV_FILE=%ROOT%backend\.env

if exist "%ENV_FILE%" (
  echo backend\.env already exists. Open it and edit keys if needed.
  start notepad "%ENV_FILE%"
  exit /b 0
)

(
echo OPENAI_API_KEY=
echo RAPIDAPI_KEY=
echo RAPIDAPI_HOST=real-time-amazon-data.p.rapidapi.com
echo ALLOW_ORIGINS=http://localhost:5173
) > "%ENV_FILE%"

echo Created backend\.env
echo Please paste your keys in the opened file and save.
start notepad "%ENV_FILE%"
pause
