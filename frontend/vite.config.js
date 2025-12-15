import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Optimize chunk size for better caching
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          
          // Heavy dependencies - Google Maps (only loaded when needed)
          'maps-vendor': ['@react-google-maps/api'],
          
          // Google OAuth (only loaded on login)
          'auth-vendor': ['@react-oauth/google'],
          
          // Data fetching and state management
          'data-vendor': ['@tanstack/react-query', 'axios', 'zustand'],
          
          // Form libraries
          'form-vendor': ['react-hook-form', 'date-fns']
        }
      }
    },
    // Enable minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    }
  }
})
