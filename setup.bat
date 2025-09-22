@echo off
echo ========================================
echo PawMart Project Setup Script
echo ========================================
echo.

echo Checking prerequisites...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✓ Node.js is installed
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
) else (
    echo ✓ npm is installed
)

echo.
echo ========================================
echo Installing Backend Dependencies
echo ========================================
cd paw-mart-backend
echo Installing backend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed

echo.
echo Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client!
    pause
    exit /b 1
)
echo ✓ Prisma client generated

cd ..

echo.
echo ========================================
echo Installing Frontend Dependencies
echo ========================================
cd paw-mart-frontend
echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is installed and running
echo 2. Create the database and import your backup
echo 3. Create .env files with your configuration
echo 4. Start the servers:
echo    - Backend: cd paw-mart-backend && npm run dev
echo    - Frontend: cd paw-mart-frontend && npm run dev
echo.
echo See TRANSFER_GUIDE.md for detailed instructions.
echo.
pause 