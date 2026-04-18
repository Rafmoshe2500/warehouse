import { createCatalogService } from '../catalogService';

describe('catalogService (factory)', () => {
  let mockClient;
  let catalogService;

  beforeEach(() => {
    mockClient = { get: vi.fn() };
    catalogService = createCatalogService(mockClient);
    vi.clearAllMocks();
  });

  it('calls GET /catalog with no params when params is empty', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [], total: 0 } });

    const result = await catalogService.getCatalog();

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/catalog')
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('appends search param when provided', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ search: 'resistor' });

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('search=resistor')
    );
  });

  it('appends pagination params', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ page: 2, limit: 25 });

    const url = mockClient.get.mock.calls[0][0];
    expect(url).toContain('page=2');
    expect(url).toContain('limit=25');
  });

  it('appends sorting params', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ sort_by: 'manufacturer', sort_order: 'desc' });

    const url = mockClient.get.mock.calls[0][0];
    expect(url).toContain('sort_by=manufacturer');
    expect(url).toContain('sort_order=desc');
  });

  it('ignores undefined and empty string params', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ search: '', manufacturer: undefined, page: 1 });

    const url = mockClient.get.mock.calls[0][0];
    expect(url).not.toContain('search=');
    expect(url).not.toContain('manufacturer=');
    expect(url).toContain('page=1');
  });

  it('appends catalog_number filter', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ catalog_number: 'CAT-001' });

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('catalog_number=CAT-001')
    );
  });

  it('appends manufacturer filter', async () => {
    mockClient.get.mockResolvedValue({ data: { items: [] } });

    await catalogService.getCatalog({ manufacturer: 'NetApp' });

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('manufacturer=NetApp')
    );
  });

  it('returns raw response.data', async () => {
    const mockData = { items: [{ id: '1', catalog_number: 'X-100' }], total: 1 };
    mockClient.get.mockResolvedValue({ data: mockData });

    const result = await catalogService.getCatalog({ search: 'X-100' });

    expect(result).toEqual(mockData);
  });
});
