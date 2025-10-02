// Production API Configuration
const getApiUrls = () => {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    return {
      // Replace these with your actual Render service URLs
      NODE_API: import.meta.env.VITE_NODE_API_URL || 'https://your-render-service.onrender.com',
      AI_API: import.meta.env.VITE_AI_API_URL || 'https://your-render-service.onrender.com',
      // OR for separate AI service:
      // AI_API: import.meta.env.VITE_AI_API_URL || 'https://ctas-ai-models.onrender.com',
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