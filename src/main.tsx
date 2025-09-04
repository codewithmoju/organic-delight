import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { addMobileResourceHints, MobilePerformanceTracker } from './lib/utils/performance'

// Start performance tracking
MobilePerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addMobileResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Measure initial load time
window.addEventListener('load', () => {
  MobilePerformanceTracker.measure('Total Load Time', 'app-start');
});
