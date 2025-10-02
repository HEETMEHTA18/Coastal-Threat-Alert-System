#!/bin/bash
# Build script for Render deployment

echo "� Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo "�🔧 Installing Node.js dependencies..."
cd backend && npm install && cd ..

echo "🐍 Installing Python dependencies..."
cd ai-models && pip install -r requirements.txt && cd ..

echo "✅ Build completed successfully!"