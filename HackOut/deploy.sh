#!/bin/bash

# CTAS Production Deployment Script

echo "🌊 Starting CTAS Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.yml build --no-cache

echo "🚀 Starting services..."
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service health..."
if docker-compose -f docker-compose.yml ps | grep -q "Up"; then
    echo "✅ CTAS deployed successfully!"
    echo ""
    echo "🌐 Frontend: http://localhost"
    echo "🔗 Backend API: http://localhost:5000"
    echo "🤖 AI Service: http://localhost:8000"
    echo ""
    echo "📊 To view logs: docker-compose logs -f"
    echo "🛑 To stop: docker-compose down"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi
