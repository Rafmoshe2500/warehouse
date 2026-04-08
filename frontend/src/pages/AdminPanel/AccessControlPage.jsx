import React, { useState } from 'react';
import { FiUsers, FiActivity, FiCpu } from 'react-icons/fi';
import UserManagement from './UserManagement';
import AuditLogs from './AuditLogs';
import AiToolsPanel from '../../components/admin/AiToolsPanel';
import { Tabs } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import './AccessControlPage.css';

const AccessControlPage = () => {
    const [activeTab, setActiveTab] = useState('users');
    const { isSuperAdmin } = useAuth();

    const tabs = [
        { id: 'users', label: 'ניהול משתמשים וקבוצות', icon: <FiUsers /> },
        { id: 'logs',  label: 'לוגים', icon: <FiActivity /> },
        ...(isSuperAdmin ? [{ id: 'ai', label: 'כלי AI', icon: <FiCpu /> }] : []),
    ];

    return (
        <div className="access-control-page">
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="access-content">
                {activeTab === 'users' ? (
                    <UserManagement isEmbedded={true} />
                ) : activeTab === 'logs' ? (
                    <AuditLogs isEmbedded={true} />
                ) : (
                    <AiToolsPanel />
                )}
            </div>
        </div>
    );
};

export default AccessControlPage;
