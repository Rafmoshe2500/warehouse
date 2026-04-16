import { renderHook, act } from '@testing-library/react';
import { useCollectionTableData } from '../useCollectionTableData';

vi.mock('../../constants/tableConfig', () => ({
  COLLECTION_TABLE_COLUMNS: [
    { key: 'catalog_number', label: 'מק״ט' },
    { key: 'description', label: 'תיאור' },
    { key: 'manufacturer', label: 'יצרן' },
  ],
}));

const sampleItems = [
  { item_id: '1', catalog_number: 'ABC-100', description: 'נגד 100 אוהם', manufacturer: 'TDK' },
  { item_id: '2', catalog_number: 'XYZ-200', description: 'קבל 10uF', manufacturer: 'Murata' },
  { item_id: '3', catalog_number: 'ABC-300', description: 'טרנזיסטור NPN', manufacturer: 'TDK' },
];

describe('useCollectionTableData', () => {
  it('returns all items unchanged when no filters or search', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));
    expect(result.current.processedItems).toHaveLength(3);
  });

  it('initializes sort, filters, and search as empty', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));
    expect(result.current.sortConfig).toEqual({ key: null, direction: 'asc' });
    expect(result.current.filters).toEqual({});
    expect(result.current.searchQuery).toBe('');
    expect(result.current.showFilters).toBe(false);
  });

  it('filters items by global search query', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.setSearchQuery('קבל');
    });

    expect(result.current.processedItems).toHaveLength(1);
    expect(result.current.processedItems[0].item_id).toBe('2');
  });

  it('global search is case-insensitive', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.setSearchQuery('abc');
    });

    expect(result.current.processedItems).toHaveLength(2);
  });

  it('returns empty when search matches nothing', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.setSearchQuery('ZZZNOTFOUND');
    });

    expect(result.current.processedItems).toHaveLength(0);
  });

  it('filters by per-column filter', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.handleFilterChange('manufacturer', 'TDK');
    });

    expect(result.current.processedItems).toHaveLength(2);
    expect(result.current.processedItems.every(i => i.manufacturer === 'TDK')).toBe(true);
  });

  it('combining two column filters narrows results', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.handleFilterChange('manufacturer', 'TDK');
      result.current.handleFilterChange('catalog_number', 'ABC-100');
    });

    expect(result.current.processedItems).toHaveLength(1);
    expect(result.current.processedItems[0].item_id).toBe('1');
  });

  it('sorts ascending by catalog_number on first handleSort call', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.handleSort('catalog_number');
    });

    const sorted = result.current.processedItems.map(i => i.catalog_number);
    expect(sorted).toEqual(['ABC-100', 'ABC-300', 'XYZ-200']);
  });

  it('toggles sort to descending on second handleSort call for same key', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.handleSort('catalog_number');
    });
    act(() => {
      result.current.handleSort('catalog_number');
    });

    expect(result.current.sortConfig.direction).toBe('desc');
    const sorted = result.current.processedItems.map(i => i.catalog_number);
    expect(sorted).toEqual(['XYZ-200', 'ABC-300', 'ABC-100']);
  });

  it('resets sort direction to asc when switching to a different key', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.handleSort('catalog_number');
    });
    act(() => {
      result.current.handleSort('catalog_number');
    });
    act(() => {
      result.current.handleSort('manufacturer');
    });

    expect(result.current.sortConfig.key).toBe('manufacturer');
    expect(result.current.sortConfig.direction).toBe('asc');
  });

  it('toggles showFilters via setShowFilters', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.setShowFilters(true);
    });

    expect(result.current.showFilters).toBe(true);
  });

  it('handles empty items list without error', () => {
    const { result } = renderHook(() => useCollectionTableData([]));
    expect(result.current.processedItems).toHaveLength(0);
  });

  it('clears results when search query is whitespace only', () => {
    const { result } = renderHook(() => useCollectionTableData(sampleItems));

    act(() => {
      result.current.setSearchQuery('   ');
    });

    // Whitespace-only should not filter
    expect(result.current.processedItems).toHaveLength(3);
  });
});
