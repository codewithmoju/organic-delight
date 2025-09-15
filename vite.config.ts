import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Optimize for mobile
    target: 'es2015',
    cssCodeSplit: true,
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'chart-vendor': ['recharts'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'utils-vendor': ['date-fns', 'zustand', 'sonner'],
          'capacitor-vendor': ['@capacitor/core', '@capacitor/camera', '@capacitor/device']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging but optimize for production
    sourcemap: false,
    // Minify for smaller bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'date-fns',
      'zustand'
    ]
  },
  server: {
    // Optimize dev server
    host: '0.0.0.0', // Allow external connections for mobile testing
    port: 5173,
    hmr: {
      overlay: false, // Disable error overlay for better performance
      port: 5173
    },
    // HTTPS for mobile testing (required for some features)
    https: false
  }
})
