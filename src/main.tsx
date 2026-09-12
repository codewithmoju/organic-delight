import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { registerSW } from 'virtual:pwa-register'
import { addResourceHints, PerformanceTracker } from './lib/utils/performance'

import ErrorBoundary from './components/ui/ErrorBoundary.tsx'
import { SyncProvider } from './contexts/SyncContext'

import { Capacitor } from '@capacitor/core'

// Register PWA service worker only on the web, NEVER in native Capacitor mobile apps
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true })
} else if ('serviceWorker' in navigator) {
  // If an old service worker was registered in the native webview, unregister it
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}

// Start performance tracking
PerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SyncProvider>
        <App />
      </SyncProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Measure initial load time
window.addEventListener('load', () => {
  PerformanceTracker.measure('Total Load Time', 'app-start');
});
