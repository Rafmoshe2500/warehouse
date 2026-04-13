import {
  formatDate,
  formatDateTime,
  formatNumber,
  truncateText,
  formatCellValue,
} from '../formatters';

describe('formatDate', () => {
  it('should return empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('should format a valid date string', () => {
    const result = formatDate('2024-03-15');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatDateTime', () => {
  it('should return empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(formatDateTime('')).toBe('');
  });

  it('should format a valid datetime string', () => {
    const result = formatDateTime('2024-03-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatNumber', () => {
  it('should return empty string for null', () => {
    expect(formatNumber(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatNumber(undefined)).toBe('');
  });

  it('should preserve zero', () => {
    const result = formatNumber(0);
    expect(result).toBe('0');
  });

  it('should format a positive number', () => {
    const result = formatNumber(1234);
    expect(result).toBeTruthy();
    // he-IL uses commas or dots for grouping
    expect(typeof result).toBe('string');
  });
});

describe('truncateText', () => {
  it('should return empty string for null', () => {
    expect(truncateText(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(truncateText(undefined)).toBe('');
  });

  it('should return short text unchanged', () => {
    expect(truncateText('hello', 50)).toBe('hello');
  });

  it('should truncate text exceeding max length', () => {
    const long = 'a'.repeat(60);
    const result = truncateText(long, 50);
    expect(result).toHaveLength(53); // 50 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should use default maxLength of 50', () => {
    const long = 'b'.repeat(55);
    const result = truncateText(long);
    expect(result).toHaveLength(53);
  });

  it('should not truncate text at exactly maxLength', () => {
    const exact = 'c'.repeat(50);
    expect(truncateText(exact, 50)).toBe(exact);
  });
});

describe('formatCellValue', () => {
  it('should return empty string for null', () => {
    expect(formatCellValue(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatCellValue(undefined)).toBe('');
  });

  it('should convert number to string', () => {
    expect(formatCellValue(42)).toBe('42');
  });

  it('should return string as-is', () => {
    expect(formatCellValue('hello')).toBe('hello');
  });

  it('should join array with comma', () => {
    expect(formatCellValue(['a', 'b', 'c'])).toBe('a, b, c');
  });

  it('should handle empty array', () => {
    expect(formatCellValue([])).toBe('');
  });

  it('should format object as key:value pairs', () => {
    const result = formatCellValue({ projA: 5, projB: 10 });
    expect(result).toContain('projA: 5');
    expect(result).toContain('projB: 10');
  });

  it('should handle empty object', () => {
    expect(formatCellValue({})).toBe('');
  });

  it('should handle boolean values', () => {
    expect(formatCellValue(true)).toBe('true');
    expect(formatCellValue(false)).toBe('false');
  });

  it('should handle zero', () => {
    expect(formatCellValue(0)).toBe('0');
  });
});
