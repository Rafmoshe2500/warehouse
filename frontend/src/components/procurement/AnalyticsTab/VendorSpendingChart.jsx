import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { FiBarChart2, FiCalendar } from 'react-icons/fi';
import bomAnalyticsService from '../../../api/services/bomAnalyticsService';
import { Spinner } from '../../common';

// Colour per vendor (deterministic)
const VENDOR_COLORS = [
  '#3b82f6', '#f59e0b', '#22c55e', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];
const getVendorColor = (vendors, vendor) => {
  const idx = vendors.indexOf(vendor);
  return VENDOR_COLORS[idx % VENDOR_COLORS.length];
};

const formatCurrency = (val) =>
  val >= 1_000_000
    ? `$${(val / 1_000_000).toFixed(1)}M`
    : val >= 1_000
    ? `$${(val / 1_000).toFixed(0)}K`
    : `$${val}`;

const RESOLUTION_LABELS = {
  daily:   'יומי',
  monthly: 'חודשי',
  yearly:  'שנתי',
};

const VendorSpendingChart = ({ dateRange, resolution }) => {
  const [data,     setData]     = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await bomAnalyticsService.getVendorSpending(
          resolution,
          dateRange?.startDate || null,
          dateRange?.endDate   || null,
        );
        if (cancelled) return;

        const rows = result.data || [];

        // Pivot: [{ bucket, VendorA: total, VendorB: total }, ...]
        const vendorSet = [...new Set(rows.map(r => r.vendor))].sort();
        const byBucket  = {};
        rows.forEach(({ bucket, vendor, total }) => {
          if (!byBucket[bucket]) byBucket[bucket] = { bucket };
          byBucket[bucket][vendor] = (byBucket[bucket][vendor] || 0) + total;
        });

        setVendors(vendorSet);
        setData(Object.values(byBucket).sort((a, b) => a.bucket.localeCompare(b.bucket)));
      } catch (e) {
        if (!cancelled) setError('שגיאה בטעינת נתוני הוצאות');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [resolution, dateRange]);

  const hasData = data.length > 0 && vendors.length > 0;

  return (
    <div className="analytics-panel vendor-spending-panel">
      <div className="panel-header">
        <FiBarChart2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
        <h3 className="panel-title">הוצאות רכש לפי יצרן</h3>
        <span className="vendor-res-badge">
          <FiCalendar size={12} />
          {RESOLUTION_LABELS[resolution] || resolution}
        </span>
      </div>

      <div className="panel-chart">
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="md" text="טוען נתונים..." />
          </div>
        ) : error ? (
          <div className="no-data">{error}</div>
        ) : !hasData ? (
          <div className="no-data">
            📊 אין נתוני הוצאות — לחץ "בנה היסטוריה" כדי לטעון נתונים
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} vertical={false} />
              <XAxis
                dataKey="bucket"
                stroke="var(--text-muted)"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke="var(--text-muted)"
                tickFormatter={formatCurrency}
                tick={{ fontSize: 11 }}
                width={60}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-color)',
                  borderColor: 'var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  direction: 'rtl',
                }}
                formatter={(val, name) => [formatCurrency(val), name]}
                labelStyle={{ fontWeight: 700, marginBottom: 4 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Legend
                verticalAlign="top"
                height={30}
                wrapperStyle={{ fontSize: '0.8rem', direction: 'rtl' }}
              />
              {vendors.map(vendor => (
                <Bar
                  key={vendor}
                  dataKey={vendor}
                  name={vendor}
                  fill={getVendorColor(vendors, vendor)}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default VendorSpendingChart;
