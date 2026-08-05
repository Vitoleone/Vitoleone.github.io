@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 24 gerekli. Kurulumdan sonra tekrar deneyin.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Gerekli paketler kuruluyor...
  call npm ci
  if errorlevel 1 (
    echo Paket kurulumu basarisiz oldu.
    pause
    exit /b 1
  )
)

call npm run editor
