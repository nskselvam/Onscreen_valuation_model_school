/**
 * Performance Utilities - Google/Facebook Level
 * Data structures and optimizations for high-performance React apps
 */

/**
 * LRU Cache - O(1) operations
 * Used for caching API responses, computed values, search results
 */
export class LRUCache {
  constructor(capacity = 100, ttl = 300000) {
    this.capacity = capacity;
    this.ttl = ttl;
    this.cache = new Map();
    this.timestamps = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.timestamps.delete(firstKey);
    }
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  has(key) {
    if (!this.cache.has(key)) return false;
    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return false;
    }
    return true;
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  delete(key) {
    this.timestamps.delete(key);
    return this.cache.delete(key);
  }

  get size() {
    return this.cache.size;
  }
}

/**
 * Memoizer - Function result caching
 */
export class Memoizer {
  constructor(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    this.fn = fn;
    this.cache = new LRUCache(50);
    this.keyGenerator = keyGenerator;
  }

  execute(...args) {
    const key = this.keyGenerator(...args);
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const result = this.fn(...args);
    this.cache.set(key, result);
    return result;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * FastIndex - O(1) lookups instead of O(n) Array.find
 */
export class FastIndex {
  constructor(items = [], keyField = 'id') {
    this.keyField = keyField;
    this.index = new Map();
    this.rebuild(items);
  }

  rebuild(items) {
    this.index.clear();
    items.forEach(item => {
      const key = item[this.keyField];
      if (key !== undefined && key !== null) {
        this.index.set(key, item);
      }
    });
  }

  get(key) {
    return this.index.get(key);
  }

  has(key) {
    return this.index.has(key);
  }

  add(item) {
    const key = item[this.keyField];
    if (key !== undefined && key !== null) {
      this.index.set(key, item);
    }
  }

  remove(key) {
    this.index.delete(key);
  }

  update(key, item) {
    if (this.index.has(key)) {
      this.index.set(key, item);
    }
  }

  getAll() {
    return Array.from(this.index.values());
  }

  get size() {
    return this.index.size;
  }

  clear() {
    this.index.clear();
  }
}

/**
 * MultiIndex - Multiple indexes for complex queries
 */
export class MultiIndex {
  constructor(items = [], indexes = ['id']) {
    this.indexes = {};
    indexes.forEach(field => {
      this.indexes[field] = new Map();
    });
    this.rebuild(items);
  }

  rebuild(items) {
    Object.values(this.indexes).forEach(index => index.clear());
    items.forEach(item => this.add(item));
  }

  add(item) {
    Object.keys(this.indexes).forEach(field => {
      const value = item[field];
      if (value !== undefined && value !== null) {
        if (!this.indexes[field].has(value)) {
          this.indexes[field].set(value, []);
        }
        this.indexes[field].get(value).push(item);
      }
    });
  }

  getBy(field, value) {
    return this.indexes[field]?.get(value) || [];
  }

  clear() {
    Object.values(this.indexes).forEach(index => index.clear());
  }
}

/**
 * Array Operations - Optimized common operations
 */
export const ArrayOps = {
  binarySearch(arr, target, compareFn = (a, b) => a - b) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const cmp = compareFn(arr[mid], target);

      if (cmp === 0) return mid;
      if (cmp < 0) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  },

  unique(arr, keyFn = item => item) {
    const seen = new Set();
    return arr.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  intersection(arr1, arr2, keyFn = item => item) {
    const set2 = new Set(arr2.map(keyFn));
    return arr1.filter(item => set2.has(keyFn(item)));
  },

  difference(arr1, arr2, keyFn = item => item) {
    const set2 = new Set(arr2.map(keyFn));
    return arr1.filter(item => !set2.has(keyFn(item)));
  },

  groupBy(arr, keyFn) {
    return arr.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  partition(arr, predicateFn) {
    return arr.reduce(
      ([pass, fail], item) => {
        return predicateFn(item) 
          ? [[...pass, item], fail] 
          : [pass, [...fail, item]];
      },
      [[], []]
    );
  }
};

/**
 * Rate Limiters - Debounce and Throttle
 */
export const RateLimiters = {
  debounce(fn, delay = 300, options = {}) {
    let timeoutId = null;
    const { leading = false, trailing = true } = options;
    let lastCallTime = 0;

    const debounced = function(...args) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      const execute = () => {
        lastCallTime = now;
        fn.apply(this, args);
      };

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (leading && timeSinceLastCall > delay) {
        execute();
      }

      if (trailing) {
        timeoutId = setTimeout(execute, delay);
      }
    };

    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return debounced;
  },

  throttle(fn, delay = 300, options = {}) {
    let lastCallTime = 0;
    let timeoutId = null;
    const { leading = true, trailing = true } = options;

    const throttled = function(...args) {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;

      const execute = () => {
        lastCallTime = Date.now();
        fn.apply(this, args);
      };

      if (leading && timeSinceLastCall >= delay) {
        execute();
      } else if (trailing) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          execute();
          timeoutId = null;
        }, delay - timeSinceLastCall);
      }
    };

    throttled.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    return throttled;
  },

  rafThrottle(fn) {
    let rafId = null;
    let lastArgs = null;

    const throttled = function(...args) {
      lastArgs = args;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          fn.apply(this, lastArgs);
          rafId = null;
          lastArgs = null;
        });
      }
    };

    throttled.cancel = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    return throttled;
  }
};

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }

  start(name) {
    this.marks.set(name, performance.now());
  }

  measure(name) {
    const startTime = this.marks.get(name);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    this.marks.delete(name);

    if (duration > 16) {
      console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms (>16ms)`);
    }

    return duration;
  }

  getMetrics() {
    return {
      marks: Array.from(this.marks.entries()),
      measures: Array.from(this.measures.entries())
    };
  }

  clear() {
    this.marks.clear();
    this.measures.clear();
  }
}

export const perfMonitor = new PerformanceMonitor();

export default {
  LRUCache,
  Memoizer,
  FastIndex,
  MultiIndex,
  ArrayOps,
  RateLimiters,
  perfMonitor
};
