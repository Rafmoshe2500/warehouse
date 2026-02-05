/**
 * Table configuration constants
 * Centralized configuration for inventory table
 */

// Fields that cannot be edited (immutable)
export const IMMUTABLE_FIELDS = ['serial', 'catalog_number', 'manufacturer', 'project_allocations'];

// Column definitions
export const TABLE_COLUMNS = [
    { key: 'catalog_number', label: 'מק"ט', frozen: true },
    { key: 'serial', label: 'סריאלי', frozen: true },
    { key: 'description', label: 'תיאור' },
    { key: 'manufacturer', label: 'יצרן' },
    { key: 'location', label: 'מיקום' },
    { key: 'current_stock', label: 'מלאי', type: 'number' },
    { key: 'warranty_expiry', label: 'אחריות', type: 'date' },
    { key: 'project_allocations', label: 'שריון עבור', type: 'tags' },
    { key: 'target_site', label: 'אתר יעד', type: 'select', options: 'TARGET_SITES' },
    { key: 'purpose', label: 'יעוד' },
    { key: 'notes', label: 'הערות' },
];

// Get frozen columns (for sticky positioning)
export const FROZEN_COLUMNS = TABLE_COLUMNS.filter(col => col.frozen);

// Get non-frozen columns
export const SCROLLABLE_COLUMNS = TABLE_COLUMNS.filter(col => !col.frozen);

// Keyboard shortcuts help
export const KEYBOARD_SHORTCUTS = {
    'Arrow Keys': 'ניווט בין תאים',
    'Tab': 'מעבר לתא הבא',
    'Enter': 'שמירה ומעבר למטה',
    'F2': 'כניסה למצב עריכה',
    'Escape': 'ביטול עריכה',
    'Ctrl+Z': 'ביטול פעולה',
    'Ctrl+Y': 'חזרה על פעולה'
};
