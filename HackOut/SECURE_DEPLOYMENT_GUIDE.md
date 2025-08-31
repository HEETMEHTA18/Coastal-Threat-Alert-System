# 🚀 CTAS Secure Deployment Guide

## 🔒 Security Setup (CRITICAL - Do this FIRST!)

### 1. Verify No Sensitive Data in Repository
```bash
# Check for any remaining secrets
git log --all -S "AIza" --oneline
git log --all -S "sk-" --oneline
git log --all -S "AC[a-zA-Z0-9]" --oneline

# If any found, clean git history:
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch path/to/file/with/secrets' \
--prune-empty --tag-name-filter cat -- --all
```

### 2. Environment Variables Setup

#### Backend Environment Variables (.env)
```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ctas-production

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Origins (comma separated)
CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://ctas-frontend.vercel.app
```

#### Frontend Environment Variables (.env)
```bash
# API Configuration
VITE_API_URL=https://your-backend-api.vercel.app/api

# Google Maps API Key (REQUIRED)
VITE_GOOGLE_MAPS_API_KEY=AIza...your_google_maps_api_key

# Weather APIs (Optional)
VITE_OPENWEATHER_API_KEY=your_openweather_key
VITE_NASA_API_KEY=your_nasa_key

# Environment
NODE_ENV=production
```

## 🌐 Vercel Deployment

### Step 1: Backend Deployment
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Connect to your GitHub repository
4. Select the `backend` folder as root directory
5. Add all environment variables in Vercel dashboard:
   - MONGODB_URI
   - JWT_SECRET
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
   - PORT=5000
   - NODE_ENV=production
   - CORS_ORIGINS=https://your-frontend-domain.vercel.app

### Step 2: Frontend Deployment
1. Create a new Vercel project for frontend
2. Select the `frontend` folder as root directory
3. Add environment variables:
   - VITE_API_URL=https://your-backend-api.vercel.app/api
   - VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   - VITE_OPENWEATHER_API_KEY=your_openweather_key
   - NODE_ENV=production

### Step 3: Domain Configuration
1. Update CORS_ORIGINS in backend with actual frontend domain
2. Update VITE_API_URL in frontend with actual backend domain
3. Redeploy both services

## 🔧 Required API Keys

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create API key and restrict to your domains
5. Add to `VITE_GOOGLE_MAPS_API_KEY`

### Twilio SMS
1. Create account at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to backend environment

### MongoDB Atlas
1. Create cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create database user
3. Whitelist Vercel IPs or use 0.0.0.0/0
4. Get connection string
5. Add to `MONGODB_URI`

## 🛡️ Security Checklist

- [ ] No hardcoded API keys in code
- [ ] All sensitive data in environment variables
- [ ] .gitignore includes all environment files
- [ ] Pre-commit hooks installed
- [ ] Git history cleaned of secrets
- [ ] API keys restricted to specific domains
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] JWT secret is secure (32+ characters)
- [ ] Environment variables set in Vercel

## 🚨 Emergency Procedures

### If API Key is Accidentally Committed:
1. Immediately revoke the compromised key
2. Generate new API key
3. Update environment variables
4. Clean git history:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch filename' \
   --prune-empty --tag-name-filter cat -- --all
   ```
5. Force push to remote

### If Environment File is Committed:
1. Change all secrets immediately
2. Remove file from git history
3. Update all deployment environments
4. Monitor for unauthorized access

## 📋 Deployment Commands

```bash
# Clone repository
git clone https://github.com/yourusername/CTAS.git
cd CTAS

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Build frontend
cd frontend && npm run build

# Test backend locally
cd backend && npm start

# Deploy to Vercel (using CLI)
vercel --prod
```

## 🔍 Testing Deployment

### Backend Health Check
```bash
curl https://your-backend-api.vercel.app/api/health
```

### Frontend Access
- Visit https://your-frontend-domain.vercel.app
- Test Google Maps loading
- Test threat reporting functionality
- Verify SMS notifications

## 📞 Support

For deployment issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check database connectivity
5. Verify CORS configuration

---

**⚠️ IMPORTANT**: Never commit actual API keys or secrets to Git. Always use environment variables and keep your `.env.example` files updated with placeholder values.
