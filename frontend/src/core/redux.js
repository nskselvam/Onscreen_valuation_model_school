/**
 * Redux Optimization Utilities - Google/Facebook Level
 * Advanced state management patterns
 */

import { createSelector } from '@reduxjs/toolkit';
import { FastIndex } from './performance';

/**
 * Normalized State Helpers
 * Facebook-style normalized state (used in their Relay framework)
 */
export const normalizeData = (data, idField = 'id') => {
  const ids = [];
  const entities = {};

  if (!Array.isArray(data)) return { ids, entities };

  for (const item of data) {
    const id = item[idField];
    if (id !== undefined && id !== null) {
      ids.push(id);
      entities[id] = item;
    }
  }

  return { ids, entities };
};

/**
 * Denormalize data back to array
 */
export const denormalizeData = (normalized) => {
  if (!normalized || !normalized.ids || !normalized.entities) return [];
  return normalized.ids
    .map(id => normalized.entities[id])
    .filter(Boolean);
};

/**
 * Create memoized selector factory
 * Google-style selector composition
 */
export const createFastSelector = (...inputSelectors) => {
  return createSelector(inputSelectors, (...args) => {
    const computeFn = args[args.length - 1];
    return computeFn;
  });
};

/**
 * Create indexed selector for O(1) lookups
 * Used extensively in large-scale apps
 */
export const createIndexedSelector = (selectItems, keyField = 'id') => {
  return createSelector([selectItems], (items) => {
    if (!Array.isArray(items)) return new Map();
    
    const index = new Map();
    for (const item of items) {
      const key = typeof keyField === 'function' ? keyField(item) : item[keyField];
      if (key !== undefined && key !== null) {
        index.set(String(key), item);
      }
    }
    return index;
  });
};

/**
 * Create grouped selector
 */
export const createGroupedSelector = (selectItems, groupByKey) => {
  return createSelector([selectItems], (items) => {
    if (!Array.isArray(items)) return {};
    
    const groups = {};
    for (const item of items) {
      const key = typeof groupByKey === 'function' ? groupByKey(item) : item[groupByKey];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    return groups;
  });
};

/**
 * Create filtered selector with memoization
 */
export const createFilteredSelector = (selectItems, filterFn) => {
  return createSelector([selectItems], (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(filterFn);
  });
};

/**
 * Create sorted selector
 */
export const createSortedSelector = (selectItems, compareFn) => {
  return createSelector([selectItems], (items) => {
    if (!Array.isArray(items)) return [];
    return [...items].sort(compareFn);
  });
};

/**
 * Create aggregate selector (sum, count, etc.)
 */
export const createAggregateSelector = (selectItems, aggregateFn) => {
  return createSelector([selectItems], (items) => {
    if (!Array.isArray(items)) return null;
    return aggregateFn(items);
  });
};

/**
 * Create paginated selector
 */
export const createPaginatedSelector = (selectItems, selectPage, selectPageSize) => {
  return createSelector(
    [selectItems, selectPage, selectPageSize],
    (items, page, pageSize) => {
      if (!Array.isArray(items)) return { data: [], totalPages: 0, totalItems: 0 };
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: items.slice(startIndex, endIndex),
        totalPages: Math.ceil(items.length / pageSize),
        totalItems: items.length,
        currentPage: page,
        pageSize
      };
    }
  );
};

/**
 * State Update Helpers for Reducers
 * Optimized update operations
 */
export const StateUpdaters = {
  /**
   * Update one item in normalized state
   */
  updateOne(state, id, changes) {
    if (state.entities && state.entities[id]) {
      state.entities[id] = { ...state.entities[id], ...changes };
    }
  },

  /**
   * Update many items
   */
  updateMany(state, updates) {
    if (!state.entities) return;
    for (const { id, changes } of updates) {
      if (state.entities[id]) {
        state.entities[id] = { ...state.entities[id], ...changes };
      }
    }
  },

  /**
   * Add one item
   */
  addOne(state, item, idField = 'id') {
    const id = item[idField];
    if (id === undefined || id === null) return;
    
    if (!state.ids) state.ids = [];
    if (!state.entities) state.entities = {};
    
    if (!state.entities[id]) {
      state.ids.push(id);
      state.entities[id] = item;
    }
  },

  /**
   * Add many items (avoids duplicates)
   */
  addMany(state, items, idField = 'id') {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.addOne(state, item, idField);
    }
  },

  /**
   * Remove one item
   */
  removeOne(state, id) {
    if (!state.ids || !state.entities) return;
    
    if (state.entities[id]) {
      delete state.entities[id];
      state.ids = state.ids.filter(itemId => itemId !== id);
    }
  },

  /**
   * Remove many items
   */
  removeMany(state, ids) {
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      this.removeOne(state, id);
    }
  },

  /**
   * Set all (replace entire state)
   */
  setAll(state, items, idField = 'id') {
    const normalized = normalizeData(items, idField);
    state.ids = normalized.ids;
    state.entities = normalized.entities;
  },

  /**
   * Upsert one (update if exists, insert if not)
   */
  upsertOne(state, item, idField = 'id') {
    const id = item[idField];
    if (id === undefined || id === null) return;
    
    if (!state.ids) state.ids = [];
    if (!state.entities) state.entities = {};
    
    if (state.entities[id]) {
      state.entities[id] = { ...state.entities[id], ...item };
    } else {
      state.ids.push(id);
      state.entities[id] = item;
    }
  },

  /**
   * Upsert many
   */
  upsertMany(state, items, idField = 'id') {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.upsertOne(state, item, idField);
    }
  }
};

/**
 * Create optimized reducer with normalized state
 * Google-style reducer factory
 */
export const createNormalizedReducer = (initialState = { ids: [], entities: {} }) => {
  return {
    initialState,
    reducers: {
      // Set all items (replace)
      setAll(state, action) {
        StateUpdaters.setAll(state, action.payload);
      },
      
      // Add operations
      addOne(state, action) {
        StateUpdaters.addOne(state, action.payload);
      },
      addMany(state, action) {
        StateUpdaters.addMany(state, action.payload);
      },
      
      // Update operations
      updateOne(state, action) {
        const { id, changes } = action.payload;
        StateUpdaters.updateOne(state, id, changes);
      },
      updateMany(state, action) {
        StateUpdaters.updateMany(state, action.payload);
      },
      
      // Remove operations
      removeOne(state, action) {
        StateUpdaters.removeOne(state, action.payload);
      },
      removeMany(state, action) {
        StateUpdaters.removeMany(state, action.payload);
      },
      
      // Upsert operations
      upsertOne(state, action) {
        StateUpdaters.upsertOne(state, action.payload);
      },
      upsertMany(state, action) {
        StateUpdaters.upsertMany(state, action.payload);
      },
      
      // Clear all
      clearAll(state) {
        state.ids = [];
        state.entities = {};
      }
    }
  };
};

/**
 * Batch Actions Helper
 * Combine multiple actions into one for better performance
 */
export const createBatchAction = (type, actions) => ({
  type: `${type}/batch`,
  payload: actions
});

/**
 * Optimistic Update Pattern
 * Facebook-style optimistic UI updates
 */
export const createOptimisticUpdate = (state, tempId, operation) => {
  // Store original state for rollback
  const rollbackPoint = JSON.parse(JSON.stringify(state));
  
  // Apply optimistic update
  operation(state);
  
  return {
    rollback: () => Object.assign(state, rollbackPoint),
    tempId
  };
};

/**
 * Selector Cache for expensive computations
 */
class SelectorCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    this.misses++;
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size
    };
  }
}

export const selectorCache = new SelectorCache();

export default {
  normalizeData,
  denormalizeData,
  createFastSelector,
  createIndexedSelector,
  createGroupedSelector,
  createFilteredSelector,
  createSortedSelector,
  createAggregateSelector,
  createPaginatedSelector,
  StateUpdaters,
  createNormalizedReducer,
  createBatchAction,
  createOptimisticUpdate,
  SelectorCache,
  selectorCache
};
