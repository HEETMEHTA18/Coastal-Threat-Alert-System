import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Enable history API fallback for client-side routing
    historyApiFallback: true,
    // Allow the API proxy target to be controlled via environment variable
    // so the frontend can proxy to a backend on a non-standard port during
    // development (e.g. when the Python backend runs on 8001).
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/predict_alert': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
      },
      '/forecast': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
      },
    },
  },
  // Ensure history API works
  preview: {
    port: 5173,
    strictPort: true,
  },
  // Ensure any 404 is redirected to index.html for client-side routing
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['react-redux', '@reduxjs/toolkit'],
        },
      },
    },
  },
})
