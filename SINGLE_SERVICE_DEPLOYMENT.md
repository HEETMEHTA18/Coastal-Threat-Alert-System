# 🚀 Single-Service Deployment Guide

## Overview
Deploy both backend (Node.js) and AI models (Python) in **ONE** Render service using Docker.

**Cost: $7/month** (Starter plan required for Docker + sufficient RAM)

---

## 📋 Step 1: Delete Old Service (if exists)

1. Go to: https://dashboard.render.com/
2. Find service: **"Coastal-Threat-Alert-System"**
3. Settings → Delete Service
4. Confirm deletion

---

## 📋 Step 2: Create New Service

### A. Connect Repository

1. **Render Dashboard** → Click **"New +"** → **"Web Service"**
2. Connect repository: **`HEETMEHTA18/Coastal-Guardian`**
3. Click **"Connect"**

### B. Configure Service

```
Name: coastal-threat-alert-system
Region: Oregon (US West)
Branch: main
Root Directory: (leave empty - use repository root)
```

### C. Environment & Build

```
Environment: Docker
Dockerfile Path: ./Dockerfile
Plan: Starter ($7/month)
```

⚠️ **Important**: Must use **Starter plan** or higher - Docker + Python ML libraries need RAM

### D. Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/ctas?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret-here
CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
NOAA_CDO_API_KEY=your-noaa-api-key
ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
```

**How to generate JWT_SECRET**:
```powershell
# In PowerShell:
[System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
```

### E. Health Check

```
Health Check Path: /api/health
```

### F. Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~15-20 minutes)
   - Builds Docker image
   - Installs Node.js dependencies
   - Installs Python ML libraries
   - Starts both services

3. **Save the URL**: e.g., `https://coastal-threat-alert-system-ctq6.onrender.com`

---

## 📋 Step 3: Update Frontend (Vercel)

1. Go to: https://vercel.com/dashboard
2. Select project: **coastal-threat-alert-system-two**
3. **Settings** → **Environment Variables**
4. Add/Update:

```
VITE_NODE_API_URL=https://coastal-threat-alert-system-ctq6.onrender.com
VITE_AI_API_URL=https://coastal-threat-alert-system-ctq6.onrender.com
```

⚠️ **Important**: Both URLs are the SAME (single service handles both)

5. **Environment**: Select all three (Production, Preview, Development)
6. Click **"Save"**

### Redeploy Frontend

**Option A**: From Vercel Dashboard
- Deployments → Latest → "..." menu → Redeploy

**Option B**: Push empty commit
```powershell
git commit --allow-empty -m "Update env vars"
git push
```

---

## 📋 Step 4: Verify Deployment

### Test Backend Health
```powershell
curl https://coastal-threat-alert-system-ctq6.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-22T...",
  "service": "CTAS Backend"
}
```

### Test AI Endpoint
```powershell
curl -X POST https://coastal-threat-alert-system-ctq6.onrender.com/api/predict_alert `
  -H "Content-Type: application/json" `
  -d '{"latitude": 23.02, "longitude": 72.53}'
```

Should return AI predictions (not 500 error)

### Test Frontend
1. Visit: https://coastal-threat-alert-system-two.vercel.app
2. Open console (F12)
3. Look for: `✅ Backend connectivity check passed`
4. Try logging in
5. Check dashboard for AI predictions

---

## ✅ Success Checklist

- [ ] Old service deleted (if existed)
- [ ] New Docker service created on Render
- [ ] All environment variables set
- [ ] Deployment completed successfully
- [ ] Health endpoint returns 200 OK
- [ ] AI endpoint returns predictions
- [ ] Frontend Vercel env vars updated
- [ ] Frontend redeployed
- [ ] Frontend loads without errors
- [ ] Login works
- [ ] Dashboard shows predictions
- [ ] No CORS errors in console

---

## 🔧 How It Works

The Docker container runs:
1. **Python AI service** on port 8000 (internal)
2. **Node.js backend** on port $PORT (10000 - exposed to Render)
3. Backend proxies AI requests to localhost:8000
4. Frontend only talks to backend URL

**Architecture:**
```
Frontend (Vercel)
       ↓
Backend :10000 (Render)
   ↓ (internal)
AI API :8000 (same container)
   ↓
MongoDB (Atlas)
```

---

## 🐛 Troubleshooting

### Build Fails
**Error**: "Out of memory"
- **Fix**: Upgrade to Standard plan ($25/month)

**Error**: "Cannot find Dockerfile"
- **Fix**: Verify Dockerfile exists in repository root
- **Fix**: Check "Dockerfile Path" is `./Dockerfile`

### Service Won't Start
**Error**: "Port binding timeout"
- **Fix**: Check startup script uses `$PORT` environment variable
- **Fix**: Verify backend listens on `process.env.PORT`

**Error**: "Python not found"
- **Fix**: Dockerfile installs Python correctly

### AI Predictions Fail
**Error**: "AI prediction service unavailable"
- **Fix**: Check if AI process started (view logs)
- **Fix**: Verify model files (.pkl) are in repository
- **Fix**: Wait ~10 seconds for AI service to initialize

### Frontend Can't Connect
**Error**: "CORS policy error"
- **Fix**: Verify CORS_ORIGINS includes Vercel URL
- **Fix**: Wait 2-3 minutes after changing env vars

**Error**: "Failed to fetch"
- **Fix**: Check Render service is running (not sleeping)
- **Fix**: Verify Vercel env vars are correct

---

## 📊 Resource Usage

**Single Service (Starter Plan - $7/month):**
- RAM: ~1.5GB (Node + Python + ML models)
- CPU: Moderate
- Disk: ~500MB (dependencies + models)
- Uptime: Always on (no sleep)

**Benefits:**
- ✅ Lower cost ($7/month vs $14/month for two services)
- ✅ Simpler deployment (one service to manage)
- ✅ Faster internal communication (localhost)
- ✅ Single URL to manage

**Limitations:**
- ⚠️ If one service crashes, both go down
- ⚠️ Harder to scale independently
- ⚠️ Longer build times (both dependencies)

---

## 🔄 Updates & Maintenance

### Auto-Deploy Enabled
- Push to `main` branch → automatic deployment
- Build takes ~15-20 minutes

### View Logs
1. Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Look for:
   ```
   🚀 Starting CTAS Combined Service
   📍 Starting AI Models API on port 8000
   📍 Starting Backend on port 10000
   ✅ AI models initialization completed
   Server listening on port 10000
   ```

### Manual Redeploy
1. Render Dashboard → Your Service
2. Click **"Manual Deploy"** → Deploy latest commit

---

## 🔐 Security

- ✅ All sensitive keys in environment variables
- ✅ Environment variables not committed to git
- ✅ CORS configured for Vercel domain only
- ✅ MongoDB Atlas IP whitelist (or allow 0.0.0.0/0)
- ✅ Rate limiting enabled in backend
- ✅ Helmet security headers

---

## 💰 Total Cost

- **Render Starter**: $7/month
- **Vercel**: FREE
- **MongoDB Atlas**: FREE

**Total: $7/month** 🎉

---

## 🎯 You're Done!

Your single-service deployment is complete and production-ready!

**Service URL**: https://coastal-threat-alert-system-ctq6.onrender.com
**Frontend URL**: https://coastal-threat-alert-system-two.vercel.app

Both backend and AI models run in one service, making deployment simple and cost-effective! 🚀
