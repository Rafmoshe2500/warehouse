import React, { useState, useEffect } from 'react';
import { FiUsers, FiShield, FiActivity } from 'react-icons/fi';
import UserManagement from './UserManagement';
import GroupManagement from './GroupManagement';
import AuditLogs from './AuditLogs';
import { Tabs } from '../../components/common';
import './AccessControlPage.css';

const AccessControlPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="access-control-page">

            <Tabs 
                tabs={[
                    { id: 'users', label: 'ניהול משתמשים', icon: <FiUsers /> },
                    { id: 'groups', label: 'ניהול קבוצות', icon: <FiShield /> },
                    { id: 'logs', label: 'לוגים', icon: <FiActivity /> }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

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
