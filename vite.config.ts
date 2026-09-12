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
        // Don't cache chunks > 3MB in SW to avoid quota issues
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Core React runtime ──────────────────────────────────────────
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react-core';
          }

          // ── Routing ─────────────────────────────────────────────────────
          if (id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/')) {
            return 'router';
          }

          // ── Firebase — split auth vs firestore (firestore is huge) ──────
          if (id.includes('node_modules/firebase/firestore') ||
              id.includes('node_modules/@firebase/firestore')) {
            return 'firebase-firestore';
          }
          if (id.includes('node_modules/firebase/auth') ||
              id.includes('node_modules/@firebase/auth')) {
            return 'firebase-auth';
          }
          if (id.includes('node_modules/firebase/') ||
              id.includes('node_modules/@firebase/')) {
            return 'firebase-core';
          }

          // ── Animation (framer-motion is large, isolate it) ──────────────
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }

          // ── Charts ──────────────────────────────────────────────────────
          if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'charts';
          }

          // ── Icons (lucide is large, keep separate for caching) ──────────
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          // ── i18n ────────────────────────────────────────────────────────
          if (id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next')) {
            return 'i18n';
          }

          // ── PDF / Print (only used in reports, lazy-loaded) ─────────────
          if (id.includes('node_modules/jspdf') ||
              id.includes('node_modules/react-to-print')) {
            return 'pdf';
          }

          // ── Barcode scanning (only used in POS scanner) ─────────────────
          if (id.includes('node_modules/html5-qrcode') ||
              id.includes('node_modules/quagga') ||
              id.includes('node_modules/@zxing/')) {
            return 'barcode';
          }

          // ── Misc utilities ───────────────────────────────────────────────
          if (id.includes('node_modules/date-fns')) return 'date-fns';
          if (id.includes('node_modules/zustand')) return 'zustand';
          if (id.includes('node_modules/sonner')) return 'sonner';
          if (id.includes('node_modules/zod')) return 'zod';
        }
      }
    },

    // Raise warning threshold — we're intentionally splitting
    chunkSizeWarningLimit: 600,

    // Use terser for better compression than esbuild default
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
        passes: 2,          // Two compression passes for smaller output
        ecma: 2020,
      },
      mangle: { safari10: true },
      format: { comments: false }
    },

    // No source maps in production
    sourcemap: false,

    // Target modern browsers — smaller output
    target: 'es2020',
  },

  optimizeDeps: {
    // Let Vite pre-bundle these for fast dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'date-fns',
      'zustand',
      'sonner',
      'lucide-react',
    ],
  },

  server: {
    hmr: { overlay: false },
    host: true,
    port: 5173,
  },
})
