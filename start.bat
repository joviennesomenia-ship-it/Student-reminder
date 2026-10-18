@echo off
setlocal
cd /d "%~dp0"
title Student Reminder - Setup and Run
echo.
echo ===== Student Reminder: setup and run =====
echo.

if not exist backend\package.json (
  echo.
  echo This file is not inside the project folder.
  echo I am looking in: %~dp0
  echo That folder should contain the folders named backend and frontend.
  echo Move start.bat and setup.mjs into the folder that has them, then try again.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the download page...
  echo Install the LTS version, then double-click this file again.
  start https://nodejs.org
  pause
  exit /b 1
)

echo [1/5] Installing backend packages. This can take a few minutes the first time...
pushd backend
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail
popd

echo.
echo [2/5] Installing frontend packages...
pushd frontend
call npm install --no-audit --no-fund
if errorlevel 1 goto :fail
popd

echo.
echo [3/5] Creating settings files...
if not exist backend\node_modules\bcryptjs (
  echo A needed package is missing. Installing it directly...
  pushd backend
  call npm install bcryptjs@2.4.3 --save-exact --no-audit --no-fund
  if errorlevel 1 goto :fail
  popd
)
node setup.mjs
if errorlevel 1 goto :fail

echo [4/5] Preparing the database...
set "FRESH=0"
if not exist backend\prisma\dev.db set "FRESH=1"
pushd backend
call npx prisma db push
if errorlevel 1 goto :fail
if "%FRESH%"=="1" (
  call npm run db:seed
  if errorlevel 1 goto :fail
)
popd

echo.
echo [5/5] Starting the servers in two new windows. Leave them open while you use the site.
start "Backend server (leave open)" /D "%~dp0backend" cmd /k npm run dev
start "Frontend server (leave open)" /D "%~dp0frontend" cmd /k npm run dev
timeout /t 8 /nobreak >nul
start http://localhost:5173

echo.
echo Done. The site opens at http://localhost:5173
echo To stop everything, close the two server windows.
echo Next time, you can double-click this file again to start it.
echo.
pause
exit /b 0

:fail
echo.
echo Something went wrong. Scroll up to read the error message and send it to Claude.
pause
exit /b 1
