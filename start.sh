#!/bin/bash
# Start script for combined Node.js + Python services

echo "� Current directory: $(pwd)"
echo "📂 Available directories:"
ls -la

# Find project root if needed
if [ ! -d "backend" ]; then
    echo "🔍 Looking for backend directory..."
    if [ -d "../backend" ]; then
        cd ..
        echo "✅ Found backend directory one level up"
    else
        PROJECT_ROOT=$(find . -name "backend" -type d -exec dirname {} \; | head -1)
        if [ -n "$PROJECT_ROOT" ]; then
            cd "$PROJECT_ROOT"
            echo "✅ Found project root at: $PROJECT_ROOT"
        else
            echo "❌ Could not find backend directory"
            exit 1
        fi
    fi
fi

echo "📁 Working from: $(pwd)"

echo "�🚀 Starting Node.js backend..."
cd backend && node server.js &
BACKEND_PID=$!

echo "🤖 Starting Python AI service..."
cd ../ai-models && uvicorn api.main:app --host 0.0.0.0 --port 8000 &
AI_PID=$!

echo "✅ Both services started!"
echo "Backend PID: $BACKEND_PID"
echo "AI Service PID: $AI_PID"

# Wait for both processes
wait