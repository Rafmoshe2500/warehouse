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
  email: 'אימייל',
  last_login: 'כניסה אחרונה',
  groups: 'קבוצות',
  is_superuser: 'סופר-אדמין',
  permissions: 'הרשאות',
  phone_number: 'טלפון',
  department: 'מחלקה',
  updated_at: 'תאריך עדכון',
  created_at: 'תאריך יצירה',
  modified_count: 'כמות שורות שהושפעו',
  target_site: 'אתר יעד',
  collection_name: 'שם האוסף',
  // Cart / Equipment Requisition
  quantity: 'כמות',
  is_serial: 'פריט סריאלי',
  total_items: 'סה"כ פריטים',
  serial_items: 'פריטים סריאליים',
  non_serial_items: 'פריטים לא סריאליים',
  serial_items_updated_in_inventory: 'עדכונים במחסן',
  items_count: 'כמות פריטים',
  // Procurement
  amount: 'סכום',
  total_amount: 'מחיר',
  order_date: 'תאריך הזמנה',
  created_by: 'נוצר ע"י',
  received_emf: 'התקבל EMF',
  received_bom: 'התקבל BOM',
  filename: 'שם קובץ',
  status: 'סטטוס',
};

export const PROCUREMENT_STATUS_LABELS = {
  waiting_bom_emf:  'ממתין ל-BOM ו-EMF',
  waiting_bom:      'ממתין ל-BOM',
  waiting_emf:      'ממתין ל-EMF',
  waiting_order:    'מחכה שרכש ייצא',
  ordered:          'רכש יצא',
  shipped:          'נשלח',
  waiting_shipment: 'ממתין לשילוח',
  received:         'התקבל',
};

export const PROCUREMENT_STATUS_OPTIONS = Object.entries(PROCUREMENT_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

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
  // Inventory
  item_create: 'יצירה',
  item_delete: 'מחיקה',
  item_update: 'עדכון',
  item_bulk_update: 'עדכון מרובה',
  item_bulk_delete: 'מחיקה מרובה',
  item_import: 'יבוא אקסל',
  undo: 'ביטול פעולה',
  redo: 'שחזור פעולה',
  // Users
  user_create: 'יצירת משתמש',
  user_update: 'עדכון משתמש',
  user_delete: 'מחיקת משתמש',
  user_login: 'התחברות',
  user_domain_login: 'התחברות דומיין',
  user_logout: 'התנתקות',
  password_change: 'שינוי סיסמה',
  role_change: 'שינוי תפקיד',
  // Groups
  group_create: 'יצירת קבוצה',
  group_update: 'עדכון קבוצה',
  group_delete: 'מחיקת קבוצה',
  // Procurement
  procurement_create: 'יצירת הזמנה',
  procurement_update: 'עדכון הזמנה',
  procurement_delete: 'מחיקת הזמנה',
  procurement_file_upload: 'העלאת קובץ',
  procurement_file_delete: 'מחיקת קובץ',
  // Collections
  collection_create: 'יצירת אוסף',
  collection_update: 'עדכון אוסף',
  collection_delete: 'מחיקת אוסף',
  collection_item_add: 'שיוך לאוסף',
  collection_item_remove: 'הסרה מאוסף',
  // Cart / Equipment Requisition
  cart_item_add: 'הוספה לעגלה',
  cart_item_remove: 'הסרה מעגלה',
  cart_checkout: 'משיכת ציוד',
  cart_expired: 'פקיעת תוקף עגלה',
};

export const ADMIN_ACTION_LABELS = {
  user_create: 'יצירת משתמש',
  user_update: 'עדכון משתמש',
  user_delete: 'מחיקת משתמש',
  user_login: 'התחברות',
  password_change: 'שינוי סיסמה',
  group_create: 'יצירת קבוצה',
  group_update: 'עדכון קבוצה',
  group_delete: 'מחיקת קבוצה',
  access_control_update: 'עדכון הרשאות',
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
