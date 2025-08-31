#!/bin/bash
# Build test script for local verification

echo "🔧 Starting CTAS Frontend Build Test..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build
echo "🏗️ Running build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for Vercel deployment."
    echo "📁 Build output in: dist/"
    ls -la dist/
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
