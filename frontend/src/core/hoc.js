/**
 * Higher Order Components - Google/Facebook Level
 * Reusable component wrappers for performance and functionality
 */

import React, { Component, memo, useEffect, useRef, useState } from 'react';
import { perfMonitor, LRUCache } from './performance';

/**
 * HOC: Performance Monitoring
 * Tracks render performance similar to React DevTools Profiler
 */
export const withPerformance = (WrappedComponent, componentName) => {
  const ComponentWithPerformance = memo((props) => {
    const renderCount = useRef(0);
    const mountTime = useRef(Date.now());

    useEffect(() => {
      renderCount.current += 1;

      const renderTime = perfMonitor.measure(`${componentName}-render-${renderCount.current}`);

      if (renderCount.current > 20) {
        console.warn(
          `[Performance] ${componentName} has rendered ${renderCount.current} times. Consider optimization.`
        );
      }

      return () => {
        if (renderTime > 16) {
          console.warn(
            `[Performance] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
          );
        }
      };
    });

    perfMonitor.start(`${componentName}-render-${renderCount.current + 1}`);

    return <WrappedComponent {...props} />;
  });

  ComponentWithPerformance.displayName = `withPerformance(${componentName})`;
  return ComponentWithPerformance;
};

/**
 * HOC: Data Caching
 * Facebook Relay-style component-level caching
 */
export const withCache = (WrappedComponent, options = {}) => {
  const { cacheKey = 'default', ttl = 300000 } = options;
  const cache = new LRUCache(100, ttl);

  const ComponentWithCache = (props) => {
    const getCacheKey = () => {
      if (typeof cacheKey === 'function') {
        return cacheKey(props);
      }
      return `${cacheKey}-${JSON.stringify(props)}`;
    };

    const key = getCacheKey();
    const cachedData = cache.get(key);

    const setCache = (data) => {
      cache.set(key, data);
    };

    return <WrappedComponent {...props} cachedData={cachedData} setCache={setCache} />;
  };

  ComponentWithCache.displayName = `withCache(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithCache;
};

/**
 * HOC: Error Boundary Wrapper
 * Google-style error recovery
 */
export const withErrorBoundary = (WrappedComponent, options = {}) => {
  const {
    FallbackComponent = DefaultErrorFallback,
    onError = (error, errorInfo) => {
      console.error('Error caught by boundary:', error, errorInfo);
    },
    onReset = () => {}
  } = options;

  class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { 
        hasError: false, 
        error: null,
        errorInfo: null 
      };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      this.setState({ errorInfo });
      onError(error, errorInfo);
    }

    handleReset = () => {
      this.setState({ hasError: false, error: null, errorInfo: null });
      onReset();
    };

    render() {
      if (this.state.hasError) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onReset={this.handleReset}
          />
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  ErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ErrorBoundary;
};

/**
 * HOC: Lazy Loading Wrapper
 * Wraps component with Suspense
 */
export const withSuspense = (WrappedComponent, FallbackComponent) => {
  const ComponentWithSuspense = (props) => (
    <React.Suspense fallback={<FallbackComponent />}>
      <WrappedComponent {...props} />
    </React.Suspense>
  );

  ComponentWithSuspense.displayName = `withSuspense(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithSuspense;
};

/**
 * HOC: Virtualization for Large Lists
 * Gmail/Facebook-style virtual scrolling
 */
export const withVirtualization = (WrappedComponent, options = {}) => {
  const { itemHeight = 50, overscan = 3 } = options;

  const ComponentWithVirtualization = (props) => {
    const { items = [], renderItem, ...rest } = props;
    const containerRef = useRef(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        const scrollTop = container.scrollTop;
        const visibleStart = Math.floor(scrollTop / itemHeight);
        const visibleEnd = Math.ceil((scrollTop + container.clientHeight) / itemHeight);

        setVisibleRange({
          start: Math.max(0, visibleStart - overscan),
          end: Math.min(items.length, visibleEnd + overscan)
        });
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial calculation

      return () => container.removeEventListener('scroll', handleScroll);
    }, [items.length]);

    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    const offsetY = visibleRange.start * itemHeight;
    const totalHeight = items.length * itemHeight;

    return (
      <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => (
              <div key={visibleRange.start + index} style={{ height: itemHeight }}>
                {renderItem(item, visibleRange.start + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  ComponentWithVirtualization.displayName = `withVirtualization(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithVirtualization;
};

/**
 * HOC: Debounced Updates
 * Debounce prop updates to reduce re-renders
 */
export const withDebouncedProps = (WrappedComponent, propNames = [], delay = 300) => {
  const ComponentWithDebouncedProps = (props) => {
    const [debouncedProps, setDebouncedProps] = useState(() => {
      const initial = {};
      propNames.forEach(name => {
        initial[name] = props[name];
      });
      return initial;
    });

    useEffect(() => {
      const timeout = setTimeout(() => {
        const updated = {};
        propNames.forEach(name => {
          updated[name] = props[name];
        });
        setDebouncedProps(updated);
      }, delay);

      return () => clearTimeout(timeout);
    }, propNames.map(name => props[name]));

    return <WrappedComponent {...props} {...debouncedProps} />;
  };

  ComponentWithDebouncedProps.displayName = `withDebouncedProps(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithDebouncedProps;
};

/**
 * HOC: Intersection Observer
 * Lazy load components when they enter viewport
 */
export const withIntersectionObserver = (WrappedComponent, options = {}) => {
  const { 
    threshold = 0.1, 
    rootMargin = '50px',
    LoadingComponent = () => <div>Loading...</div>
  } = options;

  const ComponentWithIntersectionObserver = (props) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {isVisible ? <WrappedComponent {...props} /> : <LoadingComponent />}
      </div>
    );
  };

  ComponentWithIntersectionObserver.displayName = `withIntersectionObserver(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithIntersectionObserver;
};

/**
 * HOC Composition Helper
 * Compose multiple HOCs in readable order
 */
export const compose = (...hocs) => (Component) => {
  return hocs.reduceRight((acc, hoc) => hoc(acc), Component);
};

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback = ({ error, errorInfo, onReset }) => (
  <div style={{
    padding: '20px',
    margin: '20px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px'
  }}>
    <h3 style={{ color: '#856404', marginTop: 0 }}>Something went wrong</h3>
    <p style={{ color: '#856404' }}>{error?.message || 'An error occurred'}</p>
    {errorInfo && (
      <details style={{ marginTop: '10px', color: '#856404' }}>
        <summary>Error details</summary>
        <pre style={{ 
          marginTop: '10px', 
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px'
        }}>
          {errorInfo.componentStack}
        </pre>
      </details>
    )}
    <button
      onClick={onReset}
      style={{
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Try Again
    </button>
  </div>
);

export default {
  withPerformance,
  withCache,
  withErrorBoundary,
  withSuspense,
  withVirtualization,
  withDebouncedProps,
  withIntersectionObserver,
  compose
};
