@echo off
REM CTAS Vercel Deployment Script for Windows

echo 🌊 Deploying CTAS to Vercel...

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
)

REM Deploy frontend
echo 🚀 Deploying Frontend...
cd frontend
vercel --prod --confirm
echo ✅ Frontend deployed!

REM Deploy backend
echo 🚀 Deploying Backend...
cd ..\backend
vercel --prod --confirm
echo ✅ Backend deployed!

echo.
echo 🎉 CTAS Deployment Complete!
echo.
echo ⚠️  Don't forget to:
echo 1. Update frontend environment variables with backend URL
echo 2. Set up MongoDB Atlas database
echo 3. Configure domain names (optional)
echo.
echo 🌊 CTAS is protecting our coasts! 🌊
pause
