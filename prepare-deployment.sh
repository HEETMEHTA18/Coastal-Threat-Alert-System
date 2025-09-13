#!/bin/bash

# CTAS Deployment Preparation Script
# This script helps prepare your project for deployment

echo "🚀 CTAS Deployment Preparation"
echo "================================"

# Check if we're in the correct directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Project structure verified ✅"

# Backend preparation
echo ""
echo "🔧 Preparing Backend for Render..."
cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: backend/package.json not found"
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: backend/render.yaml not found"
    exit 1
fi

echo "   ✅ package.json found"
echo "   ✅ render.yaml found"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "   ⚠️  Please edit backend/.env with your actual values"
else
    echo "   ✅ .env file already exists"
fi

cd ..

# Frontend preparation
echo ""
echo "🌐 Preparing Frontend for Vercel..."
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: frontend/vercel.json not found"
    exit 1
fi

echo "   ✅ package.json found"
echo "   ✅ vercel.json found"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "   ⚠️  Please edit frontend/.env with your actual values"
else
    echo "   ✅ .env file already exists"
fi

cd ..

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit backend/.env with your MongoDB URI and API keys"
echo "2. Edit frontend/.env with your API keys"
echo "3. Push to GitHub"
echo "4. Follow the DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions"