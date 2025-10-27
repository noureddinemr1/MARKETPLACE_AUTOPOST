#!/bin/bash

# Autopost Application Shutdown Script
# This script stops all services using Docker Compose

echo "========================================"
echo "  Stopping Autopost Application"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi

echo "🛑 Stopping all containers..."
docker-compose down

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Application stopped successfully!"
    echo ""
else
    echo ""
    echo "❌ Failed to stop application"
    echo "Try: docker-compose down -v (to remove volumes too)"
    exit 1
fi
