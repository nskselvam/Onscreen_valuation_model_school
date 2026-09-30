/**
 * Advanced React Hooks - Google/Facebook Level
 * Production-grade hooks for performance and functionality
 */

import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { LRUCache, RateLimiters, perfMonitor } from '../core/performance';

/**
 * useDebounce - Debounced value with cleanup
 * Used extensively in Google search, Facebook autocomplete
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle - Throttled callback
 */
export const useThrottle = (callback, delay = 500) => {
  const lastRunRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRunRef.current = now;
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRunRef.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]);
};

/**
 * useMemoizedCallback - Stable callback reference
 * Google's approach for preventing rerenders
 */
export const useMemoizedCallback = (fn) => {
  const ref = useRef(fn);

  useLayoutEffect(() => {
    ref.current = fn;
  });

  return useCallback((...args) => ref.current(...args), []);
};

/**
 * useFilteredData - Memoized filtering with performance tracking
 */
export const useFilteredData = (data, filterFn, deps = []) => {
  return useMemo(() => {
    perfMonitor.start('useFilteredData');
    
    if (!Array.isArray(data)) {
      perfMonitor.end('useFilteredData');
      return [];
    }
    
    const result = data.filter(filterFn);
    perfMonitor.end('useFilteredData');
    
    return result;
  }, [data, ...deps]);
};

/**
 * useSortedData - Memoized sorting
 */
export const useSortedData = (data, compareFn, deps = []) => {
  return useMemo(() => {
    perfMonitor.start('useSortedData');
    
    if (!Array.isArray(data)) {
      perfMonitor.end('useSortedData');
      return [];
    }
    
    const result = [...data].sort(compareFn);
    perfMonitor.end('useSortedData');
    
    return result;
  }, [data, ...deps]);
};

/**
 * useIndexedData - O(1) lookups with Map
 * Facebook-style indexed data
 */
export const useIndexedData = (data, keyField = 'id') => {
  return useMemo(() => {
    const index = new Map();
    
    if (Array.isArray(data)) {
      for (const item of data) {
        const key = typeof keyField === 'function' ? keyField(item) : item[keyField];
        if (key !== undefined && key !== null) {
          index.set(String(key), item);
        }
      }
    }
    
    return index;
  }, [data, keyField]);
};

/**
 * useGroupedData - Group data by key
 */
export const useGroupedData = (data, groupByKey) => {
  return useMemo(() => {
    if (!Array.isArray(data)) return {};
    
    const groups = {};
    for (const item of data) {
      const key = typeof groupByKey === 'function' ? groupByKey(item) : item[groupByKey];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    
    return groups;
  }, [data, groupByKey]);
};

/**
 * usePagination - Advanced pagination with prefetch
 */
export const usePagination = (data, pageSize = 20, options = {}) => {
  const { prefetchPages = 1 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [cache] = useState(() => new LRUCache(20));

  const totalPages = useMemo(() => {
    return Math.ceil((data?.length || 0) / pageSize);
  }, [data?.length, pageSize]);

  const pageData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const cacheKey = `page-${currentPage}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const startIndex = (currentPage - 1) * pageSize;
    const result = data.slice(startIndex, startIndex + pageSize);
    
    cache.set(cacheKey, result);
    
    // Prefetch next pages
    for (let i = 1; i <= prefetchPages; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= totalPages) {
        const nextKey = `page-${nextPage}`;
        if (!cache.has(nextKey)) {
          const nextStart = (nextPage - 1) * pageSize;
          cache.set(nextKey, data.slice(nextStart, nextStart + pageSize));
        }
      }
    }
    
    return result;
  }, [data, currentPage, pageSize, totalPages, cache, prefetchPages]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    data: pageData,
    currentPage,
    totalPages,
    pageSize,
    totalItems: data?.length || 0,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

/**
 * useVirtualScroll - Virtual scrolling for large lists
 * Google-style virtual scrolling (used in Gmail, Google Sheets)
 */
export const useVirtualScroll = (items, itemHeight, containerHeight, options = {}) => {
  const { overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const { visibleRange, totalHeight, offsetY } = useMemo(() => {
    const itemCount = items?.length || 0;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(itemCount, startIndex + visibleCount + overscan * 2);

    return {
      visibleRange: { start: startIndex, end: endIndex },
      totalHeight: itemCount * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items?.length, scrollTop, itemHeight, containerHeight, overscan]);

  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetY: (visibleRange.start + index) * itemHeight
    }));
  }, [items, visibleRange.start, visibleRange.end, itemHeight]);

  const handleScroll = useMemoizedCallback((e) => {
    setScrollTop(e.target.scrollTop);
  });

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollTo: (index) => setScrollTop(index * itemHeight)
  };
};

/**
 * useSearch - Optimized search with debouncing and caching
 * Facebook-style search
 */
export const useSearch = (data, searchFields, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const [cache] = useState(() => new LRUCache(50));

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm || !Array.isArray(data)) return data;

    // Check cache
    const cacheKey = `search-${debouncedSearchTerm}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    perfMonitor.start('useSearch');
    
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
    const result = data.filter(item => {
      return searchFields.some(field => {
        const value = typeof field === 'function' ? field(item) : item[field];
        return value && String(value).toLowerCase().includes(lowerSearchTerm);
      });
    });

    perfMonitor.end('useSearch');
    
    // Cache result
    cache.set(cacheKey, result);
    
    return result;
  }, [data, debouncedSearchTerm, searchFields, cache]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    isSearching: searchTerm !== debouncedSearchTerm,
    resultCount: filteredData?.length || 0
  };
};

/**
 * useIntersectionObserver - Lazy loading
 * Used in Facebook feed, Instagram
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [options]);

  return { ref: targetRef, isIntersecting, hasIntersected };
};

/**
 * useLocalStorage - Persistent state with sync across tabs
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch custom event for cross-tab sync
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail?.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    return () => window.removeEventListener('localStorageChange', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

/**
 * useToggle - Boolean state toggle
 */
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse];
};

/**
 * useMount - Run effect only on mount
 */
export const useMount = (fn) => {
  useEffect(() => {
    fn();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

/**
 * useUnmount - Run effect only on unmount
 */
export const useUnmount = (fn) => {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => fnRef.current();
  }, []);
};

/**
 * useRenderCount - Track component renders (development)
 */
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  renderCount.current += 1;

  if (process.env.NODE_ENV !== 'production') {
    if (renderCount.current > 20) {
      console.warn(`[PERFORMANCE] ${componentName} rendered ${renderCount.current} times`);
    }
  }

  return renderCount.current;
};

/**
 * usePrevious - Get previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * useAsync - Handle async operations
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...args);
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
};

export default {
  useDebounce,
  useThrottle,
  useMemoizedCallback,
  useFilteredData,
  useSortedData,
  useIndexedData,
  useGroupedData,
  usePagination,
  useVirtualScroll,
  useSearch,
  useIntersectionObserver,
  useLocalStorage,
  useToggle,
  useMount,
  useUnmount,
  useRenderCount,
  usePrevious,
  useAsync
};
