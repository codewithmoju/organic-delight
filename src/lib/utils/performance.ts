// Performance optimization utilities

// Global performance settings
export const PERFORMANCE_CONFIG = {
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300
  },
  DEBOUNCE_DELAY: {
    SEARCH: 150,
    RESIZE: 100,
    SCROLL: 50
  },
  CACHE_DURATION: 30000, // 30 seconds
  MAX_CONCURRENT_ANIMATIONS: 3
};

// Animation queue to prevent too many concurrent animations
class AnimationQueue {
  private queue: (() => void)[] = [];
  private running = 0;
  private maxConcurrent = PERFORMANCE_CONFIG.MAX_CONCURRENT_ANIMATIONS;

  add(animation: () => void) {
    this.queue.push(animation);
    this.process();
  }

  private process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) return;
    
    const animation = this.queue.shift();
    if (animation) {
      this.running++;
      animation();
      setTimeout(() => {
        this.running--;
        this.process();
      }, PERFORMANCE_CONFIG.ANIMATION_DURATION.FAST);
    }
  }
}

export const animationQueue = new AnimationQueue();

// Debounced function for expensive operations
export function createOptimizedDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY.SEARCH,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let result: ReturnType<T>;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) result = func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) result = func(...args);
    return result;
  };
}

// Throttled function for scroll/resize events
export function createOptimizedThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY.SCROLL
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Optimized intersection observer for lazy loading
export function createOptimizedIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Memory-efficient array chunking
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Optimized image preloading
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      })
    )
  );
}

// Performance measurement utilities
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map();

  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  static measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static clear(): void {
    this.marks.clear();
  }
}

// Device capability detection
export function getDeviceCapabilities() {
  const capabilities = {
    cores: navigator.hardwareConcurrency || 1,
    memory: (navigator as any).deviceMemory || 1,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    isLowEnd: false,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };

  // Determine if device is low-end
  capabilities.isLowEnd = 
    capabilities.cores <= 2 || 
    capabilities.memory <= 2 || 
    capabilities.connection === '2g' ||
    capabilities.connection === 'slow-2g';

  return capabilities;
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (import.meta.env.DEV) {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('Bundle Analysis');
    console.log('Script files:', scripts.length);
    console.log('Stylesheet files:', styles.length);
    
    // Estimate total size (rough calculation)
    let totalEstimatedSize = 0;
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('node_modules')) {
        totalEstimatedSize += 100; // Estimate vendor chunks
      } else {
        totalEstimatedSize += 50; // Estimate app chunks
      }
    });
    
    console.log(`Estimated bundle size: ~${totalEstimatedSize}KB`);
    console.groupEnd();
  }
}

// Critical resource hints
export function addResourceHints() {
  const head = document.head;
  
  // Preconnect to external domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://images.unsplash.com'
  ];
  
  preconnectDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    head.appendChild(link);
  });
  
  // DNS prefetch for external resources
  const dnsPrefetchDomains = [
    'https://api.unsplash.com'
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    head.appendChild(link);
  });
}