import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FiServer, FiCpu, FiDatabase, FiPlus, FiX, FiTrendingUp, FiCalendar, FiSettings } from 'react-icons/fi';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { Spinner } from '../../common';
import { useToast } from '../../../hooks/useToast';
import DeleteModal from '../../common/DeleteModal/DeleteModal';
import { usePartComparison } from './usePartComparison';
import { useAggregation } from './useAggregation';
import { useModelChain } from './useModelChain';
import AdvancedComparisonModal from './AdvancedComparisonModal';
import VendorSpendingChart from './VendorSpendingChart';
import './ProcurementAnalyticsTab.css';

// Colour palettes
const LINE_COLORS   = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const AGG_COLORS   = ['#a78bfa', '#34d399', '#fb923c', '#60a5fa', '#f472b6', '#4ade80', '#38bdf8', '#facc15'];
const CHAIN_COLORS = ['#e879f9', '#22d3ee', '#a3e635', '#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#c084fc'];

// Custom tooltip — shows actual model name per chain data point
const ChainTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-color)', border: '1px solid var(--border-color)',
      borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-primary)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map(entry => {
        const chainId = entry.dataKey?.match(/^__chain__(\d+)$/)?.[1];
        const modelName = chainId ? entry.payload[`__chain__${chainId}__model`] : null;
        const displayName = modelName ? `\u2197 ${modelName}` : entry.name;
        return (
          <div key={entry.dataKey} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.stroke, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', minWidth: 110 }}>{displayName}</span>
            <span style={{ fontWeight: 600 }}>{formatPrice(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
};

const formatPrice = (val) =>
  val != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
    : '-';

const ComparisonPanel = ({ title, Icon, itemType, accentColor, onSeed, seeding, dateRange, resolution }) => {
  const [searchPart, setSearchPart]           = useState('');
  const [suggestions, setSuggestions]         = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSugg, setIsLoadingSugg]     = useState(false);
  const [modalOpen, setModalOpen]             = useState(false);
  const wrapperRef = useRef(null);

  const { activeParts, chartData, isLoading, addPart, removePart } = usePartComparison(itemType, dateRange, resolution);
  const { groups, isAdding: isAddingGroup, addGroup, removeGroup, aggregatedChartRows } = useAggregation(dateRange, resolution);
  const { chains, isAdding: isAddingChain, addChain, removeChain, chainChartRows } = useModelChain(dateRange, resolution);

  const isModalAdding = isAddingGroup || isAddingChain;

  // Merge individual + aggregation + chain chart data by date key
  const mergedChartData = React.useMemo(() => {
    const byDate = {};
    const merge = rows => {
      rows.forEach(row => {
        const { shortDate, _ts, ...rest } = row;
        if (!byDate[shortDate]) byDate[shortDate] = { shortDate, _ts };
        Object.assign(byDate[shortDate], rest);
      });
    };
    merge(chartData);
    merge(aggregatedChartRows);
    merge(chainChartRows);
    return Object.values(byDate).sort((a, b) => a._ts - b._ts);
  }, [chartData, aggregatedChartRows, chainChartRows]);

  // Debounced autocomplete with in-memory cache (avoids redundant requests for already-typed queries)
  const autocompleteCache = useRef(new Map());
  useEffect(() => {
    if (searchPart.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    const cacheKey = `${searchPart.trim().toLowerCase()}:${itemType}`;
    if (autocompleteCache.current.has(cacheKey)) {
      setSuggestions(autocompleteCache.current.get(cacheKey));
      setShowSuggestions(true);
      return;
    }
    const t = setTimeout(async () => {
      setIsLoadingSugg(true);
      try {
        const res = await bomAnalyticsService.searchParts(searchPart, itemType);
        const parts = res.parts || [];
        autocompleteCache.current.set(cacheKey, parts);
        setSuggestions(parts);
        setShowSuggestions(true);
      } catch { /* ignore */ } finally { setIsLoadingSugg(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [searchPart, itemType]);

  useEffect(() => {
    const h = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // selectedMeta: { [partNumber]: { product_name, vendor } }
  const [partMeta, setPartMeta] = useState({});

  const handleSelectSuggestion = (suggestion) => {
    // suggestion is either a string (old) or {part_number, product_name, vendor}
    const pn = typeof suggestion === 'string' ? suggestion : suggestion.part_number;
    if (typeof suggestion === 'object' && suggestion.product_name) {
      setPartMeta(prev => ({ ...prev, [pn]: { product_name: suggestion.product_name, vendor: suggestion.vendor } }));
    }
    addPart(pn);
    setSearchPart(''); setShowSuggestions(false);
  };

  const handleSubmit = (e, explicit = null) => {
    if (e) e.preventDefault();
    const raw = explicit || searchPart;
    if (!raw.trim()) return;
    // explicit may be a full suggestion object or a plain string
    if (typeof raw === 'object') { handleSelectSuggestion(raw); return; }
    addPart(raw);
    setSearchPart(''); setShowSuggestions(false);
  };

  const hasLines = activeParts.length > 0 || groups.length > 0 || chains.length > 0;
  const hasData  = mergedChartData.length > 0;

  return (
    <div className="analytics-panel" style={{ '--accent': accentColor }}>

      {/* Header */}
      <div className="panel-header">
        <Icon size={18} style={{ color: accentColor, flexShrink: 0 }} />
        <h3 className="panel-title">{title}</h3>
        <button className="seed-btn-sm" onClick={onSeed} disabled={seeding}>
          {seeding ? <Spinner size="sm" /> : <FiDatabase size={14} />}
          <span>בנה היסטוריה</span>
        </button>
      </div>

      {/* Search row — includes Aggregation button on the left */}
      <div className="search-wrapper" ref={wrapperRef} style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <form className="part-search-form" onSubmit={handleSubmit} style={{ marginBottom: 0 }}>
          <input
            type="text"
            placeholder={itemType === 'main' ? 'חפש מק"ט מערכת (לדוגמא: AFF-A90)' : 'חפש מזהה רכיב (לדוגמא: X-1234)'}
            value={searchPart}
            onChange={e => { setSearchPart(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            className="part-search-input"
          />
          <button type="submit" className="part-search-btn" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : <FiPlus size={14} />} הוסף
          </button>
          {/* Advanced Comparison trigger — inline with search */}
          <button
            type="button"
            className={`agg-open-btn${(groups.length > 0 || chains.length > 0) ? ' has-groups' : ''}`}
            onClick={() => setModalOpen(true)}
          >
            <FiSettings size={14} />
            השוואה מתקדמת
            {(groups.length + chains.length) > 0 && (
              <span className="agg-btn-badge">{groups.length + chains.length}</span>
            )}
          </button>
        </form>

        {/* Autocomplete */}
        {showSuggestions && searchPart.length >= 2 && (
          <div className="autocomplete-dropdown">
            {isLoadingSugg ? (
              <div className="autocomplete-item text-muted"><Spinner size="sm" /> מחפש...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map(s => {
                const pn   = typeof s === 'string' ? s : s.part_number;
                const name = typeof s === 'string' ? '' : (s.product_name || '');
                const vendor = typeof s === 'string' ? '' : (s.vendor || '');
                return (
                  <div key={pn} className="autocomplete-item" onClick={() => handleSelectSuggestion(s)}>
                    <span style={{ fontWeight: 600 }}>{name || pn}</span>
                    {name && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 6 }}>{pn}</span>}
                    {vendor && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 6 }}>{vendor}</span>}
                  </div>
                );
              })
            ) : (
              <div className="autocomplete-item text-muted">לא נמצאו תוצאות</div>
            )}
          </div>
        )}
      </div>

      {/* Individual part tags */}
      {activeParts.length > 0 && (
        <div className="active-parts-list">
          {activeParts.map((pn, idx) => {
            const meta = partMeta[pn];
            const displayName = meta?.product_name || pn;
            return (
              <div key={pn} className="part-tag" style={{ borderRight: `4px solid ${LINE_COLORS[idx % LINE_COLORS.length]}` }}>
                <span className="part-name" title={pn}>{displayName}</span>
                <button type="button" className="remove-part-btn" onClick={() => removePart(pn)}><FiX size={12} /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* Aggregation group tags */}
      {groups.length > 0 && (
        <div className="agg-group-tags">
          {groups.map((g, idx) => (
            <div
              key={g.id}
              className="agg-group-tag"
              style={{ borderRight: `4px solid ${AGG_COLORS[idx % AGG_COLORS.length]}` }}
            >
              <span className="agg-sigma">Σ</span>
              <span className="agg-group-label">{g.label}</span>
              <span className="agg-group-parts">{g.secondaryParts.length + 1} רכיבים</span>
              <button type="button" className="remove-part-btn" onClick={() => removeGroup(g.id)}><FiX size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Chain tags */}
      {chains.length > 0 && (
        <div className="agg-group-tags">
          {chains.map((c, idx) => (
            <div
              key={c.id}
              className="agg-group-tag chain-tag"
              style={{ borderRight: `4px solid ${CHAIN_COLORS[idx % CHAIN_COLORS.length]}` }}
            >
              <span className="agg-sigma">↗</span>
              <span className="agg-group-label">{c.label}</span>
              <span className="agg-group-parts">{c.slots.length} דורות</span>
              <button type="button" className="remove-part-btn" onClick={() => removeChain(c.id)}><FiX size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="panel-chart">
        {!hasLines ? (
          <div className="no-data">
            {itemType === 'main' ? '🖥️ חפש מק"ט מערכת כגון AFF-A90' : '🔩 חפש מק"ט רכיב ספציפי'}
          </div>
        ) : !hasData ? (
          <div className="no-data">לא נמצאו נתוני מחיר — לחץ על "בנה היסטוריה" תחילה</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="shortDate" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="var(--text-muted)"
                tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                tick={{ fontSize: 11 }}
                domain={['auto', 'auto']}
                width={55}
              />
              <Tooltip content={<ChainTooltip />} />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: '0.8rem' }} />

              {/* Individual part lines — solid */}
              {activeParts.map((pn, idx) => (
                <Line
                  key={pn}
                  type="monotone"
                  dataKey={pn}
                  name={pn}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}

              {/* Aggregation group lines — dashed */}
              {groups.map((g, idx) => (
                <Line
                  key={`agg-${g.id}`}
                  type="monotone"
                  dataKey={`__agg__${g.id}`}
                  name={`Σ ${g.label}`}
                  stroke={AGG_COLORS[idx % AGG_COLORS.length]}
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: AGG_COLORS[idx % AGG_COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}

              {/* Chain lines — dotted */}
              {chains.map((c, idx) => (
                <Line
                  key={`chain-${c.id}`}
                  type="monotone"
                  dataKey={`__chain__${c.id}`}
                  name={`↗ ${c.label}`}
                  stroke={CHAIN_COLORS[idx % CHAIN_COLORS.length]}
                  strokeWidth={2.5}
                  strokeDasharray="2 4"
                  dot={{ r: 4, fill: CHAIN_COLORS[idx % CHAIN_COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Advanced Comparison Modal */}
      <AdvancedComparisonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddChain={addChain}
        isAdding={isModalAdding}
      />
    </div>
  );
};

// ── Main Tab ─────────────────────────────────────────────────────────────────
const ProcurementAnalyticsTab = () => {
  const { showToast } = useToast();
  const [seeding, setSeeding]     = useState(false);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [resolution, setResolution] = useState('monthly');
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  const handleSeedData = async () => {
    setSeedConfirmOpen(false);
    try {
      setSeeding(true);
      const { orders_processed: ords, price_points_extracted: pts } =
        await bomAnalyticsService.seedHistoricalData();
      showToast(`בוצע! חולצו ${pts} נקודות מחיר מ-${ords} הזמנות`, 'success');
    } catch (err) {
      console.error('[ProcurementAnalyticsTab] seed error:', err);
      showToast('שגיאה ביצירת היסטוריית נתונים', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="analytics-tab" dir="rtl">
      <div className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="analytics-page-title" style={{ margin: 0 }}>
          <FiTrendingUp size={20} /> Price Intel – השוואת מחירים לאורך זמן
        </div>

        <div className="splunk-date-filter">
          
          <div className="splunk-date-input-wrapper">
            <label>רזולוציה:</label>
            <select
              className="splunk-resolution-select"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="daily">יומי</option>
              <option value="monthly">חודשי</option>
              <option value="yearly">שנתי</option>
            </select>
          </div>

          <div
            className={`splunk-date-filter-label ${(dateRange.startDate || dateRange.endDate) ? 'clickable active' : 'clickable'}`}
            onClick={() => {
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              setDateRange({
                startDate: start.toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
              });
            }}
            title="חזור לזמן נוכחי (נקה סינון)"
          >
            <FiCalendar style={{ fontSize: '1.1rem' }} />
            <span>שנה אחרונה</span>
          </div>
          <div className="splunk-date-input-wrapper">
            <label>מ:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={e => {
                const newStart = e.target.value;
                setDateRange(prev => {
                  let newEnd = prev.endDate;
                  if (newEnd && new Date(newEnd) < new Date(newStart)) newEnd = '';
                  return { startDate: newStart, endDate: newEnd };
                });
              }}
            />
          </div>
          <div className="splunk-date-input-wrapper">
            <label>עד:</label>
            <input
              type="date"
              value={dateRange.endDate}
              min={dateRange.startDate}
              onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="analytics-dual-grid">
        <ComparisonPanel
          title="מערכות ראשיות (Main)"
          Icon={FiServer}
          itemType="main"
          accentColor="#3b82f6"
          onSeed={() => setSeedConfirmOpen(true)}
          seeding={seeding}
          dateRange={dateRange}
          resolution={resolution}
        />
        <ComparisonPanel
          title="רכיבים משניים (Components)"
          Icon={FiCpu}
          itemType="component"
          accentColor="#f59e0b"
          onSeed={() => setSeedConfirmOpen(true)}
          seeding={seeding}
          dateRange={dateRange}
          resolution={resolution}
        />
      </div>

      <VendorSpendingChart dateRange={dateRange} resolution={resolution} />

      <DeleteModal
        isOpen={seedConfirmOpen}
        onClose={() => setSeedConfirmOpen(false)}
        onConfirm={handleSeedData}
        title="בניית היסטוריה"
        message="הפעולה תסרוק את כל היסטוריית ההזמנות. להמשיך?"
        type="confirmation"
        confirmText="המשך"
      />
    </div>
  );
};

export default ProcurementAnalyticsTab;
