import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateDeletePassword,
  validateDeleteConfirmation,
} from '../validators';

describe('validateRequired', () => {
  it('should return truthy for non-empty string', () => {
    expect(validateRequired('hello')).toBeTruthy();
  });

  it('should return falsy for empty string', () => {
    expect(validateRequired('')).toBeFalsy();
  });

  it('should return falsy for whitespace-only string', () => {
    expect(validateRequired('   ')).toBeFalsy();
  });

  it('should return falsy for null', () => {
    expect(validateRequired(null)).toBeFalsy();
  });

  it('should return falsy for undefined', () => {
    expect(validateRequired(undefined)).toBeFalsy();
  });
});

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('should reject email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('should accept email with dots in domain', () => {
    expect(validateEmail('user@sub.example.com')).toBe(true);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('should accept password with 3+ characters', () => {
    expect(validatePassword('abc')).toBeTruthy();
  });

  it('should accept long passwords', () => {
    expect(validatePassword('a'.repeat(100))).toBeTruthy();
  });

  it('should reject password with 2 characters', () => {
    expect(validatePassword('ab')).toBeFalsy();
  });

  it('should reject empty string', () => {
    expect(validatePassword('')).toBeFalsy();
  });

  it('should reject null', () => {
    expect(validatePassword(null)).toBeFalsy();
  });
});

describe('validateDeletePassword', () => {
  it('should accept non-empty password', () => {
    expect(validateDeletePassword('x')).toBeTruthy();
  });

  it('should reject empty string', () => {
    expect(validateDeletePassword('')).toBeFalsy();
  });

  it('should reject whitespace-only string', () => {
    expect(validateDeletePassword('   ')).toBeFalsy();
  });

  it('should reject null', () => {
    expect(validateDeletePassword(null)).toBeFalsy();
  });
});

describe('validateDeleteConfirmation', () => {
  it('should accept "delete"', () => {
    expect(validateDeleteConfirmation('delete')).toBe(true);
  });

  it('should accept "DELETE" (case insensitive)', () => {
    expect(validateDeleteConfirmation('DELETE')).toBe(true);
  });

  it('should accept "Delete" (mixed case)', () => {
    expect(validateDeleteConfirmation('Delete')).toBe(true);
  });

  it('should reject other text', () => {
    expect(validateDeleteConfirmation('remove')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateDeleteConfirmation('')).toBeFalsy();
  });

  it('should reject null', () => {
    expect(validateDeleteConfirmation(null)).toBeFalsy();
  });
});
