/**
 * Lazy Loading Utilities - Google/Facebook Level
 * Code splitting and dynamic imports
 */

import React, { lazy, Suspense } from 'react';

/**
 * Retry dynamic import on failure
 * Google-style retry mechanism for code splitting
 */
const retry = (fn, retriesLeft = 3, interval = 1000) => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error);
            return;
          }

          // Try again
          retry(fn, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
};

/**
 * Lazy load component with retry
 * @param {Function} importFn - Dynamic import function
 * @param {Object} options - Options
 * @returns {React.LazyExoticComponent}
 */
export const lazyWithRetry = (importFn, options = {}) => {
  const { retries = 3, fallback = null } = options;

  return lazy(() => retry(importFn, retries));
};

/**
 * Lazy load with preload capability
 * Facebook-style code splitting with prefetch
 */
export const lazyWithPreload = (importFn) => {
  let componentPromise = null;

  const LazyComponent = lazy(() => {
    if (!componentPromise) {
      componentPromise = retry(importFn);
    }
    return componentPromise;
  });

  // Preload method
  LazyComponent.preload = () => {
    if (!componentPromise) {
      componentPromise = retry(importFn);
    }
    return componentPromise;
  };

  return LazyComponent;
};

/**
 * Create lazy wrapper with custom loading component
 */
export const createLazyComponent = (importFn, LoadingComponent) => {
  const LazyComponent = lazyWithRetry(importFn);

  return (props) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Route-based code splitting helper
 * Google-style route-level code splitting
 */
export const createLazyRoute = (importFn, options = {}) => {
  const {
    LoadingComponent = DefaultLoadingComponent,
    ErrorBoundary = DefaultErrorBoundary,
    preload = false
  } = options;

  const LazyComponent = lazyWithPreload(importFn);

  // Preload if specified
  if (preload) {
    LazyComponent.preload();
  }

  const RouteComponent = (props) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  // Expose preload method
  RouteComponent.preload = LazyComponent.preload;

  return RouteComponent;
};

/**
 * Prefetch routes on hover/focus
 * Facebook-style link prefetching
 */
export const usePrefetch = (routes) => {
  const prefetchedRoutes = new Set();

  const prefetch = (routeName) => {
    if (prefetchedRoutes.has(routeName)) return;
    
    const route = routes[routeName];
    if (route && route.preload) {
      route.preload();
      prefetchedRoutes.add(routeName);
    }
  };

  const onLinkHover = (routeName) => {
    prefetch(routeName);
  };

  const onLinkFocus = (routeName) => {
    prefetch(routeName);
  };

  return { prefetch, onLinkHover, onLinkFocus };
};

/**
 * Default loading component
 */
const DefaultLoadingComponent = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    fontSize: '14px',
    color: '#666'
  }}>
    <div>Loading...</div>
  </div>
);

/**
 * Default error boundary
 */
class DefaultErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#dc3545'
        }}>
          <h3>Something went wrong</h3>
          <p>Please refresh the page and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Chunk preloading strategy
 * Preload chunks based on route probability
 */
export const preloadStrategy = {
  /**
   * Preload on mount (high probability routes)
   */
  immediate: (routes) => {
    routes.forEach(route => {
      if (route.preload) route.preload();
    });
  },

  /**
   * Preload on idle (medium probability routes)
   */
  idle: (routes) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        routes.forEach(route => {
          if (route.preload) route.preload();
        });
      });
    } else {
      setTimeout(() => {
        routes.forEach(route => {
          if (route.preload) route.preload();
        });
      }, 1000);
    }
  },

  /**
   * Preload on interaction (low probability routes)
   */
  onInteraction: (routes, eventType = 'mouseover') => {
    const preloadOnce = () => {
      routes.forEach(route => {
        if (route.preload) route.preload();
      });
      document.removeEventListener(eventType, preloadOnce);
    };

    document.addEventListener(eventType, preloadOnce, { once: true });
  }
};

export default {
  lazyWithRetry,
  lazyWithPreload,
  createLazyComponent,
  createLazyRoute,
  usePrefetch,
  preloadStrategy
};
