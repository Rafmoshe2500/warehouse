export const QUERY_KEYS = {
  items: {
    all: ['items'],
    list: (params) => ['items', 'list', params],
    stale: (params) => ['items', 'stale', params],
    details: (id) => ['items', 'details', id],
  },
  logs: {
    list: (params) => ['logs', 'list', params],
  },
  analytics: {
    dashboard: ['analytics', 'dashboard'],
    activity: (days) => ['analytics', 'activity', days],
    itemProject: (catalogNumber) => ['analytics', 'itemProject', catalogNumber],
  },
  users: {
    all: ['users'],
    list: (params) => ['users', 'list', params],
    details: (id) => ['users', 'details', id],
  },
  groups: {
    all: ['groups'],
    list: () => ['groups', 'list'],
  },
  auth: {
    user: ['auth', 'user'],
  },
  collections: {
    all: ['collections'],
    details: (id) => ['collections', 'details', id],
    items: (id) => ['collections', 'items', id],
  },
  bomTemplates: {
    all: ['bom-templates'],
  },
  catalog: {
    list: (params) => ['catalog', params],
  },
  procurement: {
    all: ['procurement-orders'],
    orders: (page, pageSize, search, statusFilter) => ['procurement-orders', page, pageSize, search, statusFilter],
    summary: ['procurement-summary'],
  },
};
