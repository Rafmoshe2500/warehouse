import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { CustomTooltip } from '../Tooltips';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const ManufacturerChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="no-data">אין נתוני יצרנים</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    height={80}
                    tick={{fill: 'var(--text-secondary)', fontSize: 11}}
                />
                <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-hover)'}} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-mfg-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ManufacturerChart;
