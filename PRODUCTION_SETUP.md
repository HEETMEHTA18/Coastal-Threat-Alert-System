# 🚀 Production Deployment - Final Setup

## ✅ Codebase Cleaned Up

Removed unnecessary files:
- CSV training data files (7 files)
- Root-level scripts (build.sh, start.sh)
- Jupyter notebooks (threat_model.ipynb)
- Duplicate documentation files
- Unused Dockerfile.render
- Root package.json

**Status**: ✅ Codebase is now clean and error-free

---

## 🔧 Current Render Service Configuration

Your existing service at `https://coastal-threat-alert-system-ctq6.onrender.com` is now configured to run **ONLY the Node.js backend**.

### What's Working:
✅ Backend endpoints (auth, reports, weather proxy)
✅ Health check at `/api/health`
✅ CORS configured for Vercel frontend

### What's NOT Working:
❌ AI predictions (no Python service running)
❌ ML model endpoints return errors

---

## 📋 TO MAKE EVERYTHING WORK IN PRODUCTION

You have **ONE** existing service. You need to add **ONE MORE** service for AI models.

### Step 1: Verify Current Backend Service (5 min)

1. Go to: https://dashboard.render.com/
2. Open service: "Coastal-Threat-Alert-System"
3. Check Environment Variables are set:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret  
   CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
   OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
   NOAA_CDO_API_KEY=your-noaa-key
   ```
4. Test: `https://coastal-threat-alert-system-ctq6.onrender.com/api/health`
   Should return: `{"status":"ok"}`

### Step 2: Deploy NEW AI Models Service (15 min)

1. **Render Dashboard** → "New +" → "Web Service"
2. **Repository**: `HEETMEHTA18/Coastal-Guardian`
3. **CRITICAL**: Set **Root Directory** = `ai-models`
4. Configuration:
   ```
   Name: ctas-ai-models
   Environment: Python 3
   Branch: main
   Root Directory: ai-models
   Build Command: pip install -r requirements.txt
   Start Command: ./start.sh
   Plan: Starter ($7/month recommended - Free may run out of memory)
   ```
5. Environment Variables:
   ```
   PYTHON_VERSION=3.11
   ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://coastal-threat-alert-system-ctq6.onrender.com
   OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
   ```
6. Health Check Path: `/api/health`
7. Click **"Create Web Service"**
8. **WAIT** for deployment (~10-15 min - installs ML libraries)
9. **SAVE THE URL**: e.g., `https://ctas-ai-models.onrender.com`

### Step 3: Update Frontend on Vercel (5 min)

1. **Vercel Dashboard** → Your Project → Settings → Environment Variables
2. Add/Update these variables:
   ```
   VITE_NODE_API_URL = https://coastal-threat-alert-system-ctq6.onrender.com
   VITE_AI_API_URL = https://ctas-ai-models.onrender.com
   ```
   (Use the actual AI service URL from Step 2)

3. **Redeploy**: 
   - Vercel Dashboard → Deployments → Latest → "..." → Redeploy
   - OR trigger with empty commit:
     ```bash
     git commit --allow-empty -m "Redeploy with new env vars"
     git push
     ```

### Step 4: Update CORS (2 min)

After AI service is deployed, update its CORS:

1. Render Dashboard → ctas-ai-models → Environment Variables
2. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://coastal-threat-alert-system-ctq6.onrender.com
   ```
3. Save (will redeploy)

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Backend health: `https://coastal-threat-alert-system-ctq6.onrender.com/api/health`
- [ ] AI health: `https://ctas-ai-models.onrender.com/api/health`  
- [ ] Frontend loads: `https://coastal-threat-alert-system-two.vercel.app`
- [ ] Login works
- [ ] AI predictions work (dashboard shows alerts)
- [ ] No CORS errors in browser console

---

## 🐛 If AI Service Fails to Deploy

**Error: Out of memory**
- Solution: Upgrade to Starter plan ($7/month)

**Error: Model files not found**
- Solution: Already fixed - models are in git

**Error: Permission denied (start.sh)**
- Solution: Already fixed - file is executable

**Error: Port binding timeout**
- Solution: Already fixed - start.sh uses PORT env variable

---

## 📊 Final Architecture

```
Frontend (Vercel)
    ↓
Backend (Render - Free)
Port 10000
/api/auth, /api/reports, /api/weather
    +
AI Models (Render - Starter)
Port 10000
/api/predict_alert, /api/forecast, /api/cyclone
    ↓
MongoDB Atlas (Cloud)
```

---

## 🎯 Estimated Total Cost

- Frontend (Vercel): **FREE**
- Backend (Render): **FREE**
- AI Models (Render): **$7/month** (Starter plan)
- MongoDB (Atlas): **FREE** (512MB tier)

**Total: $7/month**

---

## 📝 Quick Commands Reference

**Start Local Development:**
```bash
# Terminal 1 - Backend
cd backend
node src/server.js

# Terminal 2 - AI Models  
cd ai-models
uvicorn api.main:app --host 0.0.0.0 --port 8000

# Terminal 3 - Frontend
cd frontend
npm run dev
```

**Deploy Changes:**
```bash
git add .
git commit -m "your message"
git push
```

---

## 🆘 Need Help?

1. Check service logs in Render Dashboard
2. Check browser console for errors
3. Test health endpoints directly
4. Verify environment variables are set
5. Make sure services aren't sleeping (free tier)
