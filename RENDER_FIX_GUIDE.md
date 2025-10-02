# 🚀 RENDER DEPLOYMENT FIX

## ❌ **Problem:** 
Build failing because npm install runs from wrong directory

## ✅ **Solution:**

### **Option 1: Use Root Package.json (Recommended)**

I've created a root `package.json` with build scripts. Use these commands in Render:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

### **Option 2: Manual Commands**

If you prefer manual commands:

**Build Command:**
```bash
cd backend && npm install && cd ../ai-models && pip install -r requirements.txt
```

**Start Command:**
```bash
node backend/server.js & cd ai-models && uvicorn api.main:app --host 0.0.0.0 --port 8000
```

### **Option 3: Separate Services**

Create TWO separate Render services:

#### **Service 1: Node.js Backend**
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

#### **Service 2: Python AI Models**
- **Root Directory:** `ai-models` 
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

## 🔧 **How to Update Your Render Service:**

1. Go to your Render dashboard
2. Select your service
3. Go to "Settings" → "Build & Deploy"
4. Update the **Build Command** and **Start Command**
5. Click "Save Changes"
6. Trigger a new deployment

## 🎯 **Recommended Environment Variables:**

```
NODE_ENV=production
PORT=10000
PYTHON_VERSION=3.11
OPENAI_API_KEY=your-key
OPENWEATHER_API_KEY=your-key
MONGODB_URI=your-connection-string
JWT_SECRET=your-secret
```

## 🔍 **Troubleshooting:**

If build still fails:
1. Check the build logs for specific errors
2. Verify all file paths are correct
3. Ensure environment variables are set
4. Try the separate services approach (Option 3)

Try Option 1 first - it should work perfectly!