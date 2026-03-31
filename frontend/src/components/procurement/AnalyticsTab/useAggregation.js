import { useState, useMemo, useCallback } from 'react';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { useToast } from '../../../hooks/useToast';

let _nextId = 1;

/**
 * Manages aggregation groups.
 *
 * Each group: { id, label, mainPart, secondaryParts, trends[] }
 *
 * Price logic (backend): for every order that has mainPart + any secondaryPart:
 *   aggregated_price = (main_total + secondary_total) / main_qty
 *
 * @param {Object} dateRange – { startDate, endDate }
 * @param {string} resolution – 'daily', 'weekly', 'monthly'
 */
export function useAggregation(dateRange, resolution = 'monthly') {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  const addGroup = useCallback(async (label, mainPart, secondaryParts) => {
    if (!label.trim() || !mainPart || secondaryParts.length === 0) return;
    setIsAdding(true);
    try {
      const res = await bomAnalyticsService.getAggregatedTrends(mainPart, secondaryParts);
      if (!res.trends || res.trends.length === 0) {
        showToast(`לא נמצאו הזמנות משולבות עבור "${label}"`, 'warning');
        return;
      }
      setGroups(prev => [
        ...prev,
        { id: _nextId++, label: label.trim(), mainPart, secondaryParts, trends: res.trends },
      ]);
      showToast(`קבוצה "${label.trim()}" נוספה לגרף`, 'success');
    } catch (err) {
      console.error('[useAggregation] addGroup error:', err);
      showToast(`שגיאה ביצירת קבוצה "${label}"`, 'error');
    } finally {
      setIsAdding(false);
    }
  }, [showToast]);

  const removeGroup = useCallback((id) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  }, []);

  // Build date-keyed rows for all aggregation groups, honouring dateRange filter
  const aggregatedChartRows = useMemo(() => {
    const byDate = {};
    const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : null;
    let endDate = dateRange?.endDate ? new Date(dateRange.endDate) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    groups.forEach(group => {
      group.trends.forEach(t => {
        const d = new Date(t.recorded_at);
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
        byDate[key][`__agg__${group.id}`] = t.total_price;
      });
    });

    return Object.values(byDate).sort((a, b) => a._ts - b._ts);
  }, [groups, dateRange, resolution]);

  return { groups, isAdding, addGroup, removeGroup, aggregatedChartRows };
}
