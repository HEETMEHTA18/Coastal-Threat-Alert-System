#!/usr/bin/env bash
set -e

# Combined startup script for Render free-tier deployment
# Starts Node backend and Python AI models in one service

PORT=${PORT:-10000}
echo "🚀 Starting CTAS Combined Service (FREE TIER) on port ${PORT}"

# Start AI models on port 8000 in background
echo "📍 Starting AI Models API on port 8000..."
cd ai-models
python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &
AI_PID=$!
cd ..

# Wait for AI to initialize
echo "⏳ Waiting for AI API to initialize..."
sleep 8

# Start backend on $PORT (foreground)
echo "📍 Starting Backend on port ${PORT}..."
cd backend
PORT=${PORT} node src/server.js &
BACKEND_PID=$!
cd ..

# Keep script running and forward signals
trap "echo 'Shutting down...'; kill ${AI_PID} ${BACKEND_PID} 2>/dev/null || true" EXIT

echo "✅ Both services started successfully!"
echo "   - AI Models: http://localhost:8000"
echo "   - Backend: http://0.0.0.0:${PORT}"

# Wait for backend (main process)
wait ${BACKEND_PID}
