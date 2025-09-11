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
