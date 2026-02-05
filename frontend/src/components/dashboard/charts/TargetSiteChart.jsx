import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CustomTooltip } from '../Tooltips';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const TargetSiteChart = ({ data }) => {
    const navigate = useNavigate();

    const handleBarClick = (data) => {
        if (data && data.name) {
            navigate(`/inventory?search=${encodeURIComponent(data.name)}`);
        }
    };

    if (!data || data.length === 0) {
        return <div className="no-data">אין נתונים להצגה</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    height={60}
                    tick={{fill: 'var(--text-secondary)', fontSize: 11}}
                />
                <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-hover)'}} />
                <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]} 
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TargetSiteChart;
