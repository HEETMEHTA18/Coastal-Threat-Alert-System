#!/bin/bash
# CTAS Vercel Deployment Script

echo "🌊 Deploying CTAS to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy frontend
echo "🚀 Deploying Frontend..."
cd frontend
vercel --prod --confirm
FRONTEND_URL=$(vercel ls | grep ctas-frontend | head -1 | awk '{print $2}')
echo "✅ Frontend deployed: $FRONTEND_URL"

# Deploy backend
echo "🚀 Deploying Backend..."
cd ../backend
vercel --prod --confirm
BACKEND_URL=$(vercel ls | grep ctas-backend | head -1 | awk '{print $2}')
echo "✅ Backend deployed: $BACKEND_URL"

echo ""
echo "🎉 CTAS Deployment Complete!"
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo ""
echo "⚠️  Don't forget to:"
echo "1. Update frontend environment variables with backend URL"
echo "2. Set up MongoDB Atlas database"
echo "3. Configure domain names (optional)"
echo ""
echo "🌊 CTAS is protecting our coasts! 🌊"
