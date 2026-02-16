import React from 'react';
import { 
    FiBox, 
    FiPackage, 
    FiHash, 
    FiMapPin, 
    FiCalendar,
    FiTrendingUp,
    FiActivity,
    FiSearch
} from 'react-icons/fi';
import Spinner from '../../components/common/Spinner/Spinner';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../context/AuthContext'; // Corrected import path

// Dashboard Components
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import ProjectDistributionChart from '../../components/dashboard/charts/ProjectDistributionChart';
import TargetSiteChart from '../../components/dashboard/charts/TargetSiteChart';
import ItemSearchChart from '../../components/dashboard/charts/ItemSearchChart';
import ActivityStatsCard from '../../components/dashboard/charts/ActivityStatsCard';
import ManufacturerChart from '../../components/dashboard/charts/ManufacturerChart';
import LocationChart from '../../components/dashboard/charts/LocationChart';

import './DashboardPage.css';

const DashboardPage = () => {
    const { useDashboardStats } = useAnalytics();
    const { data: stats, isLoading: loading, error } = useDashboardStats();
    const { user } = useAuth(); // Get current user

    if (loading) return (
        <div className="dashboard-loading">
            <Spinner size="large" />
            <p>מכין את הדאשבורד שלך...</p>
        </div>
    );
    
    if (error) return (
        <div className="dashboard-error">
            <div className="error-content">
                <h3>שגיאה בטעינת הנתונים</h3>
                <p>נסה לרענן את העמוד או לפנות לתמיכה</p>
                <button onClick={() => window.location.reload()} className="retry-btn">נסה שוב</button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-wrapper" dir="rtl">
            <main className="dashboard-container">
                
                {/* Stats Row - Highlighted */}
                <div className="dashboard-section-title">
                    <FiActivity /> מדדים מרכזיים
                </div>
                
                <div className="bento-grid-stats">
                    <div className="stat-tile blue">
                        <div className="stat-icon-bg"><FiBox /></div>
                        <div className="stat-content">
                            <h3>סה"כ פריטים</h3>
                            <div className="stat-number">{stats?.total_items?.toLocaleString() || 0}</div>
                        </div>
                        <div className="stat-trend positive">
                            <FiTrendingUp /> במלאי
                        </div>
                    </div>

                    <div className="stat-tile green">
                        <div className="stat-icon-bg"><FiPackage /></div>
                        <div className="stat-content">
                            <h3>שריונים פעילים</h3>
                            <div className="stat-number">{stats?.active_allocations?.toLocaleString() || 0}</div>
                        </div>
                        <div className="stat-trend neutral">
                            פעילים כרגע
                        </div>
                    </div>

                    <div className="stat-tile purple">
                        <div className="stat-icon-bg"><FiHash /></div>
                        <div className="stat-content">
                            <h3>ציוד סריאלי</h3>
                            <div className="stat-number">{stats?.serial_equipment?.toLocaleString() || 0}</div>
                        </div>
                        <div className="stat-trend">
                            מעקב פרטני
                        </div>
                    </div>

                    <div className="stat-tile amber">
                        <div className="stat-icon-bg"><FiBox /></div>
                        <div className="stat-content">
                            <h3>ציוד נלווה</h3>
                            <div className="stat-number">{stats?.non_serial_equipment?.toLocaleString() || 0}</div>
                        </div>
                        <div className="stat-trend">
                            ניהול כמותי
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="bento-grid-main">
                    
                    {/* Locations - Tall Item (Right) */}
                    <div className="bento-card activity-card">
                        <div className="card-header">
                            <h3>מיקומים במחסן</h3>
                        </div>
                        <div className="card-body">
                            <LocationChart data={stats?.locations} />
                        </div>
                    </div>

                    {/* Item Search - 1 Column (Middle) */}
                    <div className="bento-card col-span-1">
                        <div className="card-header">
                            <h3><FiSearch /> חיפוש וניתוח לפי מק"ט</h3>
                        </div>
                        <div className="card-body">
                            <ItemSearchChart />
                        </div>
                    </div>

                    {/* Project Distribution - 2 Columns (Left) */}
                    <div className="bento-card"> 
                        <div className="card-header">
                            <h3>פילוג לפי פרויקט</h3>
                        </div>
                        <div className="card-body">
                            <ProjectDistributionChart data={stats?.projects} />
                        </div>
                    </div>

                    {/* Target Sites - 3 Columns (Bottom Left - Next to Locations) */}
                    <div className="bento-card chart-card-lg">
                        <div className="card-header">
                            <h3>פילוג לפי אתר יעד</h3>
                        </div>
                        <div className="card-body">
                            <TargetSiteChart data={stats?.target_sites} />
                        </div>
                    </div>

                    {/* Activity Feed - 25% Width */}
                    <div className="bento-card col-span-1">
                        <div className="card-header">
                            <h3><FiActivity /> פעילות אחרונה</h3>
                        </div>
                        <div className="card-body scrollable">
                            <ActivityStatsCard />
                        </div>
                    </div>

                    {/* Manufacturers - 75% Width */}
                    <div className="bento-card col-span-3">
                        <div className="card-header">
                            <h3>יצרנים מובילים</h3>
                        </div>
                        <div className="card-body">
                            <ManufacturerChart data={stats?.manufacturers} />
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
