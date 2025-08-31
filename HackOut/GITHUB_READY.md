# 🌊 CTAS - Coastal Threat Alert System

## 🚀 Quick Start for GitHub & Vercel Deployment

### ⚡ Pre-Deployment Security Check
```powershell
# Run this command first to ensure security:
powershell -ExecutionPolicy Bypass -File .\setup-security.ps1
```

### 🔐 Security Features Implemented
- ✅ Comprehensive `.gitignore` for all sensitive files
- ✅ Environment variable templates (`.env.example` files)
- ✅ Pre-commit hooks to prevent secret commits
- ✅ Hardcoded API keys removed from code
- ✅ Git history cleaned of sensitive data

### 📋 Environment Variables Required

#### Frontend (.env)
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_URL=https://your-backend-api.vercel.app/api
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

#### Backend (.env)
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ctas
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 🌐 Deployment Steps

1. **Run Security Setup**
   ```bash
   powershell -ExecutionPolicy Bypass -File .\setup-security.ps1
   ```

2. **Create Environment Files**
   ```bash
   # Copy and edit with real values
   cp frontend\.env.example frontend\.env
   cp backend\.env.example backend\.env
   ```

3. **Test Locally**
   ```bash
   # Backend
   cd backend && npm install && npm start
   
   # Frontend (new terminal)
   cd frontend && npm install && npm run dev
   ```

4. **Deploy to Vercel**
   - Deploy backend first (set all environment variables)
   - Deploy frontend with backend URL
   - Follow `SECURE_DEPLOYMENT_GUIDE.md` for detailed steps

### 🔧 Required APIs

| Service | Purpose | Required |
|---------|---------|----------|
| Google Maps | Map visualization | ✅ Yes |
| MongoDB Atlas | Database | ✅ Yes |
| Twilio | SMS alerts | ✅ Yes |
| OpenWeather | Weather data | ⚠️ Optional |

### 🛡️ Security Guarantee

This repository is configured to **NEVER** commit sensitive data:
- All API keys use environment variables
- Comprehensive `.gitignore` blocks all sensitive files
- Pre-commit hooks scan for secrets
- Git history is clean

### 📖 Documentation

- [`SECURE_DEPLOYMENT_GUIDE.md`](./SECURE_DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [`VERCEL_DEPLOYMENT_GUIDE.md`](./VERCEL_DEPLOYMENT_GUIDE.md) - Vercel-specific setup
- Frontend & Backend `.env.example` files - Environment variable templates

---

**🚨 IMPORTANT**: Never commit actual API keys. Always use environment variables and keep secrets in deployment platforms only.
