import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['stocksuite-favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'StockSuite Inventory',
        short_name: 'StockSuite',
        description: 'Advanced Inventory & Retail Management System',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'stocksuite-favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'stocksuite-favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
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
          'utils-vendor': ['date-fns', 'zustand', 'sonner']
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
    hmr: {
      overlay: false // Disable error overlay for better performance
    },
    // Mobile testing optimization
    host: true,
    port: 5173
  }
})
