import React from 'react';
import UserManagement from './UserManagement';
import './AccessControlPage.css';

const AccessControlPage = () => {
    return (
        <div className="access-control-page" data-testid="access-control-page">
            <UserManagement />
        </div>
    );
};

export default AccessControlPage;
