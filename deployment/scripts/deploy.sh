#!/usr/bin/env bash
# =========================================================================
# InfiniteCareers Production Deployment Automation Script
# =========================================================================

set -e

echo "🚀 [InfiniteCareers Deploy] Starting automated production deployment..."

# 1. Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required."; exit 1; }

# 2. Build local images
echo "📦 Building Spring Boot backend JAR and Docker image..."
docker build -t infinitecareers/backend:latest ./backend

echo "🌐 Building Next.js 14 frontend Docker image..."
docker build -t infinitecareers/frontend:latest ./frontend

# 3. Spin up production stack
echo "🚢 Deploying services via Docker Compose..."
docker compose -f deployment/docker/docker-compose.prod.yml up -d --remove-orphans

# 4. Health Check Verification
echo "⏳ Waiting for health checks to pass..."
sleep 15

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health || echo "FAILED")
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "FAILED")

echo "Backend Status: $BACKEND_HEALTH"
echo "Frontend Status: $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "🎉 [InfiniteCareers Deploy] Production deployment successful and all services healthy!"
else
    echo "⚠️ Warning: One or more services are still initializing. Check logs with 'docker compose logs -f'."
fi
