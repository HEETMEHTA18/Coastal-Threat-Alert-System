#!/usr/bin/env bash
set -e

# Combined startup script for Render single-service deployment (temporary)
# Starts Node backend (foreground via background process) and AI uvicorn on PORT

PORT=${PORT:-10000}
echo "🚀 Starting combined service. PORT=${PORT}"

echo "📍 Starting Node backend..."
# Run node backend in background (uses src/server.js path)
node backend/src/server.js &
BACKEND_PID=$!

echo "📍 Starting AI models (uvicorn) on port ${PORT}..."
cd ai-models
# Run uvicorn in foreground so Render can see the open port
exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT}

# If uvicorn exits, kill backend
trap "echo 'Shutting down backend'; kill ${BACKEND_PID} || true" EXIT
