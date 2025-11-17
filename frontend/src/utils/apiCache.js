/**
 * API Response Cache Manager
 * Prevents excessive API calls by caching responses with TTL
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    this.cleanupInterval = 60 * 1000; // Cleanup every minute
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log('📦 Cache HIT:', key);
    return cached.data;
  }

  /**
   * Store data in cache with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, {
      data,
      expiresAt,
      cachedAt: Date.now()
    });

    console.log('💾 Cache SET:', key, `(TTL: ${ttl / 1000}s)`);
  }

  /**
   * Clear specific cache entry
   */
  delete(key) {
    this.cache.delete(key);
    console.log('🗑️ Cache DELETE:', key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache CLEARED');
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, value] of this.cache.entries()) {
        if (now > value.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// Singleton instance
const apiCache = new APICache();

export default apiCache;

/**
 * HOC for caching API calls
 */
export const withCache = (apiFunction, ttl) => {
  return async (...args) => {
    const cacheKey = apiCache.generateKey(apiFunction.name, { args: JSON.stringify(args) });
    
    // Try to get from cache
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Call API and cache result
    try {
      const result = await apiFunction(...args);
      apiCache.set(cacheKey, result, ttl);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };
};
