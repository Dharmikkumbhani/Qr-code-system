@echo off
echo ========================================
echo Restarting Backend Server
echo ========================================
echo.

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo Node.js processes stopped successfully
) else (
    echo No Node.js processes were running
)
echo.

echo Navigating to backend directory...
cd backend
echo.

echo Starting backend server...
echo.
npm start
