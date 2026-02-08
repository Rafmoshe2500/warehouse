export const FIELD_LABELS = {
  catalog_number: 'מק"ט',
  description: 'תאור פריט',
  manufacturer: 'מספר יצרן | שם יצרן',
  location: 'מיקום',
  serial: 'סריאלי',
  current_stock: 'מלאי קיים',
  warranty_expiry: 'תוקף אחריות',
  reserved_stock: 'מלאי משורין',
  purpose: 'יעוד',
  notes: 'הערות',
  total_rows: 'סה"כ שורות',
  added: 'נוספו',
  updated: 'עודכנו',
  skipped: 'דולגו',
  name: 'שם',
  role: 'תפקיד',
  is_active: 'פעיל',
  username: 'שם משתמש',
};

export const PROCUREMENT_STATUS_OPTIONS = [
  { value: 'waiting_emf', label: 'מחכה ל-EMF' },
  { value: 'waiting_bom', label: 'מחכה ל-BOM' },
  { value: 'ordered', label: 'רכש יצא' },
  { value: 'received', label: 'רכש הגיע' }
];

export const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_UPDATE: 'bulk_update',
  BULK_DELETE: 'bulk_delete',
  DELETE_ALL: 'delete_all',
  IMPORT: 'import',
  UNDO: 'undo',
};

export const ACTION_LABELS = {
  // Basic item operations for filter dropdown
  item_create: 'יצירה',
  item_delete: 'מחיקה',
  item_update: 'עדכון',
  item_import: 'יבוא אקסל',
  undo: 'ביטול פעולה',
  redo: 'שחזור פעולה',
};

export const EDITABLE_FIELDS = [
  'catalog_number',
  'description',
  'manufacturer',
  'location',
  'serial',
  'current_stock',
  'warranty_expiry',
  'reserved_stock',
  'purpose',
  'notes',
];

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30, 50, 100];

export const ROLE_LABELS = {
  admin: 'מנהל',
  user: 'משתמש',
  superadmin: 'סופר-אדמין',
};

export const DATE_FORMAT = 'YYYY-MM-DD';
