#!/bin/bash

# Autopost Application Startup Script
# This script starts all services using Docker Compose

echo "========================================"
echo "  Starting Autopost Application"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed!"
    echo "Please install Docker Compose and try again."
    exit 1
fi

echo "✓ Docker Compose is available"
echo ""

# Stop any running containers
echo "🛑 Stopping any running containers..."
docker-compose down

echo ""
# Remove old images to force complete rebuild
echo "🗑️  Removing old images to force fresh build..."
docker rmi autopost-frontend autopost-backend 2>/dev/null || true

echo ""
# Clean Docker build cache
echo "🧹 Cleaning Docker build cache..."
docker builder prune -f

echo ""
echo "🔨 Building and starting services with fresh build..."
echo ""

# Build and start all services with force recreate
docker-compose up -d --build --force-recreate

# Check if services started successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  ✅ Application Started Successfully!"
    echo "========================================"
    echo ""
    echo "Services running:"
    echo "  🌐 Frontend:  http://localhost:3000"
    echo "  🔧 Backend:   http://localhost:8000"
    echo "  📚 API Docs:  http://localhost:8000/docs"
    echo "  🗄️  MongoDB:   mongodb://localhost:27017"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "To stop the application:"
    echo "  docker-compose down"
    echo ""
else
    echo ""
    echo "========================================"
    echo "  ❌ Failed to Start Application"
    echo "========================================"
    echo ""
    echo "Check the logs with: docker-compose logs"
    exit 1
fi
