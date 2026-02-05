import React, { useState, useEffect } from 'react';
import { FiActivity } from 'react-icons/fi';
import analyticsService from '../../../api/services/analyticsService';

const ActivityStatsCard = () => {
    const [activityStats, setActivityStats] = useState(null);
    const [activityDays, setActivityDays] = useState(7);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await analyticsService.getActivityStats(activityDays);
                setActivityStats(data);
            } catch (err) {
                console.error('Failed to fetch activity stats', err);
            }
        };
        fetchActivity();
    }, [activityDays]);

    return (
        <div className="activity-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="activity-header" style={{ marginBottom: '1rem' }}>
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
            
            <div className="activity-stats-display" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
