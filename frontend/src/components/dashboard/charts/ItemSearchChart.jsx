import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import Spinner from '../../common/Spinner/Spinner';
import { CustomTooltip } from '../Tooltips';
import { useAnalytics } from '../../../hooks/useAnalytics';
import './ItemSearchChart.css';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const ItemSearchChart = () => {
    const [catalogNumber, setCatalogNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Hook handles fetching based on searchQuery
    const { useItemProjectStats } = useAnalytics();
    const { 
        data: itemStats, 
        isLoading: itemLoading, 
        error: itemError 
    } = useItemProjectStats(searchQuery);

    const handleItemSearch = () => {
        if (!catalogNumber.trim()) return;
        setSearchQuery(catalogNumber.trim());
    };

    return (
        <div className="item-search-chart">
            <div className="item-search-container">
                <div className="item-search-input-wrapper">
                    <input 
                        type="text" 
                        placeholder="הזן מקט לחיפוש..." 
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleItemSearch()}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: 'var(--text-primary)', 
                            flex: 1,
                            outline: 'none',
                            fontSize: '0.875rem'
                        }}
                    />
                    <button 
                        onClick={handleItemSearch}
                        className="item-search-button"
                    >
                        <FiSearch />
                    </button>
                </div>
            </div>

            <div className="item-search-content">
                {itemLoading && (
                    <div className="item-search-loading">
                        <Spinner size="medium" />
                    </div>
                )}

                {!searchQuery ? (
                    <div className="item-search-empty">
                        <FiSearch className="item-search-empty-icon" />
                        <p className="item-search-empty-text">חפש מק"ט כדי לראות פילוג</p>
                    </div>
                ) : itemError ? (
                    <div className="item-search-error">
                        שגיאה בטעינת נתונים
                    </div>
                ) : itemStats && itemStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <Pie
                                data={itemStats}
                                cx="50%"
                                cy="50%"
                                label={false}
                                outerRadius={80}
                                innerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {itemStats.map((entry, index) => (
                                    <Cell key={`cell-item-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                                layout="horizontal" 
                                align="center" 
                                verticalAlign="bottom"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', opacity: 0.8, paddingTop: '10px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : searchQuery && !itemLoading ? (
                     <div className="item-search-empty">
                        לא נמצאו נתונים למק"ט זה
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ItemSearchChart;
