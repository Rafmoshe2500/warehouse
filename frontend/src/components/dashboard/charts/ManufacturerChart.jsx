import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import { CustomTooltip } from '../Tooltips';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const ManufacturerChart = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchTerm) return data;
        return data.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    if (!data || data.length === 0) {
        return <div className="no-data">אין נתוני יצרנים</div>;
    }

    return (
        <div style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <div className="chart-search-container" style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                <div className="search-input-wrapper" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '8px', 
                    padding: '0.4rem 0.8rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <FiSearch style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }} />
                    <input 
                        type="text" 
                        placeholder="חפש יצרן..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-primary)', 
                            width: '100%',
                            outline: 'none',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            layout="horizontal"
                            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis 
                                dataKey="name" 
                                angle={-30} 
                                textAnchor="end" 
                                interval={0}
                                height={60}
                                tick={{fill: 'var(--text-secondary)', fontSize: 11}}
                            />
                            <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-hover)'}} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-mfg-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="no-data" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        לא נמצאו יצרנים
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManufacturerChart;
