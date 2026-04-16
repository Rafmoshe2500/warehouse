import React from 'react';
import { useSearchParams } from 'react-router-dom';
import UserManagement from './UserManagement';
import AuditLogs from './AuditLogs';
import AiToolsPanel from '../../components/admin/AiToolsPanel';
import { useAuth } from '../../context/AuthContext';
import './AccessControlPage.css';

const VALID_TABS = ['users', 'logs', 'ai'];

const AccessControlPage = () => {
    const [searchParams] = useSearchParams();
    const { isSuperAdmin } = useAuth();
    const tabParam = searchParams.get('tab');
    const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'users';

    return (
        <div className="access-control-page" data-testid="access-control-page">
            <div className="access-content">
                {activeTab === 'users' ? (
                    <UserManagement isEmbedded={true} />
                ) : activeTab === 'logs' ? (
                    <AuditLogs isEmbedded={true} />
                ) : activeTab === 'ai' && isSuperAdmin ? (
                    <AiToolsPanel />
                ) : (
                    <UserManagement isEmbedded={true} />
                )}
            </div>
        </div>
    );
};

export default AccessControlPage;
