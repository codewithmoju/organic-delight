// Mobile-specific performance optimizations

// Detect mobile device capabilities
export function getMobileCapabilities() {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || window.innerWidth <= 768;
  
  // Detect specific mobile browsers
  const isSafariMobile = isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  const isChromeMobile = /Chrome/.test(userAgent) && /Mobile/.test(userAgent);
  const isSamsungInternet = /SamsungBrowser/.test(userAgent);
  
  // Performance characteristics
  const capabilities = {
    isMobile,
    isIOS,
    isAndroid,
    isSafariMobile,
    isChromeMobile,
    isSamsungInternet,
    supportsWebGL: !!window.WebGLRenderingContext,
    supportsIntersectionObserver: 'IntersectionObserver' in window,
    supportsPassiveEvents: checkPassiveEventSupport(),
    devicePixelRatio: window.devicePixelRatio || 1,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  return capabilities;
}

// Check for passive event listener support
function checkPassiveEventSupport(): boolean {
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return false;
      }
    });
    window.addEventListener('testPassive', () => {}, opts);
    window.removeEventListener('testPassive', () => {}, opts);
  } catch (e) {
    // Passive events not supported
  }
  return supportsPassive;
}

// Mobile-optimized scroll handler
export function createMobileOptimizedScrollHandler(callback: () => void) {
  let ticking = false;
  const capabilities = getMobileCapabilities();
  
  return function optimizedScrollHandler() {
    if (!ticking) {
      // Use different strategies based on device
      if (capabilities.isMobile) {
        // Mobile: Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          callback();
          ticking = false;
        });
      } else {
        // Desktop: Immediate execution
        callback();
        ticking = false;
      }
      ticking = true;
    }
  };
}

// Mobile-optimized touch event handlers
export function createMobileOptimizedTouchHandlers() {
  const capabilities = getMobileCapabilities();
  
  return {
    onTouchStart: (callback: (e: TouchEvent) => void) => {
      return capabilities.supportsPassiveEvents 
        ? { onTouchStart: callback, passive: true }
        : { onTouchStart: callback };
    },
    
    onTouchMove: (callback: (e: TouchEvent) => void) => {
      return capabilities.supportsPassiveEvents
        ? { onTouchMove: callback, passive: true }
        : { onTouchMove: callback };
    },
    
    onTouchEnd: (callback: (e: TouchEvent) => void) => {
      return capabilities.supportsPassiveEvents
        ? { onTouchEnd: callback, passive: true }
        : { onTouchEnd: callback };
    }
  };
}

// Optimize images for mobile
export function optimizeImageForMobile(src: string, options: {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
} = {}): string {
  const capabilities = getMobileCapabilities();
  
  if (!capabilities.isMobile) return src;
  
  // For mobile devices, reduce image quality and size
  const { width = 800, quality = 75, format = 'webp' } = options;
  
  // If using Unsplash or similar service, add mobile optimizations
  if (src.includes('unsplash.com')) {
    return `${src}&w=${width}&q=${quality}&fm=${format}&dpr=${Math.min(capabilities.devicePixelRatio, 2)}`;
  }
  
  return src;
}

// Mobile-specific CSS class generator
export function getMobileOptimizedClasses(baseClasses: string): string {
  const capabilities = getMobileCapabilities();
  
  if (capabilities.isMobile) {
    return `${baseClasses} touch-manipulation select-none`;
  }
  
  return baseClasses;
}

// Preload critical mobile resources
export function preloadMobileResources() {
  const capabilities = getMobileCapabilities();
  
  if (capabilities.isMobile) {
    // Preload critical CSS for mobile
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = '/mobile-critical.css';
    document.head.appendChild(link);
    
    // Prefetch likely next pages on mobile
    const prefetchPages = ['/inventory/items', '/transactions'];
    prefetchPages.forEach(page => {
      const linkPrefetch = document.createElement('link');
      linkPrefetch.rel = 'prefetch';
      linkPrefetch.href = page;
      document.head.appendChild(linkPrefetch);
    });
  }
}

// Mobile performance monitoring
export function startMobilePerformanceMonitoring() {
  const capabilities = getMobileCapabilities();
  
  if (!capabilities.isMobile) return;
  
  // Monitor touch responsiveness
  let touchStartTime = 0;
  
  document.addEventListener('touchstart', () => {
    touchStartTime = performance.now();
  }, { passive: true });
  
  document.addEventListener('touchend', () => {
    const touchDuration = performance.now() - touchStartTime;
    if (touchDuration > 100) {
      console.warn(`Slow touch response: ${touchDuration}ms`);
    }
  }, { passive: true });
  
  // Monitor scroll performance
  let scrollStartTime = 0;
  let frameCount = 0;
  
  document.addEventListener('scroll', () => {
    if (scrollStartTime === 0) {
      scrollStartTime = performance.now();
    }
    frameCount++;
    
    requestAnimationFrame(() => {
      const scrollDuration = performance.now() - scrollStartTime;
      const fps = (frameCount / scrollDuration) * 1000;
      
      if (fps < 30) {
        console.warn(`Low scroll FPS: ${fps.toFixed(1)}`);
      }
      
      // Reset after 1 second
      if (scrollDuration > 1000) {
        scrollStartTime = 0;
        frameCount = 0;
      }
    });
  }, { passive: true });
}

// Critical resource loading for mobile
export function loadCriticalMobileResources() {
  const capabilities = getMobileCapabilities();
  
  if (capabilities.isMobile) {
    // Load only essential fonts on mobile
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.href = '/fonts/inter-var-latin.woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
    
    // Reduce animation complexity
    document.documentElement.style.setProperty('--animation-complexity', 'reduced');
  }
}