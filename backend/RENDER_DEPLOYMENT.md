# 🚀 Backend Deployment Guide - Render.com

## 📋 Prerequisites
- GitHub repository pushed and up to date
- MongoDB Atlas account (for database)
- API keys ready (OpenWeather, Mapbox, etc.)

## 🌐 Step 1: Deploy to Render  

### Option A: Auto-Deploy from GitHub (Recommended)

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**:
   - Repository: `HEETMEHTA18/Coastal-Threat-Alert-System`
   - Branch: `main`

4. **Configure the service**:
   ```
   Name: ctas-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Choose Plan**: Free (512MB RAM, sleeps after 15min inactivity)

### Option B: Using render.yaml (Alternative)

1. In your repository root, Render will auto-detect `backend/render.yaml`
2. Click "New +" → "Blueprint"
3. Connect repository and deploy

## 🔐 Step 2: Configure Environment Variables

In Render Dashboard → Your Service → Environment:

### Required Variables:
```bash
NODE_ENV=production
PORT=10000

# Database (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ctas?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_secure_jwt_secret_32_characters_minimum

# CORS (Update with your actual frontend URL)
CORS_ORIGIN=https://your-app.vercel.app

# API Keys (Optional but recommended)
OPENWEATHER_API_KEY=your_openweather_api_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### Optional Variables:
```bash
# Twilio SMS (for alerts)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Email alerts
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# NOAA API
NOAA_API_KEY=your_noaa_key
```

## 📊 Step 3: Set Up MongoDB Atlas

1. **Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)**
2. **Create free cluster** (M0 Sandbox - 512MB)
3. **Create database user**:
   - Username: `ctas_user`
   - Password: Generate secure password
4. **Whitelist IP addresses**:
   - Add `0.0.0.0/0` (allow from anywhere) for Render
5. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## 🔗 Step 4: Update Frontend API URL

Once deployed, update your frontend environment variable:

In Vercel Dashboard → Your Project → Settings → Environment Variables:
```bash
VITE_API_URL=https://your-render-app.onrender.com/api
```

## ✅ Step 5: Test Deployment

1. **Check deployment logs** in Render dashboard
2. **Test API endpoints**:
   ```bash
   curl https://your-app.onrender.com/api/health
   ```
3. **Verify database connection** in logs
4. **Test from frontend** after updating API URL

## 🚨 Common Issues & Solutions

### Build Fails:
- Check that `package.json` is in `/backend` folder
- Verify all dependencies are listed
- Check Node.js version compatibility

### App Crashes:
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check logs in Render dashboard

### Database Connection Issues:
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user permissions
- Ensure connection string format is correct

### CORS Errors:
- Update `CORS_ORIGIN` with your actual frontend URL
- Remove trailing slash from CORS_ORIGIN

## 📱 Step 6: Optional - Custom Domain

1. In Render → Settings → Custom Domains
2. Add your domain (e.g., `api.yoursite.com`)
3. Update DNS records as instructed
4. Update frontend `VITE_API_URL` to use custom domain

## 💰 Render Free Tier Limits

- **Sleep after 15 minutes** of inactivity
- **750 hours/month** of runtime
- **512MB RAM**
- **Cold starts** when waking up (can take 30-60 seconds)

For production use, consider upgrading to paid plan ($7/month) for:
- No sleeping
- More RAM
- Faster performance

## 🔄 Auto-Deploy

- **Auto-deploy is enabled** by default
- Every push to `main` branch triggers new deployment
- Check deployment status in Render dashboard

---

## 🎯 Quick Commands

### Deploy manually:
```bash
git add .
git commit -m "Backend updates"
git push origin main
# Render auto-deploys from GitHub
```

### Check logs:
```bash
# In Render dashboard → Logs tab
```

### Restart service:
```bash
# In Render dashboard → Manual Deploy → Deploy Latest Commit
```