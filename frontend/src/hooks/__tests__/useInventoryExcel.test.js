import { renderHook, act } from '@testing-library/react';
import { useInventoryExcel } from '../useInventoryExcel';

// Mock the excelService module
vi.mock('../../api/services/excelService', () => ({
  default: {
    importExcel: vi.fn(),
    importProjectExcel: vi.fn(),
  },
}));

import excelService from '../../api/services/excelService';

describe('useInventoryExcel', () => {
  let mockLoadItems;
  let mockAddToast;

  beforeEach(() => {
    mockLoadItems = vi.fn().mockResolvedValue(undefined);
    mockAddToast = vi.fn();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );

    expect(result.current.uploadingExcel).toBe(false);
    expect(result.current.importType).toBe('standard');
  });

  it('should allow changing import type', () => {
    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );

    act(() => {
      result.current.setImportType('project');
    });

    expect(result.current.importType).toBe('project');
  });

  it('should handle standard import success', async () => {
    excelService.importExcel.mockResolvedValue({
      added: 5,
      updated: 2,
      skipped: 0,
      errors: [],
    });

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );
    const file = new File(['data'], 'test.xlsx');

    await act(async () => {
      await result.current.handleImportExcel(file);
    });

    expect(excelService.importExcel).toHaveBeenCalledWith(file);
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('נוצרו: 5'),
      'success'
    );
    expect(mockLoadItems).toHaveBeenCalled();
    expect(result.current.uploadingExcel).toBe(false);
    expect(result.current.importType).toBe('standard');
  });

  it('should show warning when import has errors', async () => {
    excelService.importExcel.mockResolvedValue({
      added: 3,
      updated: 1,
      skipped: 1,
      errors: [{ row: 5, error: 'bad data' }],
    });

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );
    const file = new File(['data'], 'test.xlsx');

    await act(async () => {
      await result.current.handleImportExcel(file);
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      expect.stringContaining('שגיאות'),
      'warning'
    );
  });

  it('should handle project import success', async () => {
    excelService.importProjectExcel.mockResolvedValue({
      message: 'Project imported',
    });

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );
    const file = new File(['data'], 'project.xlsx');

    act(() => {
      result.current.setImportType('project');
    });

    await act(async () => {
      await result.current.handleImportExcel(file);
    });

    expect(excelService.importProjectExcel).toHaveBeenCalledWith(file);
    expect(mockAddToast).toHaveBeenCalledWith('Project imported', 'success');
  });

  it('should show error toast on import failure', async () => {
    excelService.importExcel.mockRejectedValue({
      response: { data: { detail: 'Invalid format' } },
    });

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );
    const file = new File(['data'], 'bad.xlsx');

    await act(async () => {
      await result.current.handleImportExcel(file);
    });

    expect(mockAddToast).toHaveBeenCalledWith('Invalid format', 'error');
    expect(result.current.uploadingExcel).toBe(false);
  });

  it('should show generic error when response detail is missing', async () => {
    excelService.importExcel.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );
    const file = new File(['data'], 'bad.xlsx');

    await act(async () => {
      await result.current.handleImportExcel(file);
    });

    expect(mockAddToast).toHaveBeenCalledWith('שגיאה ביבוא מאקסל', 'error');
  });

  it('should do nothing when file is null', async () => {
    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );

    await act(async () => {
      await result.current.handleImportExcel(null);
    });

    expect(excelService.importExcel).not.toHaveBeenCalled();
    expect(result.current.uploadingExcel).toBe(false);
  });

  it('should reset importType to standard after import', async () => {
    excelService.importProjectExcel.mockResolvedValue({
      message: 'Done',
    });

    const { result } = renderHook(() =>
      useInventoryExcel(mockLoadItems, mockAddToast)
    );

    act(() => {
      result.current.setImportType('project');
    });

    await act(async () => {
      await result.current.handleImportExcel(new File(['data'], 'f.xlsx'));
    });

    expect(result.current.importType).toBe('standard');
  });
});
