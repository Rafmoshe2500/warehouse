import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import Spinner from '../../common/Spinner/Spinner';
import { CustomTooltip } from '../Tooltips';
import { useAnalytics } from '../../../hooks/useAnalytics';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const ItemSearchChart = () => {
    const [catalogNumber, setCatalogNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // State for the actual query to trigger hook
    
    // Hook handles fetching based on searchQuery
    const { useItemProjectStats } = useAnalytics();
    const { 
        data: itemStats, 
        isLoading: itemLoading, 
        error: itemError 
    } = useItemProjectStats(searchQuery);

    const handleItemSearch = () => {
        if (!catalogNumber.trim()) return;
        setSearchQuery(catalogNumber);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="item-search-controls" style={{ 
                marginBottom: '1rem', 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'flex-start',
                maxWidth: '400px'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Input
                        type="text"
                        placeholder='חפש לפי מק"ט'
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleItemSearch()}
                        icon={FiSearch}
                        style={{ fontSize: '0.875rem' }}
                    />
                </div>
                <Button 
                    onClick={handleItemSearch} 
                    variant="primary"
                    icon={<FiSearch />}
                    style={{ 
                        minWidth: '80px',
                        height: '38px',
                        fontSize: '0.875rem'
                    }}
                >
                    חפש
                </Button>
            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
                {itemLoading ? (
                    <div className="loading-state"><Spinner size="medium" /></div>
                ) : itemStats ? (
                    itemStats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <Pie
                                    data={itemStats}
                                    cx="50%"
                                    cy="50%"
                                    label={false}
                                    outerRadius={60}
                                    innerRadius={30}
                                    fill="#82ca9d"
                                    dataKey="value"
                                    paddingAngle={2}
                                >
                                    {itemStats.map((entry, index) => (
                                        <Cell key={`cell-item-${index}`} fill={COLORS[index % COLORS.length]} stroke="var(--bg-primary)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    layout="horizontal" 
                                    align="center" 
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: '12px',
                                        paddingTop: '10px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data">אין שריונים למק"ט זה</div>
                    )
                ) : (
                    <div className="no-data">
                        {searchQuery ? 'לא נמצאו נתונים' : 'חפש מק"ט כדי לראות התפלגות'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemSearchChart;
