import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiActivity } from 'react-icons/fi';
import UserManagement from './UserManagement';
import GroupManagement from './GroupManagement';
import AuditLogs from './AuditLogs';
import StatCard from '../../components/dashboard/StatCard';
import adminService from '../../api/services/adminService';
import './AccessControlPage.css';

const AccessControlPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminService.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats');
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="access-control-page">
            {stats && (
                <div className="access-stats-grid">
                    <StatCard
                        icon={FiUsers}
                        title='סה"כ משתמשים'
                        value={stats.total_users || 0}
                        color="blue"
                    />
                    <StatCard
                        icon={FiShield}
                        title="אדמינים"
                        value={stats.admins || 0}
                        color="purple"
                    />
                    <StatCard
                        icon={FiActivity}
                        title="משתמשים פעילים"
                        value={stats.active_users || 0}
                        color="green"
                    />
                </div>
            )}

            <div className="access-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <FiUsers />ניהול משתמשים
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('groups')}
                >
                    <FiShield /> ניהול קבוצות
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    <FiActivity /> לוגים
                </button>
            </div>

            <div className="access-content">
                {activeTab === 'users' ? (
                    <UserManagement isEmbedded={true} />
                ) : activeTab === 'groups' ? (
                    <GroupManagement />
                ) : (
                    <AuditLogs isEmbedded={true} />
                )}
            </div>
        </div>
    );
};

export default AccessControlPage;
