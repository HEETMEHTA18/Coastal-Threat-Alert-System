/**
 * API Retry Utility
 * Implements exponential backoff retry logic for failed API calls
 */

/**
 * Retry configuration
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'NetworkError']
};

/**
 * Check if error is retryable
 */
const isRetryable = (error, config = DEFAULT_CONFIG) => {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('Network')) {
    return true;
  }

  // Fetch errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // HTTP status errors
  if (error.response && config.retryableStatuses.includes(error.response.status)) {
    return true;
  }

  // Specific error codes
  if (error.code && config.retryableErrors.includes(error.code)) {
    return true;
  }

  return false;
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt, config = DEFAULT_CONFIG) => {
  const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
  // Add jitter (random variation) to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, config.maxDelay);
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper for async functions
 */
export const retryAsync = async (
  fn,
  config = DEFAULT_CONFIG,
  onRetry = null
) => {
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Success - log if it was a retry
      if (attempt > 0) {
        console.log(`✅ Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < config.maxRetries && isRetryable(error, config)) {
        const delay = calculateDelay(attempt, config);
        
        console.warn(
          `⚠️ Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}). ` +
          `Retrying in ${Math.round(delay / 1000)}s...`,
          error.message
        );
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, delay, error);
        }
        
        await sleep(delay);
      } else {
        // Not retryable or max retries reached
        if (attempt >= config.maxRetries) {
          console.error(`❌ Request failed after ${config.maxRetries} retries:`, error);
        }
        throw error;
      }
    }
  }
  
  throw lastError;
};

/**
 * HOC for wrapping API service methods with retry logic
 */
export const withRetry = (apiMethod, config = DEFAULT_CONFIG) => {
  return async (...args) => {
    return retryAsync(
      () => apiMethod(...args),
      config,
      (attempt, delay, error) => {
        console.log(`🔄 Retrying ${apiMethod.name || 'API call'} (attempt ${attempt})`);
      }
    );
  };
};

/**
 * React hook for retry logic
 */
export const useRetry = (config = DEFAULT_CONFIG) => {
  const retry = async (fn, customConfig = {}) => {
    return retryAsync(fn, { ...config, ...customConfig });
  };

  return { retry };
};

/**
 * Fetch with retry
 */
export const fetchWithRetry = async (url, options = {}, config = DEFAULT_CONFIG) => {
  return retryAsync(
    async () => {
      const response = await fetch(url, options);
      
      // Check if response is OK
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        throw error;
      }
      
      return response;
    },
    config
  );
};

/**
 * Axios-compatible retry wrapper
 */
export const axiosRetry = (axiosInstance, config = DEFAULT_CONFIG) => {
  axiosInstance.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      
      // Initialize retry count
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      // Check if we should retry
      if (
        originalRequest._retryCount < config.maxRetries &&
        isRetryable(error, config)
      ) {
        originalRequest._retryCount++;
        const delay = calculateDelay(originalRequest._retryCount - 1, config);
        
        console.warn(
          `⚠️ Request to ${originalRequest.url} failed. ` +
          `Retrying (${originalRequest._retryCount}/${config.maxRetries})...`
        );
        
        await sleep(delay);
        return axiosInstance(originalRequest);
      }
      
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
};

export default {
  retryAsync,
  withRetry,
  useRetry,
  fetchWithRetry,
  axiosRetry,
  DEFAULT_CONFIG
};
