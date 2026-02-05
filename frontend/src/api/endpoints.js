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

  // Logs
  LOGS: '/audit/logs',

  // Analytics
  ANALYTICS: '/analytics/dashboard',
  ANALYTICS_ITEM: (catalogNumber) => `/analytics/item/${catalogNumber}`,
  ANALYTICS_ACTIVITY: '/analytics/activity',
  ANALYTICS_TIMELINE: '/analytics/timeline',

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
  PROCUREMENT_ORDER_BY_ID: (id) => `/procurement/orders/${id}`,
  PROCUREMENT_FILES: (orderId) => `/procurement/orders/${orderId}/files`,
  PROCUREMENT_FILE_BY_ID: (orderId, fileId) => `/procurement/orders/${orderId}/files/${fileId}`,
};
