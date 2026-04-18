import {
  createErrorService,
  ERROR_TYPES,
  ERROR_MESSAGES,
} from '../errorService';

describe('errorService', () => {
  let errorService;

  beforeEach(() => {
    errorService = createErrorService();
  });

  describe('parseError', () => {
    it('classifies 400 as VALIDATION_ERROR', () => {
      const error = { response: { status: 400, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.VALIDATION);
      expect(result.statusCode).toBe(400);
    });

    it('classifies 401 as AUTHORIZATION_ERROR', () => {
      const error = { response: { status: 401, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.AUTHORIZATION);
    });

    it('classifies 403 as AUTHORIZATION_ERROR', () => {
      const error = { response: { status: 403, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.AUTHORIZATION);
    });

    it('classifies 404 as NOT_FOUND_ERROR', () => {
      const error = { response: { status: 404, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.NOT_FOUND);
    });

    it('classifies 500 as SERVER_ERROR', () => {
      const error = { response: { status: 500, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.SERVER);
    });

    it('classifies 503 as SERVER_ERROR', () => {
      const error = { response: { status: 503, data: {} } };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.SERVER);
    });

    it('classifies ECONNABORTED as TIMEOUT_ERROR', () => {
      const error = { code: 'ECONNABORTED', message: 'timeout' };
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.TIMEOUT);
    });

    it('extracts message from response.data.message', () => {
      const error = { response: { status: 400, data: { message: 'Field required' } } };
      const result = errorService.parseError(error);

      expect(result.message).toBe('Field required');
    });

    it('extracts details from response.data.details', () => {
      const details = [{ loc: ['field'], msg: 'required' }];
      const error = { response: { status: 422, data: { details } } };
      const result = errorService.parseError(error);

      expect(result.details).toEqual(details);
    });

    it('includes originalError in result', () => {
      const error = new Error('oops');
      const result = errorService.parseError(error);

      expect(result.originalError).toBe(error);
    });

    it('classifies native Error without response as UNKNOWN_ERROR', () => {
      const error = new Error('Something went wrong');
      const result = errorService.parseError(error);

      expect(result.type).toBe(ERROR_TYPES.UNKNOWN);
      expect(result.message).toBe('Something went wrong');
      expect(result.statusCode).toBeNull();
    });
  });

  describe('getUserMessage', () => {
    it('returns custom message when provided', () => {
      const msg = errorService.getUserMessage(ERROR_TYPES.SERVER, 'Custom error');
      expect(msg).toBe('Custom error');
    });

    it('returns mapped message for known error type', () => {
      const msg = errorService.getUserMessage(ERROR_TYPES.AUTHORIZATION);
      expect(msg).toBe(ERROR_MESSAGES.AUTHORIZATION_ERROR);
    });

    it('returns UNKNOWN message for unrecognized type', () => {
      const msg = errorService.getUserMessage('SOME_UNKNOWN_TYPE');
      expect(msg).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('returns NOT_FOUND message for NOT_FOUND_ERROR type', () => {
      const msg = errorService.getUserMessage(ERROR_TYPES.NOT_FOUND);
      expect(msg).toBe(ERROR_MESSAGES.NOT_FOUND_ERROR);
    });
  });

  describe('ERROR_TYPES constants', () => {
    it('has all expected error type keys', () => {
      expect(ERROR_TYPES.NETWORK).toBeDefined();
      expect(ERROR_TYPES.VALIDATION).toBeDefined();
      expect(ERROR_TYPES.AUTHORIZATION).toBeDefined();
      expect(ERROR_TYPES.NOT_FOUND).toBeDefined();
      expect(ERROR_TYPES.SERVER).toBeDefined();
      expect(ERROR_TYPES.TIMEOUT).toBeDefined();
      expect(ERROR_TYPES.UNKNOWN).toBeDefined();
    });
  });

  describe('ERROR_MESSAGES constants', () => {
    it('has a message for each error type', () => {
      Object.values(ERROR_TYPES).forEach((type) => {
        const key = type; // e.g. 'NETWORK_ERROR'
        expect(ERROR_MESSAGES[key]).toBeDefined();
      });
    });
  });
});
