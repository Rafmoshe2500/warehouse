export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  DOMAIN_LOGIN: '/auth/domain-login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  CHANGE_PASSWORD: '/auth/password',

  // Items
  ITEMS: '/items',
  ITEM_BY_ID: (id) => `/items/${id}`,
  BULK_UPDATE: '/items/bulk-update',
  BULK_DELETE: '/items/bulk-delete',
  DELETE_ALL: '/items/delete-all',

  // Excel
  IMPORT_EXCEL: '/items/import-excel',
  IMPORT_PROJECTS: '/items/import-projects',
  EXPORT_EXCEL: '/items/export-excel',

  // Catalog
  CATALOG: '/catalog',

  // Logs
  LOGS: '/audit/logs',

  // Analytics
  ANALYTICS: '/analytics/dashboard',
  ANALYTICS_ITEM: (catalogNumber) => `/analytics/item/${catalogNumber}`,
  ANALYTICS_ACTIVITY: '/analytics/activity',
  ANALYTICS_TIMELINE: '/analytics/timeline',

  // Search
  GLOBAL_SEARCH: '/search',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: (id) => `/admin/users/${id}`,
  ADMIN_STATS: '/admin/stats',

  // Audit
  AUDIT_LOGS: '/audit/logs',
  AUDIT_USER_ACTIVITY: (username) => `/audit/users/${username}`,

  // Groups
  ADMIN_GROUPS: '/admin/groups',
  ADMIN_GROUP_BY_ID: (id) => `/admin/groups/${id}`,

  // Procurement
  PROCUREMENT_ORDERS: '/procurement/orders',
  PROCUREMENT_SUMMARY: '/procurement/summary',
  PROCUREMENT_ORDER_BY_ID: (id) => `/procurement/orders/${id}`,
  PROCUREMENT_FILES: (orderId) => `/procurement/orders/${orderId}/files`,
  PROCUREMENT_FILE_BY_ID: (orderId, fileId) => `/procurement/orders/${orderId}/files/${fileId}`,

  // Collections
  ITEM_COLLECTIONS: (id) => `/items/${id}/collections`,
  COLLECTIONS: '/collections/',
  COLLECTION_BY_ID: (id) => `/collections/${id}`,
  COLLECTION_ITEMS: (id) => `/collections/${id}/items`,
  COLLECTION_ITEM_BY_ID: (collectionId, itemId) => `/collections/${collectionId}/items/${itemId}`,
  COLLECTION_PERMISSIONS: (id) => `/collections/${id}/permissions`,
  EXPORT_COLLECTION: (id) => `/collections/${id}/export`,

  // Cart
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  CART_ITEM_BY_ID: (itemId) => `/cart/items/${itemId}`,
  CART_CHECKOUT: '/cart/checkout',
};
