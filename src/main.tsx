import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { addResourceHints, PerformanceTracker } from './lib/utils/performance'

// Start performance tracking
PerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addResourceHints();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Measure initial load time
window.addEventListener('load', () => {
  PerformanceTracker.measure('Total Load Time', 'app-start');
});
