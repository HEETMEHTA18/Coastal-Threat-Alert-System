# 🚀 Long-Term Production Deployment Instructions

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Frontend (Vercel - FREE)               │
│  https://coastal-threat-alert-...      │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────────┐  ┌──────────────┐
│  Backend    │  │  AI Models   │
│  (Render)   │  │  (Render)    │
│  Node.js    │  │  Python      │
│  FREE       │  │  $7/month    │
└──────┬──────┘  └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
        ┌──────────────┐
        │  MongoDB     │
        │  (Atlas)     │
        │  FREE        │
        └──────────────┘
```

**Total Monthly Cost: $7** (AI Models Starter plan only)

---

## 📋 Step 1: Delete Old Combined Service

**Why**: The current service tries to run both backend and AI in one container, which causes reliability issues and port conflicts.

1. Go to: https://dashboard.render.com/
2. Find service: **"Coastal-Threat-Alert-System"** or **"coastal-threat-alert-system"**
3. Click on it → **Settings** (bottom left)
4. Scroll down → Click **"Delete Service"**
5. Type the service name to confirm
6. Click **"Delete"**

✅ **Checkpoint**: Old service deleted

---

## 📋 Step 2: Deploy Backend Service (Node.js)

1. **Render Dashboard** → Click **"New +"** → Select **"Web Service"**

2. **Connect Repository**:
   - Select your GitHub account
   - Choose repository: **`HEETMEHTA18/Coastal-Guardian`**
   - Click **"Connect"**

3. **Configure Service**:
   ```
   Name: ctas-backend
   Region: Oregon (US West) or closest to your users
   Branch: main
   Root Directory: backend
   ```
   ⚠️ **CRITICAL**: Set **Root Directory** to `backend`

4. **Build & Deploy Settings**:
   ```
   Environment: Node
   Build Command: npm ci --production
   Start Command: node src/server.js
   Plan: Free
   ```

5. **Advanced Settings** → **Add Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/ctas?retryWrites=true&w=majority
   JWT_SECRET=generate-a-long-random-string-here-use-uuid
   CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app
   OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
   NOAA_CDO_API_KEY=your-noaa-api-key-here
   ```

   **How to generate JWT_SECRET**:
   ```bash
   # In PowerShell:
   [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
   ```

6. **Health Check Path**: `/api/health`

7. **Auto-Deploy**: ✅ Yes (enabled by default)

8. Click **"Create Web Service"**

9. **Wait** for deployment (~3-5 minutes)

10. **Save the URL**: Copy the service URL (e.g., `https://ctas-backend.onrender.com`)

✅ **Checkpoint**: Backend service deployed and healthy

---

## 📋 Step 3: Deploy AI Models Service (Python)

1. **Render Dashboard** → Click **"New +"** → Select **"Web Service"**

2. **Connect Repository**:
   - Select **SAME** repository: **`HEETMEHTA18/Coastal-Guardian`**
   - Click **"Connect"**

3. **Configure Service**:
   ```
   Name: ctas-ai-models
   Region: Same as backend (Oregon US West recommended)
   Branch: main
   Root Directory: ai-models
   ```
   ⚠️ **CRITICAL**: Set **Root Directory** to `ai-models`

4. **Build & Deploy Settings**:
   ```
   Environment: Python 3
   Build Command: pip install --no-cache-dir -r requirements.txt
   Start Command: uvicorn api.main:app --host 0.0.0.0 --port $PORT
   Plan: Starter ($7/month)
   ```
   ⚠️ **Important**: Use **Starter** plan (Free won't work - ML models need RAM)

5. **Advanced Settings** → **Add Environment Variables**:
   ```
   PYTHON_VERSION=3.11
   OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
   ALLOWED_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-backend.onrender.com
   ```

6. **Health Check Path**: `/api/health`

7. **Auto-Deploy**: ✅ Yes

8. Click **"Create Web Service"**

9. **Wait** for deployment (~10-15 minutes - installs TensorFlow, scikit-learn, etc.)

10. **Save the URL**: Copy the service URL (e.g., `https://ctas-ai-models.onrender.com`)

✅ **Checkpoint**: AI Models service deployed and healthy

---

## 📋 Step 4: Update Backend CORS & AI URL

Now that AI service exists, update backend to communicate with it:

1. Go to Render Dashboard → **ctas-backend** service
2. **Environment** → Find **AI_API_URL**
3. Update value to: `https://ctas-ai-models.onrender.com` (your actual AI service URL)
4. Update **CORS_ORIGINS** to include AI service:
   ```
   CORS_ORIGINS=https://coastal-threat-alert-system-two.vercel.app,https://ctas-ai-models.onrender.com
   ```
5. Click **"Save Changes"** (will trigger redeploy)

✅ **Checkpoint**: Backend can communicate with AI service

---

## 📋 Step 5: Update Frontend Environment Variables (Vercel)

1. Go to: https://vercel.com/dashboard
2. Select project: **coastal-threat-alert-system-two**
3. **Settings** → **Environment Variables**
4. **Add/Update** these variables:
   ```
   VITE_NODE_API_URL=https://ctas-backend.onrender.com
   VITE_AI_API_URL=https://ctas-ai-models.onrender.com
   ```
   (Use your actual service URLs from Steps 2 & 3)

5. **Environment**: Select **Production, Preview, Development** (all three)
6. Click **"Save"**

7. **Redeploy Frontend**:
   - Go to **Deployments** tab
   - Click on latest deployment → **"..."** menu → **"Redeploy"**
   - OR push an empty commit:
     ```bash
     git commit --allow-empty -m "Update env vars for separate services"
     git push
     ```

✅ **Checkpoint**: Frontend connected to both services

---

## 📋 Step 6: Final Verification

### Test Backend:
```bash
curl https://ctas-backend.onrender.com/api/health
```
Expected: `{"status":"ok","timestamp":"...","service":"backend"}`

### Test AI Models:
```bash
curl https://ctas-ai-models.onrender.com/api/health
```
Expected: `{"status":"healthy","models":{"alert_model":true,...}}`

### Test Frontend:
1. Visit: https://coastal-threat-alert-system-two.vercel.app
2. Open browser console (F12)
3. Look for:
   ```
   ✅ Backend connectivity check passed
   🌐 Connectivity Status: Internet ✅, Backend ✅
   ```
4. Try **logging in** - should work
5. Check **dashboard** - AI predictions should load

✅ **Checkpoint**: All services working together

---

## 🎯 Success Checklist

- [ ] Old combined service deleted
- [ ] Backend service deployed (Free plan)
- [ ] AI Models service deployed (Starter plan $7/month)
- [ ] Backend CORS updated with AI service URL
- [ ] Frontend Vercel env vars updated
- [ ] Frontend redeployed
- [ ] Backend health check returns 200 OK
- [ ] AI health check returns 200 OK
- [ ] Frontend loads without CORS errors
- [ ] Login works
- [ ] Dashboard shows AI predictions
- [ ] No errors in browser console

---

## 🔧 Maintenance & Monitoring

### Auto-Deploy is Enabled
- Both services will auto-deploy when you push to `main` branch
- No manual deployment needed after setup

### Free Tier Sleep (Backend only)
- Backend on Free plan sleeps after 15 minutes of inactivity
- First request takes ~50 seconds to wake up
- AI service on Starter plan does NOT sleep

### Monitoring
1. **Render Dashboard**: Check service logs for errors
2. **Vercel Dashboard**: Check deployment logs and analytics
3. **MongoDB Atlas**: Monitor database connections and usage

### Cost Optimization
- Backend: Free (with sleep)
- AI Models: $7/month (always on)
- Frontend: Free
- MongoDB: Free (up to 512MB)

**Total: $7/month** ✅

### Upgrade Path (if needed)
- Backend to Starter ($7/month): Removes sleep, faster response
- AI Models to Standard ($25/month): More RAM for larger models
- MongoDB to M2 ($9/month): More storage and connections

---

## 🐛 Troubleshooting

### Backend Deploy Fails
**Error**: "Cannot find module 'express'"
- **Fix**: Check `backend/package.json` exists and has all dependencies
- Redeploy if needed

**Error**: "MongoDB connection failed"
- **Fix**: Verify MONGODB_URI in environment variables
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 or Render IPs)

### AI Models Deploy Fails
**Error**: "Out of memory during pip install"
- **Fix**: Upgrade to Starter plan (Free doesn't have enough RAM)

**Error**: "Model files not found"
- **Fix**: Check that all `.pkl` files are committed to git:
  ```bash
  git ls-files ai-models/*.pkl
  ```

### Frontend Can't Connect
**Error**: "CORS policy: No 'Access-Control-Allow-Origin'"
- **Fix**: Check CORS_ORIGINS includes your Vercel URL
- Wait 2-3 minutes after changing env vars (services need to redeploy)

**Error**: "Failed to fetch"
- **Fix**: Verify service URLs in Vercel env vars
- Test health endpoints directly in browser
- Check if services are sleeping (Free tier)

### Port Binding Issues (shouldn't happen anymore)
- Backend uses `process.env.PORT || 3001`
- AI uses `$PORT` from Render
- Both correctly configured in render.yaml files

---

## 📝 Local Development

No changes needed! Run locally as before:

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

---

## 🔐 Security Best Practices

1. **Never commit sensitive keys** to git (.env files in .gitignore)
2. **Use Render's "Sync: false"** for sensitive environment variables
3. **Rotate JWT_SECRET** periodically
4. **Monitor MongoDB Atlas** for unusual activity
5. **Enable 2FA** on Render, Vercel, and GitHub accounts
6. **Review Render logs** regularly for errors or attacks

---

## 📞 Need Help?

1. Check service logs in Render Dashboard
2. Check browser console for frontend errors
3. Test health endpoints directly
4. Verify all environment variables are set
5. Check MongoDB Atlas connection status
6. Review this guide's troubleshooting section

---

## 🎉 You're All Set!

Your application is now production-ready with:
- ✅ Separate, scalable services
- ✅ Auto-deployment on git push
- ✅ Health checks and monitoring
- ✅ Proper CORS configuration
- ✅ Secure environment variables
- ✅ Cost-effective ($7/month)
- ✅ Long-term maintainability

**The party can now use a stable, professional deployment!** 🚀
