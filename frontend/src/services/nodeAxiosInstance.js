import axios from 'axios';

// Node/Express backend instance (community reports, users, etc.)
// Ensure VITE_NODE_API_URL ends with '/api' so callers can use paths like '/community-reports'
const rawNodeUrl = import.meta.env.VITE_NODE_API_URL || 'http://localhost:3001';
const NODE_API_BASE = rawNodeUrl.replace(/\/$/, '') + '/api';

console.debug('nodeAxios baseURL ->', NODE_API_BASE);

const nodeAxios = axios.create({
  baseURL: NODE_API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

nodeAxios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('ctas_token');
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (err) => Promise.reject(err)
);

export default nodeAxios;
