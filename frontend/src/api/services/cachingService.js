/**
 * Caching Service with Dependency Injection
 * 
 * Provides in-memory caching with TTL (Time To Live) support
 * Useful for caching API responses and expensive computations
 */

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {any} data - Cached data
 * @property {number} timestamp - When the entry was created
 * @property {number} ttl - Time to live in milliseconds
 * @property {number} hits - Number of times accessed
 */

/**
 * Factory function to create cachingService with dependency injection
 * Allows injecting different storage backends (memory, localStorage, Redis, etc.)
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.defaultTtl - Default TTL in milliseconds (default: 5 minutes)
 * @param {number} options.maxSize - Maximum cache size in bytes (default: 10MB)
 * @param {Object} options.storage - Storage backend (default: in-memory)
 * @param {Object} options.logger - Logger instance (optional)
 * @returns {Object} cachingService with cache operations
 */
export const createCachingService = (options = {}) => {
  const {
    defaultTtl = 5 * 60 * 1000, // 5 minutes
    maxSize = 10 * 1024 * 1024, // 10MB
    storage = null,
    logger = console,
  } = options;

  // In-memory cache store
  let memoryCache = new Map();
  let cacheSize = 0;

  return {
    /**
     * Get item from cache
     * 
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get: (key) => {
      const entry = memoryCache.get(key);

      if (!entry) {
        return null;
      }

      // Check if expired
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        module.delete(key);
        return null;
      }

      // Update hit count
      entry.hits++;

      logger.debug(`[CachingService] Cache hit for key: ${key}`);
      return entry.data;
    },

    /**
     * Set item in cache
     * 
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - TTL in milliseconds (optional, uses default)
     */
    set: (key, data, ttl = defaultTtl) => {
      // Rough size estimation (JSON stringified)
      const dataSize = JSON.stringify(data).length * 2; // 2 bytes per character

      // Check size limit
      if (cacheSize + dataSize > maxSize) {
        module.cleanup();
      }

      // Remove old entry if exists
      if (memoryCache.has(key)) {
        const oldEntry = memoryCache.get(key);
        cacheSize -= JSON.stringify(oldEntry.data).length * 2;
      }

      // Create new entry
      const entry = {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0,
      };

      memoryCache.set(key, entry);
      cacheSize += dataSize;

      logger.debug(`[CachingService] Cached key: ${key} (TTL: ${ttl}ms)`);
    },

    /**
     * Delete specific cache entry
     * 
     * @param {string} key - Cache key to delete
     * @returns {boolean} True if deleted, false if not found
     */
    delete: (key) => {
      const entry = memoryCache.get(key);
      if (!entry) return false;

      memoryCache.delete(key);
      cacheSize -= JSON.stringify(entry.data).length * 2;

      logger.debug(`[CachingService] Deleted cache key: ${key}`);
      return true;
    },

    /**
     * Clear all cache
     */
    clear: () => {
      memoryCache.clear();
      cacheSize = 0;
      logger.debug('[CachingService] Cache cleared');
    },

    /**
     * Get or fetch - returns cached value or calls fetch function
     * 
     * @param {string} key - Cache key
     * @param {Function} fetchFn - Async function to call if not cached
     * @param {number} ttl - TTL in milliseconds (optional)
     * @returns {Promise<any>} Cached or fetched data
     */
    getOrFetch: async (key, fetchFn, ttl = defaultTtl) => {
      // Try to get from cache
      const cached = module.get(key);
      if (cached !== null) {
        logger.debug(`[CachingService] Using cached value for key: ${key}`);
        return cached;
      }

      // Not in cache, fetch it
      logger.debug(`[CachingService] Cache miss for key: ${key}, fetching...`);
      const data = await fetchFn();

      // Cache the result
      module.set(key, data, ttl);

      return data;
    },

    /**
     * Memoize function results
     * 
     * @param {Function} fn - Function to memoize
     * @param {Object} options - Memoization options
     * @param {Function} options.keyBuilder - Function to build cache key from args
     * @param {number} options.ttl - TTL for cached results
     * @returns {Function} Memoized function
     */
    memoize: (fn, options = {}) => {
      const {
        keyBuilder = (...args) => JSON.stringify(args),
        ttl = defaultTtl,
      } = options;

      return (...args) => {
        const key = keyBuilder(...args);
        const cached = module.get(key);

        if (cached !== null) {
          logger.debug(`[CachingService] Memoized hit for: ${key}`);
          return cached;
        }

        const result = fn(...args);
        module.set(key, result, ttl);
        return result;
      };
    },

    /**
     * Cleanup expired entries and free space
     * Removes least recently used (LRU) entries if necessary
     */
    cleanup: () => {
      const now = Date.now();
      let cleanedCount = 0;
      let freedSize = 0;

      // Remove expired entries
      for (const [key, entry] of memoryCache.entries()) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          const entrySize = JSON.stringify(entry.data).length * 2;
          memoryCache.delete(key);
          cacheSize -= entrySize;
          freedSize += entrySize;
          cleanedCount++;
        }
      }

      // If still over limit, remove LRU entries
      if (cacheSize > maxSize * 0.8) { // 80% threshold
        const entries = Array.from(memoryCache.entries())
          .sort((a, b) => a[1].hits - b[1].hits);

        for (const [key, entry] of entries) {
          if (cacheSize <= maxSize * 0.7) break; // 70% target

          const entrySize = JSON.stringify(entry.data).length * 2;
          memoryCache.delete(key);
          cacheSize -= entrySize;
          freedSize += entrySize;
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.debug(
          `[CachingService] Cleanup removed ${cleanedCount} entries, freed ${freedSize} bytes`
        );
      }
    },

    /**
     * Get cache statistics
     * 
     * @returns {Object} Cache stats
     */
    getStats: () => {
      let totalHits = 0;
      let totalSize = 0;

      for (const [, entry] of memoryCache.entries()) {
        totalHits += entry.hits;
        totalSize += JSON.stringify(entry.data).length * 2;
      }

      return {
        size: cacheSize,
        maxSize,
        percentFull: ((cacheSize / maxSize) * 100).toFixed(2),
        entries: memoryCache.size,
        totalHits,
        hitRate: totalHits > 0 ? (totalHits / memoryCache.size).toFixed(2) : 0,
      };
    },

    /**
     * Invalidate cache by pattern
     * 
     * @param {RegExp|Function} pattern - RegExp or function to match keys
     * @returns {number} Number of invalidated entries
     */
    invalidateByPattern: (pattern) => {
      let count = 0;

      for (const key of memoryCache.keys()) {
        const shouldInvalidate = pattern instanceof RegExp
          ? pattern.test(key)
          : pattern(key);

        if (shouldInvalidate) {
          const entry = memoryCache.get(key);
          cacheSize -= JSON.stringify(entry.data).length * 2;
          memoryCache.delete(key);
          count++;
        }
      }

      logger.debug(
        `[CachingService] Invalidated ${count} entries matching pattern`
      );
      return count;
    },

    /**
     * Create a cached version of an async function
     * 
     * @param {Function} asyncFn - Async function to wrap
     * @param {Object} options - Cache options
     * @param {Function} options.keyBuilder - Build key from args
     * @param {number} options.ttl - TTL for cached results
     * @returns {Function} Wrapped cached function
     */
    wrapAsyncFunction: (asyncFn, options = {}) => {
      const {
        keyBuilder = (...args) => JSON.stringify([asyncFn.name, ...args]),
        ttl = defaultTtl,
      } = options;

      return async (...args) => {
        const key = keyBuilder(...args);
        return module.getOrFetch(
          key,
          () => asyncFn(...args),
          ttl
        );
      };
    },

    /**
     * List all cache keys
     * 
     * @returns {string[]} Array of cache keys
     */
    keys: () => Array.from(memoryCache.keys()),

    /**
     * Check if key exists in cache
     * 
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and not expired
     */
    has: (key) => {
      if (!memoryCache.has(key)) return false;

      const entry = memoryCache.get(key);
      const age = Date.now() - entry.timestamp;

      if (age > entry.ttl) {
        module.delete(key);
        return false;
      }

      return true;
    },
  };
};

// Export default instance
const defaultOptions = {
  defaultTtl: 5 * 60 * 1000,
  maxSize: 10 * 1024 * 1024,
  logger: console,
};

const module = createCachingService(defaultOptions);
export default module;
