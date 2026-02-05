import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CustomTooltip } from '../Tooltips';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const ProjectDistributionChart = ({ data }) => {
    const navigate = useNavigate();

    const handlePieClick = (data) => {
        if (data && data.name) {
            navigate(`/inventory?search=${encodeURIComponent(data.name)}`);
        }
    };

    if (!data || data.length === 0) {
        return <div className="no-data">אין נתונים להצגה</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handlePieClick}
                    style={{ cursor: 'pointer', outline: 'none' }}
                    paddingAngle={2}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--bg-primary)" strokeWidth={2} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    iconType="circle"
                    wrapperStyle={{
                        paddingLeft: '20px',
                        fontSize: '13px'
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default ProjectDistributionChart;
