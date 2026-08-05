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

echo Uygulama ve baglanti kontrolleri calisiyor...
call npm run verify
if errorlevel 1 goto failed

echo Tarayici testleri calisiyor...
call npx playwright install chromium
if errorlevel 1 goto failed
call npm run test:e2e
if errorlevel 1 goto failed

echo Tum kontroller basariyla tamamlandi.
pause
exit /b 0

:failed
echo Kontroller basarisiz oldu. Yukaridaki hata mesajini inceleyin.
pause
exit /b 1
