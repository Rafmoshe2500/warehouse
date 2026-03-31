import React, { useState } from 'react';
import { FiUsers, FiActivity } from 'react-icons/fi';
import UserManagement from './UserManagement';
import AuditLogs from './AuditLogs';
import { Tabs } from '../../components/common';
import './AccessControlPage.css';

const AccessControlPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className="access-control-page">
            <Tabs
                tabs={[
                    { id: 'users', label: 'ניהול משתמשים וקבוצות', icon: <FiUsers /> },
                    { id: 'logs',  label: 'לוגים', icon: <FiActivity /> }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            <div className="access-content">
                {activeTab === 'users' ? (
                    <UserManagement isEmbedded={true} />
                ) : (
                    <AuditLogs isEmbedded={true} />
                )}
            </div>
        </div>
    );
};

export default AccessControlPage;
