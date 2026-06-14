@echo off
chcp 65001 >nul
title Python Function Study
echo.
echo   Python Function Study
echo   =====================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   Node.js not found! Please install Node.js first.
    echo   Download: https://nodejs.org
    echo.
    pause
    exit /b 1
)

set NODE_ENV=production
set PORT=3001

echo   Starting server at http://localhost:%PORT%
echo   Close this window or the browser to stop.
echo   =====================
echo.

node server.cjs

pause
