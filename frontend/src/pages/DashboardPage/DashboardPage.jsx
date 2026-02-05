import React, { useEffect, useState } from 'react';
import { FiBox, FiPackage, FiHash, FiMapPin } from 'react-icons/fi';
import analyticsService from '../../api/services/analyticsService';
import Spinner from '../../components/common/Spinner/Spinner';

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


    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const data = await analyticsService.getDashboardStats();
                setStats(data);
            } catch (err) {
                setError('Failed to fetch dashboard stats.');
                console.error('Error fetching dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    if (loading) return <div className="loading-container"><Spinner size="large" text="טוען נתונים..." /></div>;
    if (error) return <div className="loading-container" style={{color: 'red'}}>{error}</div>;

    return (
        <div className="dashboard-page">
            
            {/* Stat Cards */}
            <div className="stats-grid">
                <StatCard 
                    icon={FiBox}
                    title='סה"כ פריטים'
                    value={stats?.total_items || 0}
                    color="blue"
                />
                <StatCard 
                    icon={FiPackage}
                    title="שריונים פעילים"
                    value={stats?.active_allocations || 0}
                    color="green"
                />
                <StatCard 
                    icon={FiHash}
                    title="כמות ציוד סריאלי"
                    value={stats?.serial_equipment || 0}
                    color="purple"
                />
                <StatCard 
                    icon={FiBox}
                    title="כמות ציוד נלווה"
                    value={stats?.non_serial_equipment || 0}
                    color="amber"
                />
            </div>

            {/* First Row - Project Distribution & Target Sites */}
            <div className="charts-grid">
                <ChartCard title="התפלגות לפי פרויקט">
                    <div style={{ height: 450 }}>
                        <ProjectDistributionChart data={stats?.projects} />
                    </div>
                </ChartCard>

                <ChartCard title="התפלגות לפי אתר יעד">
                    <div style={{ height: 450 }}>
                        <TargetSiteChart data={stats?.target_sites} />
                    </div>
                </ChartCard>
            </div>

            {/* Second Row - Item Search & Activity Stats */}
            <div className="charts-grid second-row">
                <ChartCard title='חיפוש התפלגות לפי מק"ט'>
                    <div style={{ height: 380 }}>
                        <ItemSearchChart />
                    </div>
                </ChartCard>

                <ChartCard title="פעילות אחרונה">
                    <div style={{ height: 380 }}>
                        <ActivityStatsCard />
                    </div>
                </ChartCard>
            </div>

            {/* Third Row - Manufacturers & Locations */}
            <div className="charts-grid third-row">
                <ChartCard title="התפלגות לפי יצרן" icon={FiPackage}>
                    <div style={{ height: 400 }}>
                        <ManufacturerChart data={stats?.manufacturers} />
                    </div>
                </ChartCard>

                <ChartCard title="התפלגות לפי מיקום" icon={FiMapPin}>
                    <div style={{ height: 400 }}>
                        <LocationChart data={stats?.locations} />
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

export default DashboardPage;
