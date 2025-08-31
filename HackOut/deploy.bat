@echo off
REM CTAS Production Deployment Script for Windows

echo 🌊 Starting CTAS Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Build and start services
echo 📦 Building Docker images...
docker-compose -f docker-compose.yml build --no-cache

echo 🚀 Starting services...
docker-compose -f docker-compose.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service health...
docker-compose -f docker-compose.yml ps | findstr "Up" >nul
if errorlevel 1 (
    echo ❌ Deployment failed. Check logs with: docker-compose logs
    exit /b 1
) else (
    echo ✅ CTAS deployed successfully!
    echo.
    echo 🌐 Frontend: http://localhost
    echo 🔗 Backend API: http://localhost:5000
    echo 🤖 AI Service: http://localhost:8000
    echo.
    echo 📊 To view logs: docker-compose logs -f
    echo 🛑 To stop: docker-compose down
)
