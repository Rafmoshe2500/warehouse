import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import { CustomTooltip } from '../Tooltips';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const LocationChart = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!data) return [];
        let pData = data;
        
        // 1. Filter
        if (searchTerm) {
            pData = pData.filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Sort Descending (Highest to Lowest)
        return [...pData].sort((a, b) => b.value - a.value);
    }, [data, searchTerm]);

    if (!data || data.length === 0) {
        return <div className="no-data">אין נתוני מיקומים</div>;
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
                        placeholder="חפש מיקום..." 
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

            <div style={{ flex: 1, minHeight: 0, marginRight: '-1rem' }}> {/* Pull chart to the right edge */}
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            layout="vertical"
                            margin={{ top: 10, right: 0, left: 10, bottom: 5 }} // Recharts Margin Right = 0
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                            <XAxis type="number" hide reversed={true} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={100}
                                orientation="right"
                                tick={{fill: 'var(--text-secondary)', fontSize: 11, textAnchor: 'start'}}
                                mirror={false}
                                tickMargin={5} 
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--bg-hover)'}} />
                            <Bar dataKey="value" radius={[4, 0, 0, 4]} barSize={20} background={{ fill: 'rgba(255,255,255,0.05)' }}>
                                {filteredData.map((entry, index) => (
                                    <Cell key={`cell-loc-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart> 
                    </ResponsiveContainer>
                ) : (
                    <div className="no-data" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        לא נמצאו מיקומים
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationChart;
