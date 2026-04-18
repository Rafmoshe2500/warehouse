import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout/AppLayout';
import GlobalSearch from './components/common/GlobalSearch/GlobalSearch';
import { Spinner } from './components/common';

// Lazy load page components for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage/DashboardPage'));
const InventoryTabbedPage = lazy(() => import('./pages/InventoryPage/InventoryTabbedPage'));

// Admin Panel pages
const AccessControlPage = lazy(() => import('./pages/AdminPanel/AccessControlPage'));
const UserManagement = lazy(() => import('./pages/AdminPanel/UserManagement'));
const AuditLogs = lazy(() => import('./pages/AdminPanel/AuditLogs'));
const AiToolsPanel = lazy(() => import('./components/admin/AiToolsPanel'));
const ProcurementPage = lazy(() => import('./pages/ProcurementPage/ProcurementPage'));
const BomTemplatesPage = lazy(() => import('./pages/BomTemplatesPage/BomTemplatesPage'));

// My Components
const MyComponentsDashboard = lazy(() => import('./pages/MyComponents/MyComponentsDashboard'));

const CollectionDetails = lazy(() => import('./pages/MyComponents/CollectionDetails'));

// User Guide — section pages (Stripe Docs style)
const GuideOverview = lazy(() => import('./pages/UserGuidePage/GuideOverview'));
const GuideInterface = lazy(() => import('./pages/UserGuidePage/GuideInterface'));
const GuideCollections = lazy(() => import('./pages/UserGuidePage/GuideCollections'));
const GuideDashboard = lazy(() => import('./pages/UserGuidePage/GuideDashboard'));
const GuideStaleItems = lazy(() => import('./pages/UserGuidePage/GuideStaleItems'));
const GuideAuditLogs = lazy(() => import('./pages/UserGuidePage/GuideAuditLogs'));
const GuideAdmin = lazy(() => import('./pages/UserGuidePage/GuideAdmin'));
const GuideProcurement = lazy(() => import('./pages/UserGuidePage/GuideProcurement'));
const GuideTips = lazy(() => import('./pages/UserGuidePage/GuideTips'));

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
      return <Spinner size="large" />;
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
      return <Spinner size="large" />;
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

  // מסלול פרטני לרכש — מאפשר כניסה בהרשאות ספק ספציפי
  const ProcurementRoute = ({ children }) => {
    const { isAuthenticated, hasProcurementAccess, loading } = useAuth();

    if (loading) return <Spinner size="large" />;
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (!hasProcurementAccess()) return <Navigate to="/dashboard" />;
    return children;
  };

  ProcurementRoute.propTypes = {
    children: PropTypes.node.isRequired
  };

  const AppRouter = () => {
    const { isAuthenticated, loading } = useAuth();
    const [showGlobalSearch, setShowGlobalSearch] = React.useState(false);

    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Spinner size="large" text="טוען..." />
        </div>
      );
    }

  return (
    <BrowserRouter>
      <div className="app-root-layout">
        {isAuthenticated ? (
          <>
            <GlobalSearch
              isOpen={showGlobalSearch}
              onClose={() => setShowGlobalSearch(false)}
            />
            <AppLayout onOpenSearch={() => setShowGlobalSearch(true)}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" />} />
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
                <InventoryTabbedPage />
              </PermissionRoute>
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
            path="/admin/bom-templates"
            element={
              <AdminRoute>
                <BomTemplatesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/ai"
            element={
              <AdminRoute>
                <AiToolsPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProcurementRoute>
                <ProcurementPage />
              </ProcurementRoute>
            }
          />
          <Route
            path="/my-components"
            element={
              <PrivateRoute>
                <MyComponentsDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-components/:id"
            element={
              <PrivateRoute>
                <CollectionDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide"
            element={
              <PrivateRoute>
                <GuideOverview />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/interface"
            element={
              <PrivateRoute>
                <GuideInterface />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/collections"
            element={
              <PrivateRoute>
                <GuideCollections />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/dashboard"
            element={
              <PrivateRoute>
                <GuideDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/stale-items"
            element={
              <PrivateRoute>
                <GuideStaleItems />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/audit-logs"
            element={
              <PrivateRoute>
                <GuideAuditLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/admin"
            element={
              <PrivateRoute>
                <GuideAdmin />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/procurement"
            element={
              <PrivateRoute>
                <GuideProcurement />
              </PrivateRoute>
            }
          />
          <Route
            path="/guide/tips"
            element={
              <PrivateRoute>
                <GuideTips />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
            </AppLayout>
          </>
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        )}
      </div>
    </BrowserRouter>
  );
};

export default AppRouter;

