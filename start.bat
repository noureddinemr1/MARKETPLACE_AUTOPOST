@echo off
REM Autopost Application Startup Script
REM This script starts all services using Docker Compose

echo ========================================
echo   Starting Autopost Application
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo X Error: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo + Docker is running
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo X Error: docker-compose is not installed!
    echo Please install Docker Compose and try again.
    pause
    exit /b 1
)

echo + Docker Compose is available
echo.

REM Stop any running containers
echo Stopping any running containers...
docker-compose down
echo.

REM Remove old images to force complete rebuild
echo Removing old images to force fresh build...
docker rmi autopost-frontend autopost-backend 2>nul
echo.

REM Clean Docker build cache
echo Cleaning Docker build cache...
docker builder prune -f
echo.

echo Building and starting services with fresh build...
echo.

REM Build and start all services with force recreate
docker-compose up -d --build --force-recreate

if errorlevel 1 (
    echo.
    echo ========================================
    echo   X Failed to Start Application
    echo ========================================
    echo.
    echo Check the logs with: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ========================================
echo   + Application Started Successfully!
echo ========================================
echo.
echo Services running:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   MongoDB:   mongodb://localhost:27017
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop the application:
echo   docker-compose down
echo.
pause
