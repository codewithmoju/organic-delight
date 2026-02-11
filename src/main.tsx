import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { registerSW } from 'virtual:pwa-register'
import { addResourceHints, PerformanceTracker } from './lib/utils/performance'

import ErrorBoundary from './components/ui/ErrorBoundary.tsx'
import { SyncProvider } from './contexts/SyncContext'

// Register PWA service worker
registerSW({ immediate: true })

// Start performance tracking
PerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SyncProvider>
  </StrictMode>,
)

// Measure initial load time
window.addEventListener('load', () => {
  PerformanceTracker.measure('Total Load Time', 'app-start');
});
