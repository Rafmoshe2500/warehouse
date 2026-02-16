import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import Spinner from '../../common/Spinner/Spinner';
import { CustomTooltip } from '../Tooltips';
import { useAnalytics } from '../../../hooks/useAnalytics';

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
        <div style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            {/* Search Input */}
            <div className="chart-search-container" style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                <div className="search-input-wrapper" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '8px', 
                    padding: '0.4rem 0.8rem',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
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
                        style={{
                            background: 'var(--accent-primary)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <FiSearch />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
                {itemLoading && (
                    <div style={{ 
                        position: 'absolute', inset: 0, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.2)', zIndex: 10, borderRadius: '12px'
                    }}>
                        <Spinner size="medium" />
                    </div>
                )}

                {!searchQuery ? (
                    <div className="no-data" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                        <FiSearch style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
                        <p>חפש מק"ט כדי לראות פילוג</p>
                    </div>
                ) : itemError ? (
                    <div className="error-message" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
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
                     <div className="no-data" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
                        לא נמצאו נתונים למק"ט זה
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ItemSearchChart;
