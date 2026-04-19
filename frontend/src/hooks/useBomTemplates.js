import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import bomTemplateService from '../api/services/bomTemplateService';
import { QUERY_KEYS } from '../lib/queryKeys';

// Hardcoded fallback templates — used when API is unavailable or DB not seeded
const FALLBACK_TEMPLATES = [
  { format_id: 'netapp_pricing_template', vendor_name: 'NetApp', description: 'NetApp Pricing Template', is_active: true },
  { format_id: 'dell_quote', vendor_name: 'Dell', description: 'Dell Quote', is_active: true },
  { format_id: 'hpe_quote', vendor_name: 'HPE', description: 'HPE Quote', is_active: true },
  { format_id: 'cisco_quote', vendor_name: 'Cisco', description: 'Cisco Quote', is_active: true },
  { format_id: 'generic_first_col', vendor_name: 'Generic', description: 'Generic (first column)', is_active: true },
];

/**
 * Hook to fetch and manage BOM templates.
 * Provides the list of active templates + CRUD actions.
 * Falls back to hardcoded vendor list if API is unavailable.
 *
 * Uses React Query so all consumers (BomScannerTab, ProcurementModal, BomPrescanModal)
 * share a single cached result — only one GET /api/bom-templates request is ever made.
 */
export default function useBomTemplates() {
  const queryClient = useQueryClient();

  const { data, isLoading: loading, error } = useQuery({
    queryKey: QUERY_KEYS.bomTemplates.all,
    queryFn: async () => {
      const result = await bomTemplateService.getAll();
      const fetched = result.templates || [];
      return fetched.length > 0 ? fetched : FALLBACK_TEMPLATES;
    },
    placeholderData: FALLBACK_TEMPLATES,
    staleTime: 10 * 60 * 1000, // Templates rarely change — keep fresh 10 min
    gcTime: 15 * 60 * 1000,
  });

  const templates = data ?? FALLBACK_TEMPLATES;

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bomTemplates.all }),
    [queryClient]
  );

  const createTemplate = useCallback(async (payload) => {
    const doc = await bomTemplateService.create(payload);
    await invalidate();
    return doc;
  }, [invalidate]);

  const updateTemplate = useCallback(async (templateId, payload) => {
    const doc = await bomTemplateService.update(templateId, payload);
    await invalidate();
    return doc;
  }, [invalidate]);

  const deleteTemplate = useCallback(async (templateId) => {
    await bomTemplateService.delete(templateId);
    await invalidate();
  }, [invalidate]);

  /** Derived helper: list of {value, label} for dropdowns */
  const vendorOptions = templates.map((t) => ({
    value: t.format_id,
    label: t.vendor_name,
  }));

  return {
    templates,
    vendorOptions,
    loading,
    error: error?.message ?? error ?? null,
    refetch: invalidate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
