import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { addResourceHints, PerformanceTracker, PERFORMANCE_CONFIG } from './lib/utils/performance'

// Start performance tracking
PerformanceTracker.mark('app-start');

// Add resource hints for better loading performance
addResourceHints();

// Optimize initial rendering
const container = document.getElementById('root')!;

// Add performance optimizations to root element
container.style.contain = 'layout style paint';
container.style.willChange = 'auto';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Measure initial load time
window.addEventListener('load', () => {
  PerformanceTracker.measure('Total Load Time', 'app-start');
  
  // Clean up will-change after initial load
  setTimeout(() => {
    container.style.willChange = 'auto';
  }, 1000);
});
