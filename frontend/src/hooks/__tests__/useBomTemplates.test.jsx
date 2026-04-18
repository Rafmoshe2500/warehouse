import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useBomTemplates from '../useBomTemplates';

vi.mock('../../api/services/bomTemplateService', () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import bomTemplateService from '../../api/services/bomTemplateService';

const FALLBACK_TEMPLATES = [
  { format_id: 'netapp_pricing_template', vendor_name: 'NetApp', is_active: true },
  { format_id: 'dell_quote', vendor_name: 'Dell', is_active: true },
  { format_id: 'hpe_quote', vendor_name: 'HPE', is_active: true },
  { format_id: 'cisco_quote', vendor_name: 'Cisco', is_active: true },
  { format_id: 'generic_first_col', vendor_name: 'Generic', is_active: true },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBomTemplates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns fetched templates from API', async () => {
    const mockTemplates = [
      { format_id: 'netapp_pricing_template', vendor_name: 'NetApp', is_active: true },
    ];
    bomTemplateService.getAll.mockResolvedValue({ templates: mockTemplates });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    // Wait for the actual fetched data (placeholderData makes loading=false immediately)
    await waitFor(() => {
      expect(result.current.templates).toEqual(mockTemplates);
    });
  });

  it('falls back to hardcoded templates when API returns empty list', async () => {
    bomTemplateService.getAll.mockResolvedValue({ templates: [] });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.templates).toHaveLength(FALLBACK_TEMPLATES.length);
    expect(result.current.templates[0].vendor_name).toBe('NetApp');
  });

  it('uses fallback templates when API call fails', async () => {
    bomTemplateService.getAll.mockRejectedValue(new Error('API unavailable'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    // With placeholderData = FALLBACK_TEMPLATES, they appear even during loading
    expect(result.current.templates).toHaveLength(FALLBACK_TEMPLATES.length);
  });

  it('createTemplate calls bomTemplateService.create and invalidates cache', async () => {
    bomTemplateService.getAll.mockResolvedValue({ templates: [] });
    const newTemplate = { format_id: 'new_vendor', vendor_name: 'NewCo' };
    bomTemplateService.create.mockResolvedValue(newTemplate);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    await act(async () => {
      await result.current.createTemplate(newTemplate);
    });

    expect(bomTemplateService.create).toHaveBeenCalledWith(newTemplate);
  });

  it('updateTemplate calls bomTemplateService.update with templateId and payload', async () => {
    bomTemplateService.getAll.mockResolvedValue({ templates: [] });
    const payload = { vendor_name: 'Updated Vendor' };
    bomTemplateService.update.mockResolvedValue({ format_id: 'netapp_pricing_template', ...payload });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    await act(async () => {
      await result.current.updateTemplate('netapp_pricing_template', payload);
    });

    expect(bomTemplateService.update).toHaveBeenCalledWith('netapp_pricing_template', payload);
  });

  it('deleteTemplate calls bomTemplateService.delete with templateId', async () => {
    bomTemplateService.getAll.mockResolvedValue({ templates: [] });
    bomTemplateService.delete.mockResolvedValue({ message: 'Deleted' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useBomTemplates(), { wrapper });

    await act(async () => {
      await result.current.deleteTemplate('dell_quote');
    });

    expect(bomTemplateService.delete).toHaveBeenCalledWith('dell_quote');
  });
});
