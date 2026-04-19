import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiTrendingUp, FiClock, FiPackage, FiStar } from 'react-icons/fi';
import procurementService from '../../../api/services/procurementService';
import { QUERY_KEYS } from '../../../lib/queryKeys';
import './AnalyticsStrip.css';

const AnalyticsStrip = () => {
    const { data: summary } = useQuery({
        queryKey: QUERY_KEYS.procurement.summary,
        queryFn: () => procurementService.getMonthlySummary(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    if (!summary) return null;

    const formatSpend = (amount) => {
        if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
        if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <div className="analytics-strip">
            <div className="analytics-strip__item">
                <FiTrendingUp size={14} />
                <span className="analytics-strip__label">החודש:</span>
                <span className="analytics-strip__value">{formatSpend(summary.total_spend || 0)}</span>
            </div>
            <div className="analytics-strip__divider" />
            <div className="analytics-strip__item">
                <FiClock size={14} />
                <span className="analytics-strip__label">ממוצע:</span>
                <span className="analytics-strip__value">
                    {summary.avg_lead_days != null ? `${summary.avg_lead_days} ימים` : '—'}
                </span>
            </div>
            <div className="analytics-strip__divider" />
            <div className="analytics-strip__item">
                <FiPackage size={14} />
                <span className="analytics-strip__value">{summary.order_count || 0}</span>
                <span className="analytics-strip__label">הזמנות</span>
            </div>
            <div className="analytics-strip__divider" />
            <div className="analytics-strip__item">
                <FiStar size={14} />
                <span className="analytics-strip__label">Top:</span>
                <span className="analytics-strip__value">{summary.top_vendor || '—'}</span>
            </div>
        </div>
    );
};

export default AnalyticsStrip;
