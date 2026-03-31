import { useState, useMemo } from 'react';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { useToast } from '../../../hooks/useToast';

/**
 * Custom hook that encapsulates all state and data-fetching logic for
 * the multi-part price comparison feature.
 *
 * @param {'main'|'component'} itemType - Filter for the API query.
 * @param {Object} dateRange - Filter the results: { startDate, endDate }
 * @param {string} resolution - The bucketing resolution ('daily', 'weekly', 'monthly')
 * @returns {{ activeParts, chartData, isLoading, addPart, removePart }}
 */
export function usePartComparison(itemType, dateRange, resolution = 'monthly') {
  const { showToast } = useToast();

  // { partNumber: [...trendsArray] }
  const [partDataMap,  setPartDataMap]  = useState({});
  const [loadingParts, setLoadingParts] = useState({});

  // ── Fetching ──────────────────────────────────────────────────────────────

  const fetchAndMerge = async (rawQuery) => {
    const query = rawQuery.trim().toUpperCase();
    if (!query) return;

    setLoadingParts(prev => ({ ...prev, [query]: true }));
    try {
      const res = await bomAnalyticsService.getPartTrends(query, itemType);

      if (!res.trends || res.trends.length === 0) {
        showToast(`לא נמצאה היסטוריה עבור "${query}"`, 'warning');
        return;
      }

      // Group results by the exact part_number returned by the API
      // (wildcard search may match multiple distinct part numbers)
      const grouped = {};
      res.trends.forEach(t => {
        if (!grouped[t.part_number]) grouped[t.part_number] = [];
        grouped[t.part_number].push(t);
      });

      setPartDataMap(prev => {
        const next = { ...prev };
        Object.entries(grouped).forEach(([pn, rows]) => {
          if (!next[pn]) next[pn] = rows;  // don't overwrite if already present
        });
        return next;
      });

      showToast(`נמצאו: ${Object.keys(grouped).join(', ')}`, 'success');
    } catch (err) {
      console.error('[usePartComparison] fetch error:', err);
      showToast(`שגיאה בחיפוש "${query}"`, 'error');
    } finally {
      setLoadingParts(prev => {
        const copy = { ...prev };
        delete copy[query];
        return copy;
      });
    }
  };

  const removePart = (pn) =>
    setPartDataMap(prev => { const c = { ...prev }; delete c[pn]; return c; });

  // ── Derived data ──────────────────────────────────────────────────────────

  // Merge all part trends into a flat array of { shortDate, [partNumber]: price, _ts }
  // suitable for a Recharts multi-line chart, filtered by dateRange
  const chartData = useMemo(() => {
    const byDate = {};
    const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : null;
    let endDate = dateRange?.endDate ? new Date(dateRange.endDate) : null;
    
    // Include the entire end date day
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    Object.entries(partDataMap).forEach(([partName, trends]) => {
      trends.forEach(t => {
        const d = new Date(t.recorded_at);
        
        // Date range filtering
        if (startDate && d < startDate) return;
        if (endDate && d > endDate) return;

        let key = '';
        if (resolution === 'daily') {
          key = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } else if (resolution === 'weekly') {
          const sun = new Date(d);
          sun.setDate(sun.getDate() - sun.getDay());
          key = `${sun.getDate()}/${sun.getMonth() + 1}/${sun.getFullYear()}`;
        } else {
          key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        }

        if (!byDate[key]) byDate[key] = { shortDate: key, _ts: resolution === 'weekly' ? new Date(d).setDate(d.getDate() - d.getDay()) : d.getTime() };
        byDate[key][partName] = t.unit_net_price;
      });
    });

    return Object.values(byDate).sort((a, b) => a._ts - b._ts);
  }, [partDataMap, dateRange, resolution]);

  return {
    activeParts: Object.keys(partDataMap),
    chartData,
    isLoading: Object.values(loadingParts).some(Boolean),
    addPart:   fetchAndMerge,
    removePart,
  };
}
