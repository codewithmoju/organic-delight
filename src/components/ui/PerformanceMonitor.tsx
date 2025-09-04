import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export default function PerformanceMonitor({ showInProduction = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    isVisible: false
  });

  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Only show in development or if explicitly enabled
    if (import.meta.env.DEV || showInProduction) {
      // Monitor FPS
      let frameCount = 0;
      let lastTime = performance.now();
      let animationId: number;

      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          setMetrics(prev => ({ ...prev, fps }));
          frameCount = 0;
          lastTime = currentTime;
        }
        
        animationId = requestAnimationFrame(measureFPS);
      };

      // Monitor memory usage
      const monitorMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
          setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
        }
      };

      // Start monitoring
      animationId = requestAnimationFrame(measureFPS);
      const memoryInterval = setInterval(monitorMemory, 2000);

      // Measure initial load time
      const loadTime = performance.now();
      setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }));

      return () => {
        cancelAnimationFrame(animationId);
        clearInterval(memoryInterval);
      };
    }
  }, [showInProduction]);

  // Toggle monitor visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShowMonitor(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!import.meta.env.DEV && !showInProduction) return null;

  const getPerformanceStatus = () => {
    if (metrics.fps >= 55) return { color: 'text-green-400', icon: CheckCircle, status: 'Excellent' };
    if (metrics.fps >= 45) return { color: 'text-yellow-400', icon: Zap, status: 'Good' };
    return { color: 'text-red-400', icon: AlertTriangle, status: 'Poor' };
  };

  const performanceStatus = getPerformanceStatus();

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMonitor(!showMonitor)}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-dark-800 border border-dark-600 rounded-full shadow-lg hover:bg-dark-700 transition-colors"
        title="Performance Monitor (Ctrl+Shift+P)"
      >
        <Activity className="w-5 h-5 text-primary-400" />
      </motion.button>

      {/* Performance Monitor Panel */}
      <AnimatePresence>
        {showMonitor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-4 z-[9999] w-64 bg-dark-800 border border-dark-600 rounded-xl shadow-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary-400" />
                Performance
              </h3>
              <button
                onClick={() => setShowMonitor(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">FPS:</span>
                <div className="flex items-center">
                  <performanceStatus.icon className={`w-4 h-4 mr-1 ${performanceStatus.color}`} />
                  <span className={`font-semibold ${performanceStatus.color}`}>
                    {metrics.fps}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Memory:</span>
                <span className="text-white font-semibold">
                  {metrics.memoryUsage}MB
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Load Time:</span>
                <span className="text-white font-semibold">
                  {metrics.loadTime}ms
                </span>
              </div>

              <div className="pt-2 border-t border-dark-700">
                <div className={`text-xs ${performanceStatus.color} font-medium`}>
                  Status: {performanceStatus.status}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}