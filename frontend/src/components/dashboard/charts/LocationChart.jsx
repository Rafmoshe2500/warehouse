import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import { CustomTooltip } from '../Tooltips';
import './LocationChart.css';

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
        <div className="location-chart">
            <div className="location-search-container">
                <div className="location-search-input-wrapper">
                    <FiSearch className="location-search-icon" />
                    <input 
                        type="text" 
                        className="location-search-input"
                        placeholder="חפש מיקום..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="location-chart-container">
                {filteredData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={filteredData}
                            layout="vertical"
                            margin={{ top: 10, right: 0, left: 10, bottom: 5 }}
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
                    <div className="location-no-results">
                        לא נמצאו מיקומים
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(LocationChart);
