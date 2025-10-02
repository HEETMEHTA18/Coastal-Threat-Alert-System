#!/bin/bash
# Build script for Render deployment

echo "🔧 Installing Node.js dependencies..."
cd backend && npm install

echo "🐍 Installing Python dependencies..."
cd ../ai-models && pip install -r requirements.txt

echo "✅ Build completed successfully!"