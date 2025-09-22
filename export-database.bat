@echo off
echo ========================================
echo PawMart Database Export Script
echo ========================================
echo.

echo This script will export your current database for transfer.
echo.

REM Check if PostgreSQL is accessible
echo Checking PostgreSQL connection...
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL command line tools not found!
    echo Make sure PostgreSQL is installed and psql is in your PATH
    pause
    exit /b 1
)

echo ✓ PostgreSQL tools found

echo.
echo Please enter your database details:
echo.

set /p DB_NAME="Database name (default: pawmart): "
if "%DB_NAME%"=="" set DB_NAME=pawmart

set /p DB_USER="Database user (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_HOST="Database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

echo.
echo Exporting database '%DB_NAME%' from '%DB_HOST%' as user '%DB_USER%'...
echo.

REM Export the database
pg_dump -U %DB_USER% -h %DB_HOST% %DB_NAME% > pawmart_backup.sql

if %errorlevel% neq 0 (
    echo ERROR: Failed to export database!
    echo Please check your database credentials and connection.
    pause
    exit /b 1
)

echo ✓ Database exported successfully to 'pawmart_backup.sql'
echo.
echo File size:
dir pawmart_backup.sql | find "pawmart_backup.sql"
echo.
echo Copy this file to the target PC along with your codebase.
echo.
pause 