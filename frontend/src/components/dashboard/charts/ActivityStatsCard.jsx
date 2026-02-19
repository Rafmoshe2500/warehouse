import React, { useState } from 'react';
import { FiActivity } from 'react-icons/fi';
import Spinner from '../../common/Spinner/Spinner';
import { useAnalytics } from '../../../hooks/useAnalytics';
import './ActivityStatsCard.css';

const ActivityStatsCard = () => {
    const [activityDays, setActivityDays] = useState(7);
    const { useActivityStats } = useAnalytics();
    const { data: activityStats, isLoading } = useActivityStats(activityDays);

    if (isLoading) {
        return (
            <div className="activity-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Spinner size="medium" />
                </div>
            </div>
        );
    }

    return (
        <div className="activity-card">
            <div className="activity-header">
                <select 
                    value={activityDays} 
                    onChange={(e) => setActivityDays(Number(e.target.value))}
                    className="modern-select"
                >
                    <option value={7}>שבוע אחרון</option>
                    <option value={14}>שבועיים</option>
                    <option value={30}>חודש אחרון</option>
                    <option value={90}>3 חודשים</option>
                </select>
            </div>
            
            <div className="activity-stats-display">
                <div className="activity-item">
                    <div className="activity-icon green">
                        <FiActivity />
                    </div>
                    <div className="activity-details">
                        <span className="activity-count">{activityStats?.created || 0}</span>
                        <span className="activity-label">פריטים נוצרו</span>
                    </div>
                </div>

                <div className="activity-item">
                    <div className="activity-icon amber">
                        <FiActivity />
                    </div>
                    <div className="activity-details">
                        <span className="activity-count">{activityStats?.updated || 0}</span>
                        <span className="activity-label">פריטים עודכנו</span>
                    </div>
                </div>

                <div className="activity-item">
                    <div className="activity-icon red">
                        <FiActivity />
                    </div>
                    <div className="activity-details">
                        <span className="activity-count">{activityStats?.deleted || 0}</span>
                        <span className="activity-label">פריטים נמחקו</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityStatsCard;
