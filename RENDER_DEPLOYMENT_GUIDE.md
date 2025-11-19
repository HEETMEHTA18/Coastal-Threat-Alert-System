# Render Deployment Guide - Complete Fix

## ⚠️ CRITICAL: The Root Problem

Render is trying to deploy from the **ROOT render.yaml** which attempts to run BOTH backend AND AI models in one service. This is incorrect!

You need to deploy **TWO SEPARATE SERVICES** on Render:
1. **Backend Service** (Node.js) - using `backend/render.yaml`
2. **AI Models Service** (Python) - using `ai-models/render.yaml`

## 🔧 Step-by-Step Fix

### Step 1: Delete the Current Deployment

1. Go to Render Dashboard
2. Find the service named "Coastal-Threat-Alert-System"
3. Click on it → Settings → Delete Service
4. Confirm deletion

### Step 2: Deploy Backend Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `HEETMEHTA18/Coastal-Guardian`
4. **IMPORTANT**: In the "Root Directory" field, enter: `backend`
5. Service configuration:
   - **Name**: `ctas-backend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ CRITICAL
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Plan**: Free

6. Environment Variables (Add these in Render dashboard):
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
   OPENWEATHER_API_KEY=<your-openweather-key>
   NOAA_CDO_API_KEY=<your-noaa-key>
   ```

7. Health Check Path: `/api/health`

8. Click "Create Web Service"

### Step 3: Deploy AI Models Service

1. Go to Render Dashboard again
2. Click "New +" → "Web Service"
3. Connect the **SAME** GitHub repository: `HEETMEHTA18/Coastal-Guardian`
4. **IMPORTANT**: In the "Root Directory" field, enter: `ai-models`
5. Service configuration:
   - **Name**: `ctas-ai-models`
   - **Environment**: `Python 3`
   - **Branch**: `main`
   - **Root Directory**: `ai-models` ⚠️ CRITICAL
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `./start.sh`
   - **Plan**: Starter (Free tier might not have enough memory for ML models)

6. Environment Variables:
   ```
   PYTHON_VERSION=3.11
   ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-backend.onrender.com
   OPENWEATHER_API_KEY=<your-openweather-key>
   ```

7. Health Check Path: `/api/health`

8. Click "Create Web Service"

### Step 4: Make start.sh Executable (if needed)

If the start.sh fails with permission errors, you may need to:

1. In your local repository:
   ```bash
   git update-index --chmod=+x ai-models/start.sh
   git commit -m "Make start.sh executable"
   git push
   ```

## 🎯 Why This Works

1. **Separate Services**: Each service has its own runtime environment
2. **Correct Root Directory**: Render knows where to find files
3. **Proper Port Binding**: The start.sh script uses `${PORT:-10000}` which reads from environment
4. **No Path Confusion**: No more `cd backend` or `cd ai-models` - each service starts in its root

## ✅ Expected Results

**Backend Service Logs:**
```
npm install complete
Server starting...
Connected to MongoDB
Server listening on port 10000
Health check endpoint ready at /api/health
```

**AI Models Service Logs:**
```
pip install complete
🚀 Starting CTAS AI Models API on port 10000
📝 Environment PORT variable: 10000
INFO: Uvicorn running on http://0.0.0.0:10000
✅ Alert prediction model loaded
✓ Coastal Threat Model initialized
✓ Sea Level Anomaly Detector initialized
✓ Cyclone Trajectory Model initialized
🌊 AI models initialization completed!
```

## 🔗 After Deployment

1. Note down both service URLs:
   - Backend: `https://ctas-backend.onrender.com`
   - AI Models: `https://ctas-ai-models.onrender.com`

2. Update frontend environment variables:
   ```
   VITE_API_BASE_URL=https://ctas-backend.onrender.com
   VITE_AI_API_BASE_URL=https://ctas-ai-models.onrender.com
   ```

3. Update backend CORS to allow frontend:
   ```
   CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
   ```

4. Update AI models CORS:
   ```
   ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-backend.onrender.com
   ```

## 🐛 Troubleshooting

### If Backend Still Fails
- Check that MongoDB connection string is correct
- Verify JWT_SECRET is set
- Check logs for missing dependencies

### If AI Models Still Shows Port 8000
- Verify start.sh is executable: `ls -la ai-models/start.sh`
- Check environment variable PORT is set in Render
- Review start.sh logs for the PORT value

### If Models Don't Load
- Check that all .pkl files are committed to git
- Verify file paths in main.py
- Ensure Starter plan or higher (Free tier has limited memory)

## 📝 Important Notes

1. **DO NOT use the root render.yaml** - it's now just a README
2. **Deploy services separately** - one at a time from dashboard
3. **Set Root Directory correctly** - this is the most critical step
4. **Use Starter plan for AI service** - Free tier likely won't have enough RAM for ML models
