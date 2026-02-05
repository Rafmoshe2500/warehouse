/**
 * Services Export Hub
 * 
 * Exports both factory functions and default instances for all services
 * This allows for:
 * 1. Easy dependency injection with custom apiClient
 * 2. Default instances for backward compatibility
 * 3. Testing with mock clients
 * 
 * API Services (with DI):
 * - itemService: CRUD operations for inventory items
 * - excelService: Excel import/export functionality
 * - logService: Activity and audit logs
 * - authService: User authentication and authorization
 * 
 * Utility Services (with DI):
 * - errorService: Centralized error handling and logging
 * - cachingService: In-memory caching with TTL support
 * 
 * Usage:
 * - Default instance: import itemService from '../services/itemService'
 * - With DI: import { createItemService } from '../services/itemService'
 */

// API Services
export { createItemService, default as itemService } from './itemService';
export { createExcelService, default as excelService } from './excelService';
export { createLogService, default as logService } from './logService';
export { createAuthService, default as authService } from './authService';

// Utility Services
export { 
  createErrorService, 
  default as errorService,
  ERROR_TYPES,
  ERROR_MESSAGES,
} from './errorService';
export { 
  createCachingService, 
  default as cachingService,
} from './cachingService';

/**
 * Service factory creator that creates all services with same apiClient
 * 
 * @param {Object} apiClient - API client to inject into services
 * @param {Object} options - Additional options for services
 * @returns {Object} Object with all service instances
 */
export const createServices = (apiClient, options = {}) => {
  const errorServiceOptions = {
    logger: options.logger || console,
    analytics: options.analytics || null,
    onError: options.onError || null,
  };

  const cachingServiceOptions = {
    defaultTtl: options.defaultTtl || 5 * 60 * 1000,
    maxSize: options.maxSize || 10 * 1024 * 1024,
    logger: options.logger || console,
  };

  return {
    // API Services
    itemService: require('./itemService').createItemService(apiClient),
    excelService: require('./excelService').createExcelService(apiClient),
    logService: require('./logService').createLogService(apiClient),
    authService: require('./authService').createAuthService(apiClient),
    
    // Utility Services
    errorService: require('./errorService').createErrorService(errorServiceOptions),
    cachingService: require('./cachingService').createCachingService(cachingServiceOptions),
  };
};
