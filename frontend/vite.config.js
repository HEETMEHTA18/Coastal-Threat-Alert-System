import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import crypto from 'node:crypto'

// Polyfill crypto.hash for older Node versions (like v18.19.1)
if (!crypto.hash) {
  crypto.hash = function(algorithm, data, outputFormat = 'hex') {
    return crypto.createHash(algorithm).update(data).digest(outputFormat);
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Enable history API fallback for client-side routing
    historyApiFallback: true,
    // Development proxy configuration
    proxy: {
      // ML API endpoints - must come BEFORE /api to avoid conflicts
      '/predict_alert': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => '/api' + path,
      },
      '/forecast': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => '/api' + path,
      },
      // Node backend API - catches all other /api/* requests
      '/api': {
        target: 'http://localhost:3001',
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
