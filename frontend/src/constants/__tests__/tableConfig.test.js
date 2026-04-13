import {
  IMMUTABLE_FIELDS,
  TABLE_COLUMNS,
  COLLECTION_TABLE_COLUMNS,
  FROZEN_COLUMNS,
  SCROLLABLE_COLUMNS,
  KEYBOARD_SHORTCUTS,
} from '../tableConfig';

describe('tableConfig', () => {
  describe('IMMUTABLE_FIELDS', () => {
    it('should be an array', () => {
      expect(Array.isArray(IMMUTABLE_FIELDS)).toBe(true);
    });

    it('should contain catalog_number and serial', () => {
      expect(IMMUTABLE_FIELDS).toContain('serial');
      expect(IMMUTABLE_FIELDS).toContain('catalog_number');
    });

    it('should not contain editable fields like description or notes', () => {
      expect(IMMUTABLE_FIELDS).not.toContain('description');
      expect(IMMUTABLE_FIELDS).not.toContain('notes');
    });
  });

  describe('TABLE_COLUMNS', () => {
    it('should be a non-empty array', () => {
      expect(TABLE_COLUMNS.length).toBeGreaterThan(0);
    });

    it('should have key and label for every column', () => {
      TABLE_COLUMNS.forEach((col) => {
        expect(col).toHaveProperty('key');
        expect(col).toHaveProperty('label');
        expect(typeof col.key).toBe('string');
        expect(typeof col.label).toBe('string');
      });
    });

    it('should not have duplicate keys', () => {
      const keys = TABLE_COLUMNS.map((c) => c.key);
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });

    it('should have exactly 2 frozen columns', () => {
      const frozen = TABLE_COLUMNS.filter((c) => c.frozen);
      expect(frozen.length).toBe(2);
    });
  });

  describe('FROZEN_COLUMNS / SCROLLABLE_COLUMNS', () => {
    it('should split TABLE_COLUMNS correctly', () => {
      expect(FROZEN_COLUMNS.length + SCROLLABLE_COLUMNS.length).toBe(
        TABLE_COLUMNS.length
      );
    });

    it('should have all frozen columns marked frozen', () => {
      FROZEN_COLUMNS.forEach((col) => {
        expect(col.frozen).toBe(true);
      });
    });

    it('should have no frozen columns in scrollable', () => {
      SCROLLABLE_COLUMNS.forEach((col) => {
        expect(col.frozen).toBeFalsy();
      });
    });
  });

  describe('COLLECTION_TABLE_COLUMNS', () => {
    it('should be a non-empty array', () => {
      expect(COLLECTION_TABLE_COLUMNS.length).toBeGreaterThan(0);
    });

    it('should have key and label for every column', () => {
      COLLECTION_TABLE_COLUMNS.forEach((col) => {
        expect(col).toHaveProperty('key');
        expect(col).toHaveProperty('label');
      });
    });
  });

  describe('KEYBOARD_SHORTCUTS', () => {
    it('should define all expected shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Arrow Keys');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Tab');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Enter');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('F2');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Escape');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Ctrl+Z');
      expect(KEYBOARD_SHORTCUTS).toHaveProperty('Ctrl+Y');
    });

    it('should have non-empty string values', () => {
      Object.values(KEYBOARD_SHORTCUTS).forEach((desc) => {
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });
});
