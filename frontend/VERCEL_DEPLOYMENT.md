# Vercel Deployment Instructions for CTAS Frontend

## 1. Pre-deployment Setup

### Environment Variables in Vercel Dashboard:
1. Go to your Vercel project settings
2. Add these environment variables:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

## 2. Deployment Steps

### Option A: Auto-deploy from GitHub
1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect it as a Vite project
3. Set root directory to `frontend`
4. Deploy

### Option B: Manual deploy
```bash
cd frontend
npm install
npm run build
npx vercel --prod
```

## 3. Common Issues & Solutions

### Build Errors:
- Ensure all dependencies are in package.json
- Check that API calls handle errors gracefully
- Verify environment variables are set

### Runtime Errors:
- Check browser console for errors
- Verify API endpoints are accessible
- Test with CORS settings

## 4. Post-deployment
- Test all functionality
- Verify API connections work
- Check that environment variables are loaded