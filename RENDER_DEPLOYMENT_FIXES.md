# 🔧 Render Deployment Fixes

**Issue:** Model files not found, port binding problems, CORS configuration missing

---

## ✅ FIXES APPLIED

### 1. **AI Models API - Model Loading Fix**

**Problem:** `alert_model.pkl` not found in production
```
WARNING - Could not load alert prediction model: [Errno 2] No such file or directory: '/opt/render/project/src/ai-models/alert_model.pkl'
```

**Solution:** Updated `ai-models/api/main.py` to check multiple possible paths:
- Local development: `../alert_model.pkl`
- Production: `./alert_model.pkl` (current working directory)
- Render absolute path: `/opt/render/project/src/alert_model.pkl`
- One level up from cwd

### 2. **AI Models - render.yaml Configuration**

**Changes:**
```yaml
services:
  - type: web
    name: ctas-ai-models
    env: python
    plan: starter
    rootDir: ./ai-models          # ✅ Added: Set working directory
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn api.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PORT
        value: 10000            # ✅ Added: Explicit port
      - key: ALLOWED_ORIGINS    # ✅ Added: CORS configuration
        value: "https://coastal-threat-alert-system-two.vercel.app,https://coastal-threat-alert-system-ctq6.onrender.com"
    healthCheckPath: "/api/health"
```

### 3. **Backend - render.yaml Configuration**

**Changes:**
```yaml
services:
  - type: web
    name: ctas-backend
    env: node
    plan: free
    rootDir: ./backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 10000
      - key: CORS_ORIGINS       # ✅ Fixed: Was CORS_ORIGIN (singular)
        value: https://coastal-threat-alert-system-two.vercel.app
      - key: NOAA_CDO_API_KEY   # ✅ Fixed: Was NOAA_API_KEY
        sync: false
    healthCheckPath: /api/health # ✅ Added: Health check endpoint
```

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Commit and Push Fixes

```bash
git add .
git commit -m "fix: Render deployment issues - model loading and port binding"
git push origin main
```

### Step 2: Redeploy on Render

Render should auto-deploy after detecting the push. If not:
1. Go to Render dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Step 3: Set Environment Variables in Render

#### Backend Service Environment Variables:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://your-other-domains.com
OPENWEATHER_API_KEY=<your_key>
NOAA_CDO_API_KEY=<your_key>
```

#### AI Models Service Environment Variables:
```
PORT=10000
PYTHON_VERSION=3.11
OPENAI_API_KEY=<your_key>
OPENWEATHER_API_KEY=<your_key>
ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://coastal-threat-alert-system-ctq6.onrender.com
```

---

## 🔍 VERIFICATION

### Check if AI Models API is Running:

```bash
# Test health endpoint
curl https://your-ai-api.onrender.com/api/health

# Expected response:
{
  "status": "healthy",
  "models_ready": "3/5",
  "timestamp": "2025-11-17T..."
}
```

### Check if Backend is Running:

```bash
# Test health endpoint
curl https://your-backend.onrender.com/api/health

# Expected response:
{
  "status": "OK",
  "message": "CTAS Backend Server is running"
}
```

### Check Model Loading:

Look for these log messages in Render logs:
```
✅ Alert prediction model loaded from: /path/to/alert_model.pkl
🔐 CORS enabled for origins: [...]
INFO: Uvicorn running on http://0.0.0.0:10000
```

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue 1: "No open ports detected"
**Cause:** App not binding to `0.0.0.0:$PORT`

**Solution:** 
- Backend: Uses `process.env.PORT` ✅
- AI Models: Uses `--port $PORT` in uvicorn command ✅

### Issue 2: "alert_model.pkl not found"
**Cause:** Model files not included in git or wrong path

**Solution:** 
- Check `.gitignore` - uncommented `# *.pkl` to allow model files ✅
- Updated path resolution to check multiple locations ✅

### Issue 3: "MODULE_NOT_FOUND"
**Cause:** Missing dependencies or wrong rootDir

**Solution:**
- Added `rootDir: ./backend` and `rootDir: ./ai-models` to render.yaml ✅
- Ensure `package.json` and `requirements.txt` are in correct directories ✅

### Issue 4: CORS errors in production
**Cause:** CORS_ORIGINS not set or wrong format

**Solution:**
- Backend: Uses `CORS_ORIGINS` (plural) ✅
- AI Models: Uses `ALLOWED_ORIGINS` ✅
- Both accept comma-separated values ✅

---

## 📊 EXPECTED LOGS (Success)

### AI Models Service:
```
2025-11-17 - INFO - 🔐 CORS enabled for origins: ['https://...']
2025-11-17 - INFO - ✅ Alert prediction model loaded from: /opt/render/project/src/ai-models/alert_model.pkl
2025-11-17 - INFO - Initializing AI models...
2025-11-17 - INFO - ✓ Coastal Threat Model initialized
2025-11-17 - INFO - ✓ Sea Level Anomaly Detector initialized
2025-11-17 - INFO - ✓ Cyclone Trajectory Model initialized
2025-11-17 - INFO - 🌊 AI models initialization completed!
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:10000
==> Port 10000 detected, continuing...
==> Your service is live 🎉
```

### Backend Service:
```
🔐 CORS enabled for origins: [ 'https://coastal-threat-alert-system-two.vercel.app' ]
✅ MongoDB Connected Successfully!
✅ Cache initialized: 0 items
🚀 CTAS Backend Server Started Successfully!
📍 Server: http://localhost:10000
==> Port 10000 detected, continuing...
==> Your service is live 🎉
```

---

## 🎯 CHECKLIST

Before redeploying:
- [x] Fixed model loading paths
- [x] Added `rootDir` to render.yaml
- [x] Set PORT environment variable
- [x] Fixed CORS_ORIGINS (plural)
- [x] Added ALLOWED_ORIGINS for AI API
- [x] Added health check paths
- [x] Committed changes to git

After deploying:
- [ ] Check Render logs for "Port 10000 detected"
- [ ] Test health endpoints
- [ ] Verify CORS allows frontend domain
- [ ] Test ML predictions endpoint
- [ ] Test chatbot functionality
- [ ] Monitor for any errors

---

## 🔗 USEFUL RENDER COMMANDS

```bash
# View live logs
render logs --service ctas-backend --tail

# Trigger manual deploy
render deploy --service ctas-backend

# Check service status
render services list
```

---

## 📝 NOTES

1. **Model files (.pkl):** Now included in git (`.gitignore` allows them)
2. **Port binding:** Both services explicitly bind to `0.0.0.0:$PORT`
3. **Working directory:** Set correctly with `rootDir` in render.yaml
4. **CORS:** Environment variable based, can be updated without code changes
5. **Health checks:** Both services have proper health check endpoints

---

**✅ All fixes applied! Ready to push and redeploy.**
