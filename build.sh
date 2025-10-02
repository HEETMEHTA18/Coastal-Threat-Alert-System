#!/bin/bash
# Build script for Render deployment

echo "📁 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

# Find and navigate to project root
if [ -d "backend" ]; then
    echo "✅ Found backend directory in current location"
    PROJECT_ROOT="."
elif [ -d "../backend" ]; then
    echo "✅ Found backend directory one level up"
    PROJECT_ROOT=".."
    cd ..
else
    echo "🔍 Searching for backend directory..."
    find . -name "backend" -type d -exec dirname {} \; | head -1 > /tmp/project_root
    if [ -s /tmp/project_root ]; then
        PROJECT_ROOT=$(cat /tmp/project_root)
        cd "$PROJECT_ROOT"
        echo "✅ Found project root at: $PROJECT_ROOT"
    else
        echo "❌ Could not find backend directory"
        exit 1
    fi
fi

echo "📁 Working from: $(pwd)"
echo "📂 Contents:"
ls -la

echo "🔧 Installing Node.js dependencies..."
cd backend && npm install && cd ..

echo "🐍 Installing Python dependencies..."
cd ai-models && pip install -r requirements.txt && cd ..

echo "✅ Build completed successfully!"Build script for Render deployment

echo "� Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo "�🔧 Installing Node.js dependencies..."
cd backend && npm install && cd ..

echo "🐍 Installing Python dependencies..."
cd ai-models && pip install -r requirements.txt && cd ..

echo "✅ Build completed successfully!"