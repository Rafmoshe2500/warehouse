import React, { useState } from 'react';
import { FiSearch, FiPackage, FiBox, FiAlertCircle } from 'react-icons/fi';
import Spinner from '../../common/Spinner/Spinner';
import { useAnalytics } from '../../../hooks/useAnalytics';
import './ItemSearchChart.css';

const PROJECT_COLORS = [
    '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
    '#f97316', '#06b6d4'
];

const ItemSearchChart = () => {
    const [catalogNumber, setCatalogNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const hasResults = itemStats && itemStats.total_quantity != null;

    return (
        <div className="item-search-chart">
            {/* Search Input */}
            <div className="item-search-container">
                <div className="item-search-input-wrapper">
                    <input
                        type="text"
                        placeholder="הזן מקט לחיפוש..."
                        value={catalogNumber}
                        onChange={(e) => setCatalogNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleItemSearch()}
                    />
                    <button onClick={handleItemSearch} className="item-search-button">
                        <FiSearch />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="item-search-content">
                {itemLoading && (
                    <div className="item-search-loading">
                        <Spinner size="medium" />
                    </div>
                )}

                {!searchQuery && !itemLoading && (
                    <div className="item-search-empty">
                        <FiSearch className="item-search-empty-icon" />
                        <p className="item-search-empty-text">חפש מק"ט כדי לראות פילוג מלאי</p>
                    </div>
                )}

                {itemError && (
                    <div className="item-search-error">
                        <FiAlertCircle style={{ marginLeft: '0.4rem' }} />
                        שגיאה בטעינת נתונים
                    </div>
                )}

                {!itemLoading && !itemError && searchQuery && !hasResults && (
                    <div className="item-search-empty">
                        <FiBox className="item-search-empty-icon" />
                        <p className="item-search-empty-text">לא נמצאו נתונים למק"ט זה</p>
                    </div>
                )}

                {!itemLoading && !itemError && hasResults && (
                    <div className="item-stats-container">
                        {/* Summary Cards Row */}
                        <div className="item-stats-summary">
                            <div className="item-stats-pill item-stats-pill--total">
                                <FiBox className="item-stats-pill-icon" />
                                <div className="item-stats-pill-body">
                                    <span className="item-stats-pill-label">סה"כ במלאי</span>
                                    <span className="item-stats-pill-value">{itemStats.total_quantity.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="item-stats-pill item-stats-pill--allocated">
                                <FiPackage className="item-stats-pill-icon" />
                                <div className="item-stats-pill-body">
                                    <span className="item-stats-pill-label">משוריין</span>
                                    <span className="item-stats-pill-value">{itemStats.total_allocated.toLocaleString()}</span>
                                </div>
                            </div>
                            {itemStats.unallocated > 0 && (
                                <div className="item-stats-pill item-stats-pill--unallocated">
                                    <FiAlertCircle className="item-stats-pill-icon" />
                                    <div className="item-stats-pill-body">
                                        <span className="item-stats-pill-label">לא משוריין</span>
                                        <span className="item-stats-pill-value">{itemStats.unallocated.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Per-Project Breakdown */}
                        {itemStats.projects && itemStats.projects.length > 0 ? (
                            <div className="item-projects-list">
                                <div className="item-projects-list-header">שריון לפי פרויקט</div>
                                {itemStats.projects.map((proj, idx) => {
                                    const pct = itemStats.total_quantity > 0
                                        ? Math.round((proj.value / itemStats.total_quantity) * 100)
                                        : 0;
                                    const color = PROJECT_COLORS[idx % PROJECT_COLORS.length];
                                    return (
                                        <div key={proj.name} className="item-project-row">
                                            <div className="item-project-dot" style={{ background: color }} />
                                            <span className="item-project-name">{proj.name}</span>
                                            <span className="item-project-value">{proj.value.toLocaleString()}</span>
                                            <div className="item-project-bar-track">
                                                <div
                                                    className="item-project-bar-fill"
                                                    style={{ width: `${pct}%`, background: color }}
                                                />
                                            </div>
                                            <span className="item-project-pct">{pct}%</span>
                                        </div>
                                    );
                                })}

                                {/* Unallocated row */}
                                {itemStats.unallocated > 0 && (
                                    <div className="item-project-row item-project-row--unallocated">
                                        <div className="item-project-dot" style={{ background: 'rgba(255,255,255,0.2)' }} />
                                        <span className="item-project-name">לא משוריין</span>
                                        <span className="item-project-value">{itemStats.unallocated.toLocaleString()}</span>
                                        <div className="item-project-bar-track">
                                            <div
                                                className="item-project-bar-fill"
                                                style={{
                                                    width: `${Math.round((itemStats.unallocated / itemStats.total_quantity) * 100)}%`,
                                                    background: 'rgba(255,255,255,0.15)'
                                                }}
                                            />
                                        </div>
                                        <span className="item-project-pct">
                                            {Math.round((itemStats.unallocated / itemStats.total_quantity) * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="item-search-empty" style={{ marginTop: '1rem' }}>
                                <p className="item-search-empty-text">אין שריונות פעילים למק"ט זה</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemSearchChart;
