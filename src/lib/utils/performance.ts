// Performance optimization utilities for mobile dashboard

// Optimized debounce for mobile interactions
export function createMobileOptimizedDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
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

// Throttled function optimized for mobile scroll/touch events
export function createMobileOptimizedThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Optimized intersection observer for mobile lazy loading
export function createMobileIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '20px', // Reduced for mobile
    threshold: 0.1,
    ...options
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Memory-efficient array chunking for mobile
export function chunkArrayForMobile<T>(array: T[], chunkSize: number = 10): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Mobile-optimized image preloading
export function preloadCriticalImages(urls: string[]): Promise<void[]> {
  // Limit concurrent image loads on mobile
  const maxConcurrent = window.innerWidth <= 768 ? 2 : 4;
  const chunks = chunkArrayForMobile(urls, maxConcurrent);
  
  return chunks.reduce(async (promise, chunk) => {
    await promise;
    return Promise.all(
      chunk.map(url => 
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Don't fail on image errors
          img.src = url;
          
          // Timeout for mobile networks
          setTimeout(() => resolve(), 3000);
        })
      )
    );
  }, Promise.resolve([]));
}

// Performance measurement utilities
export class MobilePerformanceTracker {
  private static marks: Map<string, number> = new Map();
  private static isMobile = window.innerWidth <= 768;

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
    
    // Only log performance issues on mobile
    if (this.isMobile && duration > 100) {
      console.warn(`${name}: ${duration.toFixed(2)}ms (slow on mobile)`);
    }
    
    return duration;
  }

  static clear(): void {
    this.marks.clear();
  }
}

// Mobile device capability detection
export function getMobileDeviceCapabilities() {
  const capabilities = {
    cores: navigator.hardwareConcurrency || 1,
    memory: (navigator as any).deviceMemory || 1,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    isLowEnd: false,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    supportsWebGL: !!window.WebGLRenderingContext,
    devicePixelRatio: window.devicePixelRatio || 1
  };

  // Determine if device is low-end
  capabilities.isLowEnd = 
    capabilities.cores <= 2 || 
    capabilities.memory <= 2 || 
    capabilities.connection === '2g' ||
    capabilities.connection === 'slow-2g';

  return capabilities;
}

// Optimized animation controller for mobile
export function createMobileAnimationController() {
  const capabilities = getMobileDeviceCapabilities();
  
  return {
    // Reduced durations for mobile
    duration: {
      fast: capabilities.isMobile ? 0.1 : 0.15,
      normal: capabilities.isMobile ? 0.15 : 0.2,
      slow: capabilities.isMobile ? 0.2 : 0.3
    },
    
    // Optimized easing for mobile
    easing: {
      easeOut: [0.25, 0.46, 0.45, 0.94],
      easeInOut: [0.4, 0, 0.2, 1],
      spring: capabilities.isLowEnd ? [0.25, 0.46, 0.45, 0.94] : [0.25, 0.46, 0.45, 0.94]
    },
    
    // Disable complex animations on low-end devices
    shouldReduceMotion: capabilities.isLowEnd || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

// Critical resource hints for mobile
export function addMobileResourceHints() {
  const head = document.head;
  
  // Preconnect to critical domains
  const preconnectDomains = [
    'https://fonts.googleapis.com',
    'https://images.unsplash.com'
  ];
  
  preconnectDomains.forEach(domain => {
    if (!document.querySelector(`link[href="${domain}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      head.appendChild(link);
    }
  });
  
  // DNS prefetch for external resources
  const dnsPrefetchDomains = [
    'https://api.unsplash.com'
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    if (!document.querySelector(`link[href="${domain}"]`)) {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      head.appendChild(link);
    }
  });
}

// Optimized cache management for mobile
export class MobileCacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; size: number }>();
  private static maxCacheSize = window.innerWidth <= 768 ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB mobile, 10MB desktop
  private static currentCacheSize = 0;

  static set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    const size = JSON.stringify(data).length;
    
    // Check if adding this item would exceed cache size
    if (this.currentCacheSize + size > this.maxCacheSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });
    
    this.currentCacheSize += size;
  }

  static get(key: string, ttl: number = 5 * 60 * 1000): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
      return null;
    }
    
    return item.data;
  }

  static cleanup(): void {
    // Remove oldest entries first
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      const [key, item] = entries[i];
      this.cache.delete(key);
      this.currentCacheSize -= item.size;
    }
  }

  static clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }
}