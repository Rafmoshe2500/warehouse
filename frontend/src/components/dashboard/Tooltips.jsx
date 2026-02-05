import React from 'react';

// Tooltip for Pie/Bar Charts
export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${payload[0].name || label} : ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

// Timeline-specific Tooltip to show all activity types
export const TimelineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip timeline-tooltip">
                <p style={{marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)'}}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{color: entry.color, margin: '4px 0', fontSize: '13px', fontWeight: '500'}}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};
