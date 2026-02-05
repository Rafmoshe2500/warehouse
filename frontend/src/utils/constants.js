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
  create: 'יצירה',
  update: 'עדכון',
  delete: 'מחיקה',
  bulk_update: 'עדכון מרובה',
  bulk_delete: 'מחיקה מרובה',
  delete_all: 'מחיקת הכל',
  import: 'יבוא',
  undo: 'ביטול פעולה',
  item_create: 'יצירת פריט',
  item_update: 'עדכון פריט',
  item_delete: 'מחיקת פריט',
  item_bulk_update: 'עדכון פריט מרובה',
  item_bulk_delete: 'מחיקת פריט מרובה',
  item_import: 'יבוא פריטים',
  user_create: 'יצירת משתמש',
  user_update: 'עדכון משתמש',
  user_delete: 'מחיקת משתמש',
  user_login: 'התחברות',
  user_logout: 'התנתקות',
  password_change: 'שינוי סיסמה',
  role_change: 'שינוי תפקיד',
  group_create: 'יצירת קבוצה',
  group_update: 'עדכון קבוצה',
  group_delete: 'מחיקת קבוצה',
  procurement_create: 'יצירת הזמנה',
  procurement_update: 'עדכון הזמנה',
  procurement_delete: 'מחיקת הזמנה',
  procurement_file_upload: 'העלאת קובץ',
  procurement_file_delete: 'מחיקת קובץ',
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

export const DATE_FORMAT = 'YYYY-MM-DD';
