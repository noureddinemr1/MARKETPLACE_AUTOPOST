@echo off
REM Autopost Application Shutdown Script
REM This script stops all services using Docker Compose

echo ========================================
echo   Stopping Autopost Application
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo X Error: Docker is not running!
    pause
    exit /b 1
)

echo Stopping all containers...
docker-compose down

if errorlevel 1 (
    echo.
    echo X Failed to stop application
    echo Try: docker-compose down -v (to remove volumes too)
    pause
    exit /b 1
)

echo.
echo + Application stopped successfully!
echo.
pause
