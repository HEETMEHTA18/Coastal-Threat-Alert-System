// Production API Configuration
const getApiUrls = () => {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    return {
      // IMPORTANT: Set these in Vercel environment variables after deploying to Render
      // After you deploy the two separate services (backend and ai-models) to Render,
      // add these environment variables in Vercel:
      // VITE_NODE_API_URL=https://ctas-backend.onrender.com
      // VITE_AI_API_URL=https://ctas-ai-models.onrender.com
      NODE_API: import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001',
      AI_API: import.meta.env.VITE_AI_API_URL || 'http://localhost:8000',
    };
  }
  
  // Development URLs
  return {
    NODE_API: 'http://localhost:3001',
    AI_API: 'http://localhost:8000',
  };
};

export const API_CONFIG = getApiUrls();

// API Endpoints
export const ENDPOINTS = {
  // Node.js Backend Endpoints
  AUTH: `${API_CONFIG.NODE_API}/api/auth`,
  REPORTS: `${API_CONFIG.NODE_API}/api/threatReports`,
  COMMUNITY_REPORTS: `${API_CONFIG.NODE_API}/api/community-reports`,
  WEATHER_PROXY: `${API_CONFIG.NODE_API}/api/weather`,
  
  // Python AI Backend Endpoints  
  PREDICT_ALERT: `${API_CONFIG.AI_API}/api/predict_alert`,
  FORECAST: `${API_CONFIG.AI_API}/api/forecast`,
  HEALTH: `${API_CONFIG.AI_API}/api/health`,
};

export default API_CONFIG;