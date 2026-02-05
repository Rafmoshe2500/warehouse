import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './context/AuthContext';
import Header from './components/layout/Header/Header';
import Navigation from './components/layout/Navigation/Navigation';
import { Spinner } from './components/common';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage/InventoryPage'));
const LogsPage = lazy(() => import('./pages/LogsPage/LogsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage/AdminPage'));
const StaleItemsPage = lazy(() => import('./pages/StaleItemsPage/StaleItemsPage'));

// Admin Panel pages
const AccessControlPage = lazy(() => import('./pages/AdminPanel/AccessControlPage'));
const UserManagement = lazy(() => import('./pages/AdminPanel/UserManagement')); // Kept for legacy or direct link safety
const AuditLogs = lazy(() => import('./pages/AdminPanel/AuditLogs'));
const ProcurementPage = lazy(() => import('./pages/ProcurementPage/ProcurementPage'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh' 
  }}>
    <Spinner size="large" text="טוען דף..." />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner size="large" text="טוען..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Spinner size="large" text="טוען..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired
};

const PermissionRoute = ({ children, permission }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();

  if (loading) {
    return <Spinner size="large" text="טוען..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check for exact permission
  let allowed = hasPermission(permission);

  // If not found, and we are asking for read-only access, check if we have read-write access
  if (!allowed && permission.endsWith(':ro')) {
      const rwPermission = permission.replace(':ro', ':rw');
      allowed = hasPermission(rwPermission);
  }

  if (!allowed) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

PermissionRoute.propTypes = {
  children: PropTypes.node.isRequired,
  permission: PropTypes.string.isRequired
};

const AppRouter = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="large" text="טוען..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <>
          <Header />
          <Navigation />
        </>
      )}

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <PermissionRoute permission="inventory:ro">
                <InventoryPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/stale"
            element={
              <PrivateRoute>
                <StaleItemsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <PrivateRoute>
                <LogsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AccessControlPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AuditLogs />
              </AdminRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <PermissionRoute permission="procurement:ro">
                <ProcurementPage />
              </PermissionRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;

