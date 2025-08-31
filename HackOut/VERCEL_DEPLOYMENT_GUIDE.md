# 🌊 CTAS Vercel Deployment Guide

## Overview

Deploy your Coastal Threat Alert System (CTAS) on Vercel for free! This guide covers both the React frontend and Node.js backend deployment.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **MongoDB Atlas** - For the database (free tier available)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
cd D:\CTAS\HackOut
git add .
git commit -m "Add Vercel deployment configuration"
git push origin heet
```

### 2. Deploy Frontend (React App)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Import Project"

2. **Import from GitHub**
   - Select your CTAS repository
   - Choose the `frontend` folder as the root directory
   - Project name: `ctas-frontend`

3. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app
   VITE_WS_URL=wss://your-backend-url.vercel.app
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy"
   - Your frontend will be available at `https://ctas-frontend.vercel.app`

### 3. Deploy Backend (Node.js API)

1. **Create New Project**
   - Click "Import Project" again
   - Select the same CTAS repository
   - Choose the `backend` folder as the root directory
   - Project name: `ctas-backend`

2. **Configure Build Settings**
   ```
   Framework Preset: Other
   Root Directory: backend
   Build Command: npm run vercel-build
   Output Directory: (leave empty)
   Install Command: npm install
   ```

3. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ctas
   CORS_ORIGIN=https://ctas-frontend.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Your backend will be available at `https://ctas-backend.vercel.app`

### 4. Update Frontend Environment

After backend deployment:

1. Go to your frontend project in Vercel
2. Go to Settings > Environment Variables
3. Update `VITE_API_URL` with your actual backend URL:
   ```
   VITE_API_URL=https://ctas-backend.vercel.app
   VITE_WS_URL=wss://ctas-backend.vercel.app
   ```
4. Redeploy the frontend

## MongoDB Atlas Setup

### 1. Create Database

1. **Sign up** at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create a cluster** (choose free tier)
3. **Create database user**
4. **Whitelist IP addresses** (use 0.0.0.0/0 for all IPs or specific IPs)
5. **Get connection string**

### 2. Database Structure

Your MongoDB will automatically create these collections:
- `users` - User accounts and authentication
- `sensordata` - Coastal monitoring data
- `alerts` - Alert notifications
- `reports` - Generated reports

## Alternative: Streamlit on Streamlit Cloud

For the Streamlit dashboard (`coastal-platform`):

### 1. Streamlit Cloud Deployment

1. **Visit** [share.streamlit.io](https://share.streamlit.io)
2. **Connect GitHub** account
3. **Deploy new app**:
   ```
   Repository: urvalkheni/CTAS
   Branch: heet
   Main file path: coastal-platform/coastal_guardian/app.py
   ```

### 2. Configuration

Add these secrets in Streamlit Cloud:
```toml
[general]
email = "your-email@example.com"

[database]
sqlite_path = "./data/coastal_data.db"
```

## Custom Domain (Optional)

### For Vercel:
1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Monitoring and Maintenance

### Vercel Dashboard Features:
- **Analytics** - View traffic and performance
- **Deployments** - Track deployment history
- **Functions** - Monitor serverless function usage
- **Logs** - Debug issues in real-time

### Performance Optimization:
1. **Enable caching** for static assets
2. **Use CDN** (automatic with Vercel)
3. **Optimize images** with Vercel Image Optimization
4. **Monitor bundle size** with Bundle Analyzer

## Troubleshooting

### Common Issues:

1. **Build Failures**
   ```bash
   # Check build logs in Vercel dashboard
   # Ensure all dependencies are in package.json
   # Verify environment variables are set
   ```

2. **CORS Errors**
   ```bash
   # Update CORS_ORIGIN in backend environment variables
   # Ensure frontend URL is correct
   ```

3. **Database Connection**
   ```bash
   # Verify MongoDB Atlas IP whitelist
   # Check connection string format
   # Ensure database user permissions
   ```

4. **Environment Variables**
   ```bash
   # Double-check all environment variables
   # Ensure no trailing spaces or special characters
   # Redeploy after changing environment variables
   ```

## Cost Breakdown

### Free Tier Limits:
- **Vercel**: 100GB bandwidth, 6,000 build minutes
- **MongoDB Atlas**: 512MB storage, shared clusters
- **Streamlit Cloud**: Unlimited public apps

### Scaling:
- **Vercel Pro**: $20/month for teams
- **MongoDB Atlas**: $9/month for dedicated clusters
- **Custom domains**: Free with Vercel

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to git
   - Use strong JWT secrets
   - Regularly rotate API keys

2. **Database Security**
   - Use strong passwords
   - Enable authentication
   - Limit IP access

3. **HTTPS**
   - Automatic with Vercel
   - Force HTTPS redirects

## Support and Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Streamlit Docs**: [docs.streamlit.io](https://docs.streamlit.io)

## Quick Deploy Commands

```bash
# Deploy everything to Vercel
npm install -g vercel
cd frontend && vercel --prod
cd ../backend && vercel --prod

# Or use the Vercel dashboard (recommended)
```

🌊 **Your CTAS is now live on Vercel!** 🌊

**Frontend**: https://ctas-frontend.vercel.app
**Backend**: https://ctas-backend.vercel.app
**Dashboard**: https://share.streamlit.io/your-app

## What's Deployed

✅ **React Frontend** - Modern coastal monitoring interface
✅ **Node.js Backend** - REST API with authentication
✅ **MongoDB Database** - Cloud-hosted data storage
✅ **Streamlit Dashboard** - Real-time monitoring (optional)
✅ **AI Threat Detection** - Machine learning models
✅ **Real-time Alerts** - Notification system
✅ **Wave Emoji Branding** 🌊 - CTAS identity throughout

Your coastal threat alert system is now protecting communities worldwide! 🌊🚀
