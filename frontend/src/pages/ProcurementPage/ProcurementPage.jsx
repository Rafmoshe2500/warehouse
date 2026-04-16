import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiGrid, FiList } from 'react-icons/fi';
import { Button, Input, Pagination, ToastContainer, SkeletonOrderCards } from '../../components/common';
import ProcurementCards from '../../components/procurement/ProcurementCards';
import ProcurementDataTable from '../../components/procurement/ProcurementDataTable';
import ProcurementModal from '../../components/procurement/ProcurementModal';
import OrderTypeModal from '../../components/procurement/OrderTypeModal';
import BomPrescanModal from '../../components/procurement/BomPrescanModal';
import ProcurementFilesModal from '../../components/procurement/ProcurementFilesModal';
import DeleteModal from '../../components/common/DeleteModal/DeleteModal';
import OrderHistoryModal from '../../components/procurement/OrderHistoryModal';
import BomScannerTab from '../../components/procurement/BomScannerTab/BomScannerTab';
import BomPreviewModal from '../../components/procurement/BomPreviewModal';
import ProcurementAnalyticsTab from '../../components/procurement/AnalyticsTab/ProcurementAnalyticsTab';
import AnalyticsStrip from '../../components/procurement/AnalyticsStrip/AnalyticsStrip';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useProcurementModals } from '../../hooks/useProcurementModals';
import procurementService from '../../api/services/procurementService';
import './ProcurementPage.css';

const STATUS_FILTERS = [
  { id: 'in_process', label: 'בתהליך' },
  { id: 'completed',  label: 'הסתיים' },
  { id: 'all',        label: 'הכל' },
];

const ProcurementPage = () => {
  const { isAdmin, isSuperAdmin, hasPermission, hasVendorAccess, hasPricePermission } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const VENDORS = ['dell', 'hpe', 'netapp', 'cisco', 'commvault'];
  // canEdit: גלובלי OR כל הרשאת עריכה של ספק ספציפי
  const canEdit = hasPermission('procurement:rw') ||
    VENDORS.some(v => hasPermission(`procurement:${v}:rw`));

  // השוואת מחירים — רק עם הרשאה ספציפית
  const canCompare = hasPermission('procurement:compare_prices');

  // פונקציה שבודקת אם המשתמש יכול לערוך הזמנה ספציפית לפי ספק
  const canEditOrder = (order) => {
    if (isAdmin || isSuperAdmin) return true;
    if (hasPermission('procurement:rw')) return true;
    const rawVendor = order?.bom_vendor || order?.manufacturer || '';
    const vendor = typeof rawVendor === 'string' ? rawVendor.toLowerCase() : '';
    if (!vendor) return hasPermission('procurement:rw'); // no vendor → only global rw
    return hasVendorAccess(vendor, 'rw');
  };
  
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('search') || '';
  });

  // Modal states (centralized hook)
  const modals = useProcurementModals();

  // Tab state: driven by URL search params from sidebar navigation
  const VALID_TABS = ['orders', 'bom-netapp', 'analytics'];
  const tabParam = searchParams.get('tab');
  // Backward compat: map old tab names to new
  const resolvedTab = tabParam === 'process' || tabParam === 'completed' ? 'orders' : tabParam;
  const activeTab = VALID_TABS.includes(resolvedTab) ? resolvedTab : 'orders';

  // Status filter for orders tab: 'in_process' | 'completed' | 'all'
  const [statusFilter, setStatusFilter] = useState(() => {
    // If user came from old ?tab=completed URL, default to completed filter
    if (tabParam === 'completed') return 'completed';
    return 'in_process';
  });

  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('procurement_view_mode') || 'cards';
  });

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('procurement_view_mode', mode);
  };
  useEffect(() => {
    if (activeTab !== 'bom-netapp' && activeTab !== 'analytics') {
      fetchOrders();
    }
  }, [page, pageSize, activeTab, statusFilter]); // Reload when tab or status filter changes

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        page_size: pageSize,
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      // Add status filter
      if (statusFilter === 'in_process') {
        queryParams.status_ne = 'received';
      } else if (statusFilter === 'completed') {
        queryParams.status_in = ['received'];
      }
      // 'all' → no status filter

      const data = await procurementService.getOrders(queryParams);
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      error('שגיאה בטעינת הזמנות רכש');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPage(1);
    fetchOrders(); // This will not use searchTerm anymore
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setPage(1);
    // fetchOrders triggered by useEffect
  };

  const handleCreate = async (orderData) => {
    try {
      await procurementService.createOrder(orderData);
      success('הזמנה נוצרה בהצלחה');
      modals.closeEditModal();
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה ביצירת הזמנה');
    }
  };

  const handleUpdate = async (orderData) => {
    try {
      await procurementService.updateOrder(modals.editingOrder.id, orderData);
      success('הזמנה עודכנה בהצלחה');
      modals.closeEditModal();
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה בעדכון הזמנה');
    }
  };

  const handleDelete = async (reason) => {
    try {
      await procurementService.deleteOrder(modals.orderToDelete.id);
      success('הזמנה נמחקה בהצלחה');
      modals.closeDeleteModal();
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה במחיקת הזמנה');
    }
  };

  const handleOrderTypeSelect = modals.handleOrderTypeSelect;

  const handleBomPrescanDone = modals.handleBomPrescanDone;

  const handleMarkAsOrdered = async (order) => {
    try {
      await procurementService.updateOrder(order.id, { status: 'shipped' });
      success('הסטטוס עודכן ל"נשלח"');
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה בעדכון הסטטוס');
    }
  };

  const handleMarkAsReceived = async (order) => {
    try {
      await procurementService.updateOrder(order.id, { status: 'received' });
      success('הסטטוס עודכן ל"התקבל"');
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה בעדכון הסטטוס');
    }
  };

  const handleFileChange = async () => {
    try {
      const queryParams = {
        page,
        page_size: pageSize,
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      // Add status filter
      if (statusFilter === 'in_process') {
        queryParams.status_ne = 'received';
      } else if (statusFilter === 'completed') {
        queryParams.status_in = ['received'];
      }

      const data = await procurementService.getOrders(queryParams);
      setOrders(data.orders);
      setTotal(data.total);
      
      const updatedOrder = data.orders.find(o => o.id === modals.selectedOrderForFiles.id);
      if (updatedOrder) {
        modals.setSelectedOrderForFiles(updatedOrder);
      }
    } catch (err) {
      error('שגיאה בעדכון הנתונים');
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when size changes
  };

  return (
    <div className="procurement-page">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="procurement-tab-content">
      {/* Analytics Tab */}
      {activeTab === 'analytics' ? (
        <ProcurementAnalyticsTab />
      ) : activeTab === 'bom-netapp' ? (
        <BomScannerTab />
      ) : (
        <>
          <div className="procurement-controls-row">
            <div className="procurement-controls-left">
              {canEdit && (
                <Button 
                  variant="primary" 
                  onClick={modals.openCreateModal}
                  icon={<FiPlus />}
                >
                  הזמנה חדשה
                </Button>
              )}

              {/* Status filter segmented control */}
              <div className="procurement-status-filter">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f.id}
                    className={`procurement-sf-btn ${statusFilter === f.id ? 'active' : ''}`}
                    onClick={() => { setStatusFilter(f.id); setPage(1); }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* View mode toggle */}
              <div className="procurement-view-toggle">
                <button
                  className={`procurement-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('cards')}
                  title="תצוגת כרטיסיות"
                >
                  <FiGrid size={15} />
                </button>
                <button
                  className={`procurement-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => toggleViewMode('table')}
                  title="תצוגת טבלה"
                >
                  <FiList size={15} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <Input
                placeholder="חיפוש לפי מק&quot;ט, יצרן או מספר EMF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input global-search"
                icon={<FiSearch />}
              />
              {searchTerm && (
                <Button 
                  type="button" 
                  variant="tertiary" 
                  onClick={handleClearFilters}
                  icon={<FiX />}
                  style={{ padding: '0.5rem' }}
                >
                </Button>
              )}
            </form>
          </div>

          {loading ? (
            <SkeletonOrderCards count={8} />
          ) : (
            <>
              {viewMode === 'table' ? (
                <ProcurementDataTable
                  orders={orders}
                  canEdit={canEdit}
                  canEditOrder={canEditOrder}
                  isAdmin={isAdmin || isSuperAdmin}
                  onEdit={modals.openEditModal}
                  onDelete={modals.openDeleteModal}
                  onManageFiles={modals.openFilesModal}
                  onHistory={modals.openHistoryModal}
                  onViewBom={modals.openBomPreviewModal}
                  onMarkAsOrdered={handleMarkAsOrdered}
                  onMarkAsReceived={handleMarkAsReceived}
                />
              ) : (
                <ProcurementCards
                  orders={orders}
                  canEdit={canEdit}
                  canEditOrder={canEditOrder}
                  isAdmin={isAdmin || isSuperAdmin}
                  onEdit={modals.openEditModal}
                  onDelete={modals.openDeleteModal}
                  onManageFiles={modals.openFilesModal}
                  onHistory={modals.openHistoryModal}
                  onViewBom={modals.openBomPreviewModal}
                  onMarkAsOrdered={handleMarkAsOrdered}
                  onMarkAsReceived={handleMarkAsReceived}
                />
              )}

              <Pagination
                currentPage={page}
                totalPages={Math.ceil(total / pageSize)}
                totalItems={total}
                limit={pageSize}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePageSizeChange}
              />
            </>
          )}
        </>
      )}
      </div>

      {hasPermission('compare_prices') && <AnalyticsStrip />}

      {/* Order type selection (new orders only) */}
      <OrderTypeModal
        isOpen={modals.isOrderTypeModalOpen}
        onClose={modals.closeOrderTypeModal}
        onSelect={handleOrderTypeSelect}
      />

      {/* BOM pre-scan (for BOM orders before form opens) */}
      <BomPrescanModal
        isOpen={modals.isBomPrescanOpen}
        onClose={modals.closeBomPrescanModal}
        onDone={handleBomPrescanDone}
      />

      {/* Main procurement form (create/edit) */}
      <ProcurementModal
        isOpen={modals.isEditModalOpen}
        onClose={modals.closeEditModal}
        onSubmit={modals.editingOrder ? handleUpdate : handleCreate}
        initialData={modals.editingOrder}
        isEdit={!!modals.editingOrder}
        orderType={modals.editingOrder ? null : modals.newOrderType}
        bomPrescanData={modals.editingOrder ? null : modals.bomPrescanData}
      />

      <ProcurementFilesModal
        isOpen={modals.isFilesModalOpen}
        onClose={modals.closeFilesModal}
        order={modals.selectedOrderForFiles}
        onFileChange={handleFileChange}
        canEdit={canEdit}
      />

      <DeleteModal
        isOpen={modals.isDeleteModalOpen}
        onClose={modals.closeDeleteModal}
        onConfirm={handleDelete}
        type="reason"
        title="מחיקת הזמנת רכש"
        message={`האם אתה בטוח שברצונך למחוק את ההזמנת רכש${modals.orderToDelete?.catalog_number ? `: "${modals.orderToDelete.catalog_number}"` : ''}?`}
        warningText="פעולה זו בלתי הפיכה!"
      />
      
      <OrderHistoryModal
        isOpen={modals.isHistoryModalOpen}
        onClose={modals.closeHistoryModal}
        orderId={modals.selectedOrderForHistory?.id}
        orderNumber={modals.selectedOrderForHistory?.catalog_number}
      />

      <BomPreviewModal
        isOpen={modals.isBomPreviewOpen}
        onClose={modals.closeBomPreviewModal}
        bomData={modals.selectedOrderForBom?.bom_data}
        vendor={modals.selectedOrderForBom?.bom_vendor}
        orderId={modals.selectedOrderForBom?.id}
        canEdit={modals.selectedOrderForBom?.bom_vendor
          ? hasVendorAccess(modals.selectedOrderForBom.bom_vendor.toLowerCase(), 'rw')
          : false}
      />
    </div>
  );
};

export default ProcurementPage;
