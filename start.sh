#!/bin/bash
# Start script for combined Node.js + Python services

echo "🚀 Starting Node.js backend..."
cd backend && node server.js &

echo "🤖 Starting Python AI service..."
cd ai-models && uvicorn api.main:app --host 0.0.0.0 --port 8000 &

echo "✅ Both services started!"
wait