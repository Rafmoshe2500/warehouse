import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiSearch } from 'react-icons/fi';
import Input from '../../common/Input/Input';
import Button from '../../common/Button/Button';
import { TimelineTooltip } from '../Tooltips';

const ActivityTimelineChart = ({ data, days, onDaysChange, onCatalogSearch }) => {
    const [catalogNumber, setCatalogNumber] = useState('');

    const handleSearch = () => {
        if (onCatalogSearch) {
            onCatalogSearch(catalogNumber.trim());
        }
    };

    const handleClear = () => {
        setCatalogNumber('');
        if (onCatalogSearch) {
            onCatalogSearch('');
        }
    };

    if (!data || data.length === 0) {
        return <div className="no-data">אין נתוני פעילות</div>;
    }

    return (
        <>
            <div style={{ 
                marginBottom: '1rem', 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'flex-start',
                maxWidth: '500px'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Input
                        type="text"
                        placeholder='סנן לפי מק"ט (השאר ריק לכל הפעילות)'
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        icon={FiSearch}
                        style={{ fontSize: '0.875rem' }}
                    />
                </div>
                <Button 
                    onClick={handleSearch} 
                    variant="primary"
                    icon={<FiSearch />}
                    style={{ 
                        minWidth: '70px',
                        height: '38px',
                        fontSize: '0.875rem'
                    }}
                >
                    סנן
                </Button>
                {catalogNumber && (
                    <Button 
                        onClick={handleClear} 
                        variant="secondary"
                        style={{ 
                            minWidth: '70px',
                            height: '38px',
                            fontSize: '0.875rem'
                        }}
                    >
                        נקה
                    </Button>
                )}
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                    <defs>
                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDeleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fill: 'var(--text-secondary)', fontSize: 11}}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} />
                    <Tooltip content={<TimelineTooltip />} />
                    <Legend 
                        wrapperStyle={{fontSize: '13px'}}
                        iconType="line"
                    />
                    <Area 
                        type="monotone" 
                        dataKey="created" 
                        name="נוצרו"
                        stroke="#10b981" 
                        fillOpacity={1}
                        fill="url(#colorCreated)"
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="updated" 
                        name="עודכנו"
                        stroke="#f59e0b" 
                        fillOpacity={1}
                        fill="url(#colorUpdated)"
                        strokeWidth={2}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="deleted" 
                        name="נמחקו"
                        stroke="#ef4444" 
                        fillOpacity={1}
                        fill="url(#colorDeleted)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </>
    );
};

export default ActivityTimelineChart;
