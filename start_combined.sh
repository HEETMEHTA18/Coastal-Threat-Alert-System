#!/usr/bin/env bash
set -e

# Combined startup script for Render free-tier deployment
# CRITICAL: Backend MUST run on $PORT (10000) for Render health checks

PORT=${PORT:-10000}
echo "🚀 Starting CTAS Combined Service (FREE TIER) on port ${PORT}"
echo "📍 Working directory: $(pwd)"
echo "📍 Node version: $(node --version)"
echo "📍 NPM version: $(npm --version)"
echo "📍 Python version: $(python3 --version)"

# Start AI models on port 8000 in background
echo "📍 Starting AI Models API on port 8000..."
cd ai-models
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --log-level info &
AI_PID=$!
cd ..
echo "✓ AI Models started with PID: ${AI_PID}"

# Wait for AI to initialize
echo "⏳ Waiting 5 seconds for AI API to initialize..."
sleep 5

# Start backend on $PORT (FOREGROUND - this is critical for Render)
echo "📍 Starting Node.js Backend on port ${PORT}..."
cd backend
echo "📍 Backend directory: $(pwd)"
echo "📍 Checking node_modules: $(ls -la node_modules 2>&1 | head -5)"

# Set NODE_PATH to help Node find modules
export NODE_PATH="$(pwd)/node_modules:${NODE_PATH}"
export PORT=${PORT}

# Run backend in FOREGROUND (not background) so Render can detect port
echo "🚀 Executing: node src/server.js"
echo "📍 Environment check:"
echo "   PORT=$PORT"
echo "   NODE_ENV=$NODE_ENV"
echo "   MONGODB_URI=${MONGODB_URI:0:20}..."
echo "   JWT_SECRET=${JWT_SECRET:+set}"
echo "-----------------------------------"
exec node src/server.js
