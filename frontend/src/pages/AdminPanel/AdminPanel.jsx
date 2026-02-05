import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiActivity, FiShield, FiUser, FiClipboard } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import Spinner from '../../components/common/Spinner/Spinner';
import ToastContainer from '../../components/common/Toast/ToastContainer';
import Button from '../../components/common/Button/Button';
import StatCard from '../../components/dashboard/StatCard';
import adminService from '../../api/services/adminService';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, error } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      error('שגיאה בטעינת סטטיסטיקות');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel-loading">
        <Spinner size="large" text="טוען..." />
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="admin-panel-header">
        {/* Title removed */}
        <p>ניהול משתמשים, הרשאות וצפייה בנתוני מערכת</p>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          icon={FiUsers}
          title='סה"כ משתמשים'
          value={stats?.total_users || 0}
          color="gray"
        />
        <StatCard
          icon={FiActivity}
          title="משתמשים פעילים"
          value={stats?.active_users || 0}
          color="green"
        />
        <StatCard
          icon={FiShield}
          title="אדמינים"
          value={stats?.admins || 0}
          color="purple"
        />
        <StatCard
          icon={FiUser}
          title="משתמשים רגילים"
          value={stats?.regular_users || 0}
          color="amber"
        />
      </div>

      <div className="admin-actions">
        <Button 
          variant="primary"
          icon={<FiUsers />}
          onClick={() => navigate('/admin/users')}
          className="admin-action-btn"
        >
          ניהול משתמשים
        </Button>

        <Button 
          variant="secondary"
          icon={<FiClipboard />}
          onClick={() => navigate('/admin/audit')}
          className="admin-action-btn"
        >
          לוגים
        </Button>
      </div>
    </div>
  );
};

export default AdminPanel;
