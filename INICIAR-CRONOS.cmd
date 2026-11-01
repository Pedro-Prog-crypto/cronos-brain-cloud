@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 24 ou superior em https://nodejs.org/ e tente novamente.
  pause
  exit /b 1
)
node scripts\start-local.mjs
if errorlevel 1 (
  echo O CRONOS nao iniciou. Leia o erro acima.
  pause
  exit /b 1
)
pause
