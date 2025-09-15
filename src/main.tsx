import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import App from './App.tsx'
import './index.css'
import './i18n'
import { addResourceHints, PerformanceTracker } from './lib/utils/performance'
import { capacitorService } from './lib/capacitor'
import { notificationService } from './lib/capacitor/notifications'

// Start performance tracking
PerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addResourceHints();

// Initialize Capacitor services
async function initializeApp() {
  // Initialize Capacitor if running natively
  if (Capacitor.isNativePlatform()) {
    await capacitorService.initialize();
    await notificationService.initialize();
  }

  // Render the app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Start the app
initializeApp();

// Measure initial load time
window.addEventListener('load', () => {
  PerformanceTracker.measure('Total Load Time', 'app-start');
});
