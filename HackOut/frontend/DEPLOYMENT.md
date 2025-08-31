# 🚀 CTAS Frontend - Vercel Deployment Guide

## � **FIXED: Rollup Build Error**
✅ Removed `mongoose` from frontend dependencies (backend-only package)  
✅ Updated Vite configuration for Vercel compatibility  
✅ Set Node.js version to 18 for stability  

## �📋 Pre-Deployment Checklist

### ✅ **Required Files**
- [x] `package.json` with correct dependencies (no mongoose!)
- [x] `vite.config.js` optimized for Vercel
- [x] `vercel.json` configuration  
- [x] `.nvmrc` for Node.js version
- [x] `.env.example` template

### ✅ **Dependencies Check**
```bash
cd frontend
# Clean install to ensure no conflicts
rm -rf node_modules package-lock.json
npm install
npm run build  # Should work without errors now
```

## 🌐 **Vercel Deployment Steps**

### **Method 1: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### **Method 2: GitHub Integration**
1. Push your code to GitHub
2. Connect repository to Vercel dashboard
3. Set root directory to `frontend`
4. Configure environment variables
5. Deploy

### **Method 3: Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com)
2. Import project from Git
3. Set **Root Directory**: `frontend`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add environment variables

## 🔧 **Environment Variables Setup**

Add these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://your-backend.vercel.app/api
VITE_WS_URL = wss://your-backend.vercel.app
VITE_OPENWEATHER_API_KEY = your_openweather_key
VITE_NASA_API_KEY = your_nasa_key
```

## 📁 **Recommended Project Structure for Vercel**

```
frontend/ (Deploy this folder)
├── package.json
├── vite.config.js
├── vercel.json
├── index.html
├── .env.example
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── components/
├── public/
└── dist/ (generated after build)
```

## 🔗 **Domain Configuration**

### **Custom Domain (Optional)**
1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Update DNS settings as instructed

### **Default Domain**
- Your app will be available at: `https://your-project-name.vercel.app`

## 🚨 **Important Notes**

### **API URLs**
- Update all API calls to use production backend URLs
- Ensure CORS is configured on your backend for your Vercel domain

### **Environment Variables**
- All frontend env vars must start with `VITE_`
- Never expose sensitive backend keys in frontend

### **Build Optimization**
- Code splitting is configured for optimal loading
- Static assets are automatically optimized by Vercel

## 🔍 **Troubleshooting**

### **Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Routing Issues**
- SPA routing is handled by `vercel.json` rewrites
- All routes redirect to `index.html`

### **Environment Variables Not Working**
- Ensure they start with `VITE_`
- Check they're set in Vercel dashboard
- Redeploy after adding new variables

## 📊 **Performance**
- Vercel automatically provides:
  - Global CDN
  - Automatic HTTPS
  - Compression
  - Image optimization
  - Edge caching

## 🎯 **Production URLs**
After deployment, your CTAS frontend will be accessible at:
- **Production**: `https://ctas-frontend.vercel.app`
- **Preview**: Auto-generated for each deployment

---

**🌊 Your CTAS coastal monitoring dashboard will be live on Vercel! 🌊**
