@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 24 kurulu degil. Once Node.js 24 kurup tekrar deneyin.
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

node -e "fetch('http://127.0.0.1:4321/').then(() => process.exit(0)).catch(() => process.exit(1))" >nul 2>&1
if not errorlevel 1 (
  echo Onizleme zaten calisiyor. Tarayicida aciliyor...
  start "" "http://127.0.0.1:4321/"
  exit /b 0
)

echo Yeni portfolyo tarayicida aciliyor...
call npm run dev -- --open
