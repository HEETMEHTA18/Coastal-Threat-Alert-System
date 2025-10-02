# 🚀 Render AI Models Deployment Guide

## 📋 Prerequisites
- GitHub repository with latest code (✅ Done)
- Render account with existing Node.js service running

## 🛠️ Deployment Options

### Option A: Add AI to Existing Render Service (Recommended)

#### Step 1: Update Your Existing Render Service
1. Go to your Render dashboard
2. Select your existing Node.js service
3. Go to "Settings" → "Build & Deploy"
4. Update the **Build Command**:
   ```bash
   npm install && pip install -r ai-models/requirements.txt
   ```
5. Update the **Start Command**:
   ```bash
   node backend/server.js & uvicorn ai-models.api.main:app --host 0.0.0.0 --port 8000
   ```

#### Step 2: Add Environment Variables
Add these to your Render service environment variables:
- `PYTHON_VERSION`: `3.11`
- `OPENAI_API_KEY`: `your-openai-api-key`
- `OPENWEATHER_API_KEY`: `your-weather-api-key`

### Option B: Create Separate AI Service

#### Step 1: Create New Render Service
1. Go to Render dashboard → "New" → "Web Service"
2. Connect to your GitHub repository
3. Use these settings:
   - **Name**: `ctas-ai-models`
   - **Root Directory**: `ai-models`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

#### Step 2: Set Environment Variables
- `OPENAI_API_KEY`: `your-openai-api-key`
- `OPENWEATHER_API_KEY`: `your-weather-api-key`

## 🌐 Production URLs
After deployment, your services will be available at:
- **Node.js Backend**: `https://your-service-name.onrender.com`
- **AI Models** (if separate): `https://ctas-ai-models.onrender.com`
- **AI Models** (if combined): `https://your-service-name.onrender.com:8000`

## 🔧 Next Steps
1. Deploy the service(s)
2. Update frontend configuration to use production URLs
3. Test all AI predictions work correctly

## 📝 Environment Variables Needed
```
OPENAI_API_KEY=your-openai-api-key
OPENWEATHER_API_KEY=your-openweather-api-key
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

## 🚨 Important Notes
- Free tier services may spin down after inactivity
- Consider upgrading to paid plan for production use
- Monitor logs for any deployment issues