/**
 * Performance Monitoring Utilities
 * Build ve runtime performance ölçümü için
 */

// Web Vitals monitoring
export const measureWebVitals = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(
      entry => entry.name === 'first-contentful-paint',
    );

    // Largest Contentful Paint
    let lcp = 0;
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      lcp = lastEntry.startTime;
      console.log('🎯 LCP:', lcp, 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime;
        console.log('⚡ FID:', fid, 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
        }
      });
      console.log('📐 CLS:', cumulativeLayoutShift);
    }).observe({ entryTypes: ['layout-shift'] });

    console.log('🎨 FCP:', fcp?.startTime || 'N/A', 'ms');
  }
};

// Bundle size reporter
export const reportBundleSize = () => {
  if (typeof window !== 'undefined') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((size, script) => {
      const src = script.src;
      if (src.includes('chunk.js')) {
        // Bu production'da actual size'ı almaz, sadz approximation
        return size + script.src.length; // Placeholder
      }
      return size;
    }, 0);

    console.log('📦 Estimated Bundle Size:', totalSize, 'bytes');
  }
};

// API Performance tracker
export const trackAPIPerformance = (apiCall, startTime) => {
  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`🌐 API Call: ${apiCall} - Duration: ${duration.toFixed(2)}ms`);

  // Slow API warning
  if (duration > 2000) {
    console.warn(
      `⚠️ Slow API detected: ${apiCall} took ${duration.toFixed(2)}ms`,
    );
  }

  return duration;
};

// Memory usage tracker
export const trackMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory;
    console.log('💾 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
};

// Component render time tracker
export const trackComponentRender = componentName => {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) {
      // 60fps = 16.67ms per frame
      console.warn(
        `🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`,
      );
    }
  };
};

// Real-time performance dashboard
export const initPerformanceDashboard = () => {
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    console.log('🚀 Performance Monitoring Active');

    // Her 5 saniyede memory usage check
    setInterval(trackMemoryUsage, 5000);

    // Web vitals ölçümü
    measureWebVitals();

    // Bundle size reporting
    setTimeout(reportBundleSize, 2000);
  }
};

/**
 * Kullanım örnekleri:
 *
 * // Component'te:
 * const endRender = trackComponentRender('MyComponent');
 * // ... render logic
 * endRender();
 *
 * // API call'da:
 * const start = performance.now();
 * const result = await api.getData();
 * trackAPIPerformance('getData', start);
 *
 * // App başlangıcında:
 * initPerformanceDashboard();
 */
