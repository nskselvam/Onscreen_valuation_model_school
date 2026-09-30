/**
 * Service Layer - API Communication Patterns
 * Google/Facebook-style service architecture
 */

import { LRUCache, perfMonitor } from './performance';

/**
 * HTTP Client with interceptors and caching
 * Similar to Google's gRPC-Web and Facebook's Relay
 */
class HTTPClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 30000;
    this.headers = config.headers || {};
    this.cache = new LRUCache(config.cacheSize || 100);
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }

  /**
   * Apply request interceptors
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    return modifiedConfig;
  }

  /**
   * Apply response interceptors
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    return modifiedResponse;
  }

  /**
   * Apply error interceptors
   */
  async applyErrorInterceptors(error) {
    let modifiedError = error;
    for (const interceptor of this.interceptors.error) {
      modifiedError = await interceptor(modifiedError);
    }
    return modifiedError;
  }

  /**
   * Generate cache key
   */
  getCacheKey(method, url, params) {
    return `${method}:${url}:${JSON.stringify(params || {})}`;
  }

  /**
   * Core request method
   */
  async request(config) {
    try {
      perfMonitor.start(`api:${config.url}`);

      // Apply request interceptors
      const requestConfig = await this.applyRequestInterceptors(config);

      // Check cache for GET requests
      if (requestConfig.method === 'GET' && !requestConfig.skipCache) {
        const cacheKey = this.getCacheKey(
          requestConfig.method,
          requestConfig.url,
          requestConfig.params
        );
        const cached = this.cache.get(cacheKey);
        if (cached) {
          perfMonitor.end(`api:${config.url}`);
          return cached;
        }
      }

      // Build URL
      const url = this.buildURL(requestConfig.url, requestConfig.params);

      // Build request options
      const options = {
        method: requestConfig.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
          ...requestConfig.headers
        }
      };

      // Add body for non-GET requests
      if (requestConfig.method !== 'GET' && requestConfig.data) {
        options.body = JSON.stringify(requestConfig.data);
      }

      // Add credentials
      if (requestConfig.withCredentials !== false) {
        options.credentials = 'include';
      }

      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const result = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: requestConfig
      };

      // Apply response interceptors
      const finalResult = await this.applyResponseInterceptors(result);

      // Cache GET responses
      if (requestConfig.method === 'GET' && !requestConfig.skipCache) {
        const cacheKey = this.getCacheKey(
          requestConfig.method,
          requestConfig.url,
          requestConfig.params
        );
        const cacheTTL = requestConfig.cacheTTL || 300000; // 5 min default
        this.cache.set(cacheKey, finalResult, cacheTTL);
      }

      perfMonitor.end(`api:${config.url}`);
      return finalResult;

    } catch (error) {
      perfMonitor.end(`api:${config.url}`);

      // Apply error interceptors
      const finalError = await this.applyErrorInterceptors(error);
      throw finalError;
    }
  }

  /**
   * Build URL with query parameters
   */
  buildURL(url, params) {
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    if (!params || Object.keys(params).length === 0) {
      return fullURL;
    }

    const urlObj = new URL(fullURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, value);
      }
    });

    return urlObj.toString();
  }

  /**
   * GET request
   */
  get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  /**
   * POST request
   */
  post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  patch(url, data, config = {}) {
    return this.request({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Invalidate specific cache entries
   */
  invalidateCache(pattern) {
    // Clear entire cache if no pattern specified
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear matching entries
    // Note: LRUCache would need to expose keys() method for this
    this.cache.clear();
  }
}

/**
 * Create default API client
 */
export const createAPIClient = (config = {}) => {
  const client = new HTTPClient(config);

  // Add default request interceptor for auth
  client.addRequestInterceptor(async (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return config;
  });

  // Add default response interceptor
  client.addResponseInterceptor(async (response) => {
    return response;
  });

  // Add default error interceptor
  client.addErrorInterceptor(async (error) => {
    if (error.message.includes('401')) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return error;
  });

  return client;
};

/**
 * Request Queue for batch operations
 * Facebook-style request batching
 */
class RequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 50;
    this.timer = null;
    this.onFlush = options.onFlush || null;
  }

  add(request) {
    this.queue.push(request);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }

    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });
  }

  scheduleFlush() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.batchDelay);
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    if (this.onFlush) {
      try {
        const results = await this.onFlush(batch);
        batch.forEach((req, index) => {
          if (req.resolve) req.resolve(results[index]);
        });
      } catch (error) {
        batch.forEach(req => {
          if (req.reject) req.reject(error);
        });
      }
    }
  }

  clear() {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

/**
 * Retry logic with exponential backoff
 * Google-style retry strategy
 */
export const withRetry = async (
  fn,
  options = {}
) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = (error) => true
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
};

/**
 * Parallel requests with concurrency limit
 * Similar to Google's batch processing
 */
export const parallelRequests = async (
  requests,
  options = {}
) => {
  const { concurrency = 5, onProgress = null } = options;

  const results = [];
  const executing = [];
  let completed = 0;

  for (const [index, request] of requests.entries()) {
    const promise = Promise.resolve(request()).then(result => {
      completed++;
      if (onProgress) {
        onProgress({ completed, total: requests.length });
      }
      return result;
    });

    results[index] = promise;

    if (concurrency <= requests.length) {
      const executing_promise = promise.then(() => {
        executing.splice(executing.indexOf(executing_promise), 1);
      });
      executing.push(executing_promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
};

// Create default client instance
export const apiClient = createAPIClient({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  cacheSize: 100
});

export default {
  HTTPClient,
  createAPIClient,
  RequestQueue,
  withRetry,
  parallelRequests,
  apiClient
};
