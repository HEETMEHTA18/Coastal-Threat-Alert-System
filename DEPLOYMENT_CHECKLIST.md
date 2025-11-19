# 🚀 COMPLETE DEPLOYMENT CHECKLIST

## Current Status: ❌ NOT DEPLOYED YET

Your frontend is failing because:
1. ❌ Backend services are NOT deployed yet (you need to delete old service and create 2 new ones)
2. ❌ Frontend is trying to connect to a non-existent Render URL
3. ❌ CORS errors because the backend doesn't exist

---

## 📋 STEP-BY-STEP DEPLOYMENT PLAN

### PHASE 1: Deploy Backend Services to Render ⏱️ ~15 minutes

#### Step 1.1: Delete Old Service
- [ ] Go to: https://dashboard.render.com/
- [ ] Find service: "Coastal-Threat-Alert-System"
- [ ] Settings → Delete Service → Confirm

#### Step 1.2: Deploy Backend Service (Node.js)
- [ ] Render Dashboard → "New +" → "Web Service"
- [ ] Repository: `HEETMEHTA18/Coastal-Guardian`
- [ ] **Root Directory**: `backend` ⚠️ CRITICAL
- [ ] Configuration:
  ```
  Name: ctas-backend
  Environment: Node
  Branch: main
  Build Command: npm install
  Start Command: node src/server.js
  Plan: Free
  ```
- [ ] Environment Variables (in Render Dashboard):
  ```
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://your-connection-string
  JWT_SECRET=your-secret-here-generate-one
  CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
  OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
  NOAA_CDO_API_KEY=your-noaa-key
  ```
- [ ] Health Check Path: `/api/health`
- [ ] Click "Create Web Service"
- [ ] **WAIT for deployment to complete** (~5-10 minutes)
- [ ] **SAVE the URL**: `https://ctas-backend.onrender.com`

#### Step 1.3: Deploy AI Models Service (Python)
- [ ] Render Dashboard → "New +" → "Web Service"
- [ ] Repository: `HEETMEHTA18/Coastal-Guardian` (same repo!)
- [ ] **Root Directory**: `ai-models` ⚠️ CRITICAL
- [ ] Configuration:
  ```
  Name: ctas-ai-models
  Environment: Python 3
  Branch: main
  Build Command: pip install -r requirements.txt
  Start Command: ./start.sh
  Plan: Starter ($7/month - Free won't work, ML models need RAM)
  ```
- [ ] Environment Variables:
  ```
  PYTHON_VERSION=3.11
  ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-backend.onrender.com
  OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
  ```
- [ ] Health Check Path: `/api/health`
- [ ] Click "Create Web Service"
- [ ] **WAIT for deployment to complete** (~10-15 minutes - installs ML libraries)
- [ ] **SAVE the URL**: `https://ctas-ai-models.onrender.com`

#### Step 1.4: Verify Backend Services
- [ ] Check backend health: `https://ctas-backend.onrender.com/api/health`
- [ ] Check AI health: `https://ctas-ai-models.onrender.com/api/health`
- [ ] Both should return JSON with status: "ok"

---

### PHASE 2: Update Frontend Environment Variables ⏱️ ~5 minutes

#### Step 2.1: Update Vercel Environment Variables
- [ ] Go to: https://vercel.com/dashboard
- [ ] Select your project: "coastal-threat-alert-system-two"
- [ ] Settings → Environment Variables
- [ ] Add/Update these variables:
  ```
  VITE_NODE_API_URL = https://ctas-backend.onrender.com
  VITE_AI_API_URL = https://ctas-ai-models.onrender.com
  ```
  (Use the actual URLs from Step 1.2 and 1.3)
- [ ] Apply to: Production, Preview, Development

#### Step 2.2: Update Backend CORS
- [ ] Go to Render Dashboard → ctas-backend service
- [ ] Settings → Environment Variables
- [ ] Update CORS_ORIGINS to:
  ```
  CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-ai-models.onrender.com
  ```
- [ ] Save changes (will trigger redeploy)

#### Step 2.3: Update AI Models CORS
- [ ] Go to Render Dashboard → ctas-ai-models service
- [ ] Settings → Environment Variables
- [ ] Update ALLOWED_ORIGINS to:
  ```
  ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-backend.onrender.com
  ```
- [ ] Save changes (will trigger redeploy)

---

### PHASE 3: Redeploy Frontend ⏱️ ~3 minutes

#### Step 3.1: Trigger Vercel Redeploy
- [ ] Vercel Dashboard → Your Project → Deployments
- [ ] Click on latest deployment → "..." menu → Redeploy
- [ ] OR: Push any small change to trigger auto-deploy
  ```bash
  git commit --allow-empty -m "Trigger redeploy with new env vars"
  git push
  ```

#### Step 3.2: Verify Frontend
- [ ] Visit: https://coastal-threat-alert-system-two.vercel.app
- [ ] Open browser console (F12)
- [ ] Look for:
  ```
  ✅ Backend connectivity check passed
  🌐 Connectivity Status: Internet ✅, Backend ✅
  ```
- [ ] Try logging in - should work now!

---

## 🎯 SUCCESS CRITERIA

### Backend Service Logs Should Show:
```
✅ npm install complete
✅ Server listening on port 10000
✅ Connected to MongoDB
✅ CORS configured for: https://coastal-threat-alert-system-two.vercel.app
✅ Health check endpoint ready
```

### AI Models Service Logs Should Show:
```
✅ pip install complete
🚀 Starting CTAS AI Models API on port 10000
📝 Environment PORT variable: 10000
INFO: Uvicorn running on http://0.0.0.0:10000
✅ Alert prediction model loaded
✓ Coastal Threat Model initialized
✓ Sea Level Anomaly Detector initialized
✓ Cyclone Trajectory Model initialized
🌊 AI models initialization completed!
```

### Frontend Console Should Show:
```
✅ CTAS Starting up...
✅ Applied dark theme
✅ Backend connectivity check passed
✅ User authenticated (after login)
```

---

## 🐛 TROUBLESHOOTING

### Backend Deploy Fails
- **Error**: "Cannot find module"
  - Solution: Make sure Root Directory is set to `backend`
- **Error**: "MongoDB connection failed"
  - Solution: Check MONGODB_URI in environment variables
- **Error**: "Port binding timeout"
  - Solution: This shouldn't happen anymore - start.sh is fixed

### AI Models Deploy Fails
- **Error**: "Out of memory"
  - Solution: Upgrade to Starter plan ($7/month)
- **Error**: "Model files not found"
  - Solution: Check that .pkl files are in git: `git ls-files ai-models/*.pkl`
- **Error**: "Permission denied: start.sh"
  - Solution: Already fixed - file is executable

### Frontend Still Shows CORS Error
- **Error**: "No 'Access-Control-Allow-Origin' header"
  - Solution: Wait 2-3 minutes after updating CORS env vars (services need to redeploy)
  - Solution: Verify CORS_ORIGINS and ALLOWED_ORIGINS include your Vercel URL

### Frontend Can't Connect
- **Error**: "Failed to fetch"
  - Solution: Check Vercel env vars are set correctly
  - Solution: Verify backend/AI services are actually running (not sleeping)
  - Solution: Test health endpoints directly in browser

---

## 📝 IMPORTANT NOTES

1. **Free Tier Sleep**: Render free services sleep after 15 minutes of inactivity
   - First request takes 50+ seconds to wake up
   - Consider Starter plan for better performance

2. **MongoDB Connection**: Make sure your MongoDB Atlas cluster:
   - Allows connections from anywhere (0.0.0.0/0) OR
   - Whitelists Render's IP addresses

3. **API Keys**: Don't commit real API keys to git
   - Set them in Render dashboard only
   - The ones in .env files are examples

4. **CORS**: Both services need to allow your frontend URL
   - Backend: CORS_ORIGINS
   - AI Models: ALLOWED_ORIGINS

---

## 🆘 NEED HELP?

1. Check service logs in Render Dashboard
2. Check browser console for errors
3. Test health endpoints directly:
   - https://ctas-backend.onrender.com/api/health
   - https://ctas-ai-models.onrender.com/api/health
4. Verify environment variables are set in Render
5. Make sure services aren't sleeping (free tier)

---

## ⏱️ TOTAL TIME ESTIMATE: ~25-30 minutes

- Backend deploy: 5-10 min
- AI Models deploy: 10-15 min
- Frontend config: 5 min
- Testing: 5 min
