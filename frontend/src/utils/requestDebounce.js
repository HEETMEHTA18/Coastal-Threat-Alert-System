/**
 * Request Debouncer
 * Prevents rapid duplicate API calls
 */

class RequestDebouncer {
  constructor() {
    this.pendingRequests = new Map();
    this.lastRequestTime = new Map();
    this.minInterval = 1000; // Minimum 1 second between same requests
  }

  /**
   * Generate unique key for request
   */
  generateKey(url, method = 'GET', params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Check if request should be throttled
   */
  shouldThrottle(key) {
    const lastTime = this.lastRequestTime.get(key);
    if (!lastTime) {
      return false;
    }

    const timeSinceLastRequest = Date.now() - lastTime;
    return timeSinceLastRequest < this.minInterval;
  }

  /**
   * Debounce an API request
   */
  async debounce(key, requestFunction) {
    // Check if request is being throttled
    if (this.shouldThrottle(key)) {
      console.log('⏸️ Request throttled:', key);
      // Return the pending request if it exists
      const pending = this.pendingRequests.get(key);
      if (pending) {
        return pending;
      }
      // Otherwise wait and retry
      await this.wait(this.minInterval);
    }

    // Check if there's already a pending request
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log('♻️ Reusing pending request:', key);
      return existing;
    }

    // Create new request
    console.log('🚀 Making new request:', key);
    const promise = requestFunction()
      .then(result => {
        this.pendingRequests.delete(key);
        this.lastRequestTime.set(key, Date.now());
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Wait helper
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
    this.lastRequestTime.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      trackedRequests: this.lastRequestTime.size
    };
  }
}

// Singleton instance
const requestDebouncer = new RequestDebouncer();

export default requestDebouncer;

/**
 * Hook for debounced API calls
 */
export const useDebouncedRequest = () => {
  const makeRequest = async (url, method, params, requestFunction) => {
    const key = requestDebouncer.generateKey(url, method, params);
    return requestDebouncer.debounce(key, requestFunction);
  };

  return { makeRequest };
};
