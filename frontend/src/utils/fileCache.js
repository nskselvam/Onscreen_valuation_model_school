import localforage from 'localforage';

// Configure localforage for file caching
localforage.config({ name: 'OnscreenValuation', storeName: 'valuation_files' });

/**
 * Save a blob with the given key to IndexedDB
 * @param {string} key - Cache key
 * @param {Blob} blob - Blob object to cache
 * @returns {Promise<void>}
 */
export async function saveBlob(key, blob) {
  return localforage.setItem(key, blob);
}

/**
 * Retrieve a blob from IndexedDB cache
 * @param {string} key - Cache key
 * @returns {Promise<Blob|null>}
 */
export async function getBlob(key) {
  return localforage.getItem(key);
}

/**
 * Create an object URL from a blob
 * @param {Blob} blob - Blob object
 * @returns {string|null} - Object URL or null if creation fails
 */
export function createObjectURLFromBlob(blob) {
  if (!blob) return null;
  try {
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('Error creating object URL:', e);
    return null;
  }
}

/**
 * Get an object URL for a cached blob using the cache key
 * @param {string} key - Cache key
 * @returns {Promise<string|null>} - Object URL or null if blob not found
 */
export async function getObjectURLForKey(key) {
  const blob = await getBlob(key);
  if (!blob) return null;
  return createObjectURLFromBlob(blob);
}

/**
 * Clear all cached files
 * @returns {Promise<void>}
 */
export async function clearCache() {
  return localforage.clear();
}

/**
 * Remove a specific cached file
 * @param {string} key - Cache key
 * @returns {Promise<void>}
 */
export async function removeFromCache(key) {
  return localforage.removeItem(key);
}
