/**
 * Error Handling Service with Dependency Injection
 * 
 * Provides centralized error handling, logging, and user-friendly error messages
 * Supports different error types: Network, Validation, Authorization, Server, etc.
 */

/**
 * Error type constants
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  VALIDATION_ERROR: 'Please check the information you entered.',
  AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND_ERROR: 'The requested resource was not found.',
  SERVER_ERROR: 'An error occurred on the server. Please try again later.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Factory function to create errorService with dependency injection
 * Allows injecting different logging and analytics clients
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.logger - Logger instance (optional, e.g., console or external service)
 * @param {Object} options.analytics - Analytics client (optional)
 * @param {Function} options.onError - Global error callback (optional)
 * @returns {Object} errorService with error handling methods
 */
export const createErrorService = (options = {}) => {
  const {
    logger = console,
    analytics = null,
    onError = null,
  } = options;

  return {
    /**
     * Parse error from various sources (axios, native Error, etc.)
     * 
     * @param {Error|any} error - The error to parse
     * @returns {Object} Parsed error with type, message, and details
     */
    parseError: (error) => {
      let errorType = ERROR_TYPES.UNKNOWN;
      let statusCode = null;
      let details = null;
      let message = error?.message || 'Unknown error';

      // Handle axios/fetch errors
      if (error?.response) {
        statusCode = error.response.status;

        switch (true) {
          case statusCode === 400:
            errorType = ERROR_TYPES.VALIDATION;
            break;
          case statusCode === 401:
          case statusCode === 403:
            errorType = ERROR_TYPES.AUTHORIZATION;
            break;
          case statusCode === 404:
            errorType = ERROR_TYPES.NOT_FOUND;
            break;
          case statusCode >= 500:
            errorType = ERROR_TYPES.SERVER;
            break;
          default:
            errorType = ERROR_TYPES.SERVER;
        }

        // Extract error details from response
        details = error.response.data?.details || error.response.data;
        message = error.response.data?.message || message;
      } else if (error?.code === 'ECONNABORTED') {
        errorType = ERROR_TYPES.TIMEOUT;
        message = ERROR_MESSAGES.TIMEOUT_ERROR;
      } else if (!navigator.onLine || error?.message?.includes('Network')) {
        errorType = ERROR_TYPES.NETWORK;
        message = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (error instanceof Error) {
        // Native error - keep as is
        errorType = ERROR_TYPES.UNKNOWN;
        message = error.message;
      }

      return {
        type: errorType,
        message,
        statusCode,
        details,
        originalError: error,
      };
    },

    /**
     * Get user-friendly error message
     * 
     * @param {string} errorType - Error type constant
     * @param {string} customMessage - Optional custom message override
     * @returns {string} User-friendly error message
     */
    getUserMessage: (errorType, customMessage) => {
      if (customMessage) return customMessage;
      return ERROR_MESSAGES[errorType] || ERROR_MESSAGES.UNKNOWN_ERROR;
    },

    /**
     * Handle and log an error
     * 
     * @param {Error|any} error - The error to handle
     * @param {Object} context - Additional context about the error
     * @returns {Object} Parsed error object
     */
    handleError: (error, context = {}) => {
      const parsedError = module.parseError(error);

      // Log to console/logger
      logger.error('[ErrorService]', {
        type: parsedError.type,
        message: parsedError.message,
        statusCode: parsedError.statusCode,
        context,
        timestamp: new Date().toISOString(),
      });

      // Send to analytics
      if (analytics?.trackError) {
        analytics.trackError({
          type: parsedError.type,
          message: parsedError.message,
          statusCode: parsedError.statusCode,
          context,
        });
      }

      // Call global error callback
      if (onError) {
        onError(parsedError, context);
      }

      return parsedError;
    },

    /**
     * Handle API errors from service calls
     * 
     * @param {Error} error - The API error
     * @param {Object} options - Error handling options
     * @param {string} options.context - Where the error occurred
     * @param {boolean} options.log - Whether to log the error (default: true)
     * @returns {Object} Structured error object
     */
    handleApiError: (error, options = {}) => {
      const { context = 'API_CALL', log = true } = options;

      const parsedError = module.parseError(error);

      if (log) {
        module.handleError(error, { context });
      }

      return {
        ...parsedError,
        userMessage: module.getUserMessage(parsedError.type),
      };
    },

    /**
     * Handle validation errors from forms
     * 
     * @param {Object} errors - Validation errors object {fieldName: message}
     * @param {string} context - Where validation failed
     * @returns {Object} Structured validation error
     */
    handleValidationError: (errors, context = 'FORM_VALIDATION') => {
      const parsedError = {
        type: ERROR_TYPES.VALIDATION,
        message: 'Validation failed',
        details: errors,
        userMessage: 'Please check the information you entered.',
        fields: Object.keys(errors),
      };

      module.handleError(
        new Error('Validation failed'),
        { context, errors }
      );

      return parsedError;
    },

    /**
     * Retry failed operation with exponential backoff
     * 
     * @param {Function} operation - Async operation to retry
     * @param {Object} options - Retry options
     * @param {number} options.maxAttempts - Max retry attempts (default: 3)
     * @param {number} options.delayMs - Initial delay in ms (default: 1000)
     * @param {number} options.backoffMultiplier - Exponential backoff multiplier (default: 2)
     * @returns {Promise} Result of successful operation
     */
    retryOperation: async (operation, options = {}) => {
      const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
      } = options;

      let lastError;
      let delay = delayMs;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;

          if (attempt < maxAttempts) {
            logger.warn(
              `Attempt ${attempt} failed, retrying in ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= backoffMultiplier;
          }
        }
      }

      // All attempts failed
      throw module.handleError(lastError, {
        context: 'RETRY_EXHAUSTED',
        attempts: maxAttempts,
      });
    },

    /**
     * Create a safe error-wrapped async function
     * 
     * @param {Function} asyncFn - Async function to wrap
     * @param {Object} options - Options for error handling
     * @returns {Function} Wrapped function that handles errors
     */
    wrapAsyncFunction: (asyncFn, options = {}) => {
      return async (...args) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          const context = options.context || asyncFn.name || 'UNKNOWN_FUNCTION';
          return {
            success: false,
            error: module.handleApiError(error, { context }),
          };
        }
      };
    },

    /**
     * Check if error is retryable
     * 
     * @param {Error|string} error - Error or error type
     * @returns {boolean} True if error should be retried
     */
    isRetryable: (error) => {
      const errorType = typeof error === 'string'
        ? error
        : module.parseError(error).type;

      // These errors are worth retrying
      const retryableTypes = [
        ERROR_TYPES.NETWORK,
        ERROR_TYPES.TIMEOUT,
        ERROR_TYPES.SERVER, // 5xx errors might be temporary
      ];

      return retryableTypes.includes(errorType);
    },

    /**
     * Create error summary for UI display
     * 
     * @param {Object} error - Parsed error object
     * @returns {Object} UI-ready error summary
     */
    createErrorSummary: (error) => {
      return {
        title: `${error.type} - Please try again`,
        message: module.getUserMessage(error.type),
        details: error.details,
        isRetryable: module.isRetryable(error),
        timestamp: new Date().toISOString(),
      };
    },

    /**
     * Log error with full context for debugging
     * 
     * @param {Error} error - The error
     * @param {Object} context - Additional context
     * @param {string} context.action - What action was being performed
     * @param {Object} context.data - Data involved in the operation
     * @param {string} context.userId - User ID if applicable
     */
    logErrorWithContext: (error, context = {}) => {
      const parsedError = module.parseError(error);

      logger.error('[ErrorService - Full Context]', {
        error: {
          type: parsedError.type,
          message: parsedError.message,
          statusCode: parsedError.statusCode,
          stack: error?.stack,
        },
        context,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    },
  };
};

// Export default instance
const defaultOptions = {
  logger: console,
  analytics: null,
  onError: null,
};

const module = createErrorService(defaultOptions);
export default module;
