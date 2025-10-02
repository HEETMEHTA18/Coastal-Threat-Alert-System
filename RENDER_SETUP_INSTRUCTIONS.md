# 🚀 Complete Render Deployment Instructions

## 📋 Step-by-Step Guide

### 1. **Update Your Current Render Service**

Go to your Render dashboard and select your existing service, then:

#### A. Build & Deploy Settings
- **Build Command**: 
  ```bash
  npm install && cd ai-models && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  node backend/server.js & cd ai-models && uvicorn api.main:app --host 0.0.0.0 --port 8000
  ```

#### B. Environment Variables
Add these to your service:
```
OPENAI_API_KEY=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
OPENWEATHER_API_KEY=00845c44932451b7f6339b12bde4b000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PYTHON_VERSION=3.11
```

### 2. **Update Frontend Configuration**

Replace the URLs in `frontend/.env.production`:
```
VITE_NODE_API_URL=https://your-actual-render-service.onrender.com
VITE_AI_API_URL=https://your-actual-render-service.onrender.com
```

### 3. **Alternative: Separate AI Service**

If you prefer a separate AI service:

#### Create New Service
- **Name**: `ctas-ai-models`
- **Root Directory**: `ai-models`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

#### Update Frontend Config
```
VITE_AI_API_URL=https://ctas-ai-models.onrender.com
```

### 4. **Deploy and Test**

1. **Trigger Deployment**: Push code or redeploy manually
2. **Check Logs**: Monitor deployment logs for errors
3. **Test Endpoints**:
   - `https://your-service.onrender.com/api/health` (Node.js)
   - `https://your-service.onrender.com:8000/api/health` (AI models)
4. **Test Frontend**: Verify chatbot predictions work

### 5. **Troubleshooting**

#### Common Issues:
- **Port conflicts**: AI models run on port 8000, Node.js on $PORT
- **Python dependencies**: Ensure all packages in requirements.txt
- **Environment variables**: Double-check all keys are set
- **CORS**: Frontend domain must be allowed in backend

#### Health Check URLs:
- Node.js: `/api/health`
- AI Models: `/api/health` (port 8000)

### 6. **Production Optimization**

Consider upgrading to paid plan for:
- Better performance
- No sleep time
- More resources
- Custom domains

## ✅ Success Indicators

Your deployment is successful when:
- ✅ Both services start without errors
- ✅ Health check endpoints return 200 OK
- ✅ Frontend loads and connects to APIs
- ✅ Chatbot predictions display correctly
- ✅ Authentication and reports work

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables
3. Test API endpoints directly
4. Check CORS configuration