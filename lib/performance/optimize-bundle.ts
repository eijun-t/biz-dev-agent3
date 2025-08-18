/**
 * Bundle Optimization Utilities
 * MVP Worker3 - Performance Optimization
 * Reduce bundle size and improve loading speed
 */

// Dynamic imports configuration
export const dynamicImports = {
  // Heavy libraries - load on demand
  jsPDF: () => import('jspdf'),
  xlsx: () => import('xlsx'),
  d3: () => import('d3'),
  diff: () => import('diff'),
  
  // Components - code splitting
  AgentPipeline: () => import('@/components/visualization/AgentPipeline'),
  DataFlow: () => import('@/components/visualization/DataFlow'),
  ReportHistory: () => import('@/components/reports/ReportHistoryIntegrated'),
  SearchFilterPanel: () => import('@/components/search/SearchFilterPanel')
};

// Webpack optimization config
export const webpackOptimization = {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      // Vendor libraries
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        priority: 10,
        reuseExistingChunk: true
      },
      // Common components
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true
      },
      // Visualization libraries
      visualization: {
        test: /[\\/]node_modules[\\/](d3|three|react-flow)[\\/]/,
        name: 'visualization',
        priority: 8
      },
      // Document generation
      documents: {
        test: /[\\/]node_modules[\\/](jspdf|xlsx|docx)[\\/]/,
        name: 'documents',
        priority: 7
      }
    }
  },
  // Tree shaking
  usedExports: true,
  // Minimize
  minimize: true,
  // Side effects
  sideEffects: false
};

// Next.js config optimization
export const nextConfig = {
  // Enable SWC minification
  swcMinify: true,
  
  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable styled-components
    styledComponents: true
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lodash',
      'date-fns'
    ]
  }
};

// Lazy loading wrapper
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(importFunc);
}

// Preload critical resources
export function preloadCriticalResources() {
  // Preload fonts
  const fonts = [
    '/fonts/inter-var.woff2',
    '/fonts/jetbrains-mono.woff2'
  ];
  
  fonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = font;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
  
  // Preload critical CSS
  const criticalCSS = [
    '/css/critical.css',
    '/css/animations.css'
  ];
  
  criticalCSS.forEach(css => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = css;
    document.head.appendChild(link);
  });
}

// Resource hints
export function addResourceHints() {
  // DNS prefetch for external APIs
  const dnsPrefetch = [
    'https://api.supabase.co',
    'https://cdn.jsdelivr.net',
    'https://fonts.googleapis.com'
  ];
  
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical origins
  const preconnect = [
    'https://api.supabase.co',
    'https://fonts.gstatic.com'
  ];
  
  preconnect.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Service Worker for caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('SW registered:', registration);
        },
        err => {
          console.log('SW registration failed:', err);
        }
      );
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  
  mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start && end) {
      const duration = end - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      
      // Send to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name,
          value: Math.round(duration),
          event_category: 'Performance'
        });
      }
      
      return duration;
    }
    
    return 0;
  }
  
  reportWebVitals() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('LCP:', entry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          console.log('FID:', fid);
        }
      }).observe({ entryTypes: ['first-input'] });
      
      // Cumulative Layout Shift
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
            console.log('CLS:', cls);
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }
}

// Initialize performance optimizations
export function initializeOptimizations() {
  // Only in browser
  if (typeof window === 'undefined') return;
  
  // Preload resources
  preloadCriticalResources();
  
  // Add resource hints
  addResourceHints();
  
  // Register service worker
  registerServiceWorker();
  
  // Monitor performance
  const monitor = new PerformanceMonitor();
  monitor.reportWebVitals();
  
  // Return monitor for app use
  return monitor;
}

// Export everything
export default {
  dynamicImports,
  webpackOptimization,
  nextConfig,
  lazyLoad,
  preloadCriticalResources,
  addResourceHints,
  registerServiceWorker,
  PerformanceMonitor,
  initializeOptimizations
};