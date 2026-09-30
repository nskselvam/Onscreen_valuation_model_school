/**
 * Core Module Exports - Barrel Pattern
 * Google/Facebook-style centralized exports for clean imports
 * 
 * Usage:
 * import { useDebounce, usePagination, FastIndex } from '@/core';
 */

// Performance utilities
export * from './performance';
export { default as Performance } from './performance';

// Advanced hooks
export * from './hooks';
export { default as Hooks } from './hooks';

// Redux utilities
export * from './redux';
export { default as Redux } from './redux';

// Service layer
export * from './service';
export { default as Service } from './service';

// Higher Order Components
export * from './hoc';
export { default as HOC } from './hoc';

// Lazy loading utilities
export * from './lazy';
export { default as Lazy } from './lazy';

// Re-export commonly used items for convenience
export {
  LRUCache,
  Memoizer,
  FastIndex,
  MultiIndex,
  ArrayOps,
  RateLimiters,
  perfMonitor
} from './performance';

export {
  useDebounce,
  useThrottle,
  usePagination,
  useSearch,
  useVirtualScroll,
  useIndexedData,
  useFilteredData,
  useSortedData,
  useGroupedData,
  useIntersectionObserver,
  useLocalStorage,
  useToggle,
  useAsync,
  useMemoizedCallback
} from './hooks';

export {
  normalizeData,
  denormalizeData,
  createIndexedSelector,
  createGroupedSelector,
  createFilteredSelector,
  createSortedSelector,
  createPaginatedSelector,
  StateUpdaters,
  createNormalizedReducer
} from './redux';

export {
  apiClient,
  createAPIClient,
  withRetry,
  parallelRequests
} from './service';
