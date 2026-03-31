import { useState, useMemo, useCallback } from 'react';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { useToast } from '../../../hooks/useToast';

let _nextChainId = 1;

/**
 * Manages Product Chain state.
 *
 * Each chain = { id, label, slots[], mergedTrends[] }
 * Each slot  = { id, mainPart, secondaryParts[] }
 *
 * Price per slot:
 *   - With secondaries  → getAggregatedTrends(mainPart, secondaryParts)
 *   - Without secondaries → getPartTrends(mainPart)
 *
 * All slot trends are merged chronologically into one series,
 * keyed as `__chain__${id}` on the chart.
 *
 * @param {Object} dateRange  – { startDate, endDate }
 * @param {string} resolution – 'daily' | 'monthly' | 'yearly'
 */
export function useModelChain(dateRange, resolution = 'monthly') {
  const { showToast } = useToast();
  const [chains,    setChains]    = useState([]);
  const [isAdding,  setIsAdding]  = useState(false);

  // ── Add chain ────────────────────────────────────────────────────
  const addChain = useCallback(async (label, slots) => {
    if (!label.trim() || slots.length === 0) return;
    const validSlots = slots.filter(s => s.mainPart);
    if (validSlots.length === 0) {
      showToast('נא להגדיר לפחות דור אחד עם מק"ט ראשי', 'warning');
      return;
    }

    setIsAdding(true);
    try {
      // Fetch each slot separately (parallel)
      const results = await Promise.all(
        validSlots.map(async slot => {
          if (slot.secondaryParts.length > 0) {
            // Aggregation path
            const res = await bomAnalyticsService.getAggregatedTrends(
              slot.mainPart, slot.secondaryParts
            );
            return (res.trends || []).map(t => ({
              recorded_at: t.recorded_at,
              price: t.total_price,
            }));
          } else {
            // Simple part path
            const res = await bomAnalyticsService.getPartTrends(slot.mainPart, null);
            return (res.trends || []).map(t => ({
              recorded_at: t.recorded_at,
              price: t.unit_net_price,
            }));
          }
        })
      );

      // Merge all slot data points; later slots win on same date
      // Tag each point with the slot's mainPart so tooltip can show model name
      const merged = {};
      results.forEach((slotPoints, idx) => {
        const slotModel = validSlots[idx].mainPart;
        slotPoints.forEach(pt => {
          const key = new Date(pt.recorded_at).toISOString();
          merged[key] = { recorded_at: pt.recorded_at, price: pt.price, slotModel };
        });
      });

      const mergedTrends = Object.values(merged).sort(
        (a, b) => new Date(a.recorded_at) - new Date(b.recorded_at)
      );

      if (mergedTrends.length === 0) {
        showToast(`לא נמצאו נתוני מחיר עבור "${label}"`, 'warning');
        return;
      }

      const id = _nextChainId++;
      setChains(prev => [...prev, { id, label: label.trim(), slots: validSlots, mergedTrends }]);
      showToast(`שרשרת "${label.trim()}" נוספה לגרף (${mergedTrends.length} נקודות)`, 'success');
    } catch (err) {
      console.error('[useModelChain] addChain error:', err);
      showToast(`שגיאה ביצירת שרשרת "${label}"`, 'error');
    } finally {
      setIsAdding(false);
    }
  }, [showToast]);

  const removeChain = useCallback(id => {
    setChains(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Build chart rows ─────────────────────────────────────────────
  const chainChartRows = useMemo(() => {
    const byDate = {};
    const startDate = dateRange?.startDate ? new Date(dateRange.startDate) : null;
    let   endDate   = dateRange?.endDate   ? new Date(dateRange.endDate)   : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    chains.forEach(chain => {
      chain.mergedTrends.forEach(t => {
        const d = new Date(t.recorded_at);
        if (startDate && d < startDate) return;
        if (endDate   && d > endDate)   return;

        let key;
        if (resolution === 'daily') {
          key = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        } else if (resolution === 'yearly') {
          key = `${d.getFullYear()}`;
        } else {
          key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        }

        if (!byDate[key]) byDate[key] = { shortDate: key, _ts: d.getTime() };
        const existing = byDate[key][`__chain__${chain.id}`];
        if (existing == null || d.getTime() > byDate[key]._ts) {
          byDate[key][`__chain__${chain.id}`] = t.price;
          // Store the model name so the tooltip can show it instead of the chain label
          byDate[key][`__chain__${chain.id}__model`] = t.slotModel;
        }
      });
    });

    return Object.values(byDate).sort((a, b) => a._ts - b._ts);
  }, [chains, dateRange, resolution]);

  return { chains, isAdding, addChain, removeChain, chainChartRows };
}
