import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiPlus, FiSearch, FiClock, FiCheckCircle, FiX, FiLayers, FiTrendingUp, FiColumns, FiList } from 'react-icons/fi';
import { Button, Input, Pagination, ToastContainer, SkeletonOrderCards, Tabs } from '../../components/common';
import ProcurementTable from '../../components/procurement/ProcurementTable';
import KanbanBoard from '../../components/procurement/KanbanBoard/KanbanBoard';
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

const ProcurementPage = () => {
  const { isAdmin, isSuperAdmin, hasPermission, hasVendorAccess, hasPricePermission } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const location = useLocation();

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

  // Tab state: 'process' (default) or 'completed'
  const [activeTab, setActiveTab] = useState('process');
  
  // View mode for process tab: 'kanban' (default) or 'list'
  const [processViewMode, setProcessViewMode] = useState(() => {
    return localStorage.getItem('procurement_view_mode') || 'kanban';
  });

  const toggleProcessViewMode = (mode) => {
    setProcessViewMode(mode);
    localStorage.setItem('procurement_view_mode', mode);
  };
  useEffect(() => {
    if (activeTab !== 'bom-netapp' && activeTab !== 'analytics') {
      fetchOrders();
    }
  }, [page, pageSize, activeTab]); // Reload when tab changes

  const fetchOrders = async (filtersOverride = null) => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        page_size: pageSize,
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      // Add status filter based on active tab
      if (activeTab === 'process') {
        queryParams.status_ne = 'received';
      } else if (activeTab === 'completed') {
        queryParams.status_in = ['received'];
      }

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
    setActiveTab(tab);
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

      // Add status filter based on active tab
      if (activeTab === 'process') {
        queryParams.status_ne = 'received';
      } else {
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
      
      <Tabs 
        tabs={[
          { id: 'process', label: 'בתהליך', icon: <FiClock /> },
          { id: 'completed', label: 'הסתיים', icon: <FiCheckCircle /> },
          { id: 'bom-netapp', label: 'סריקת BOM', icon: <FiLayers /> },
          ...(canCompare ? [{ id: 'analytics', label: 'השוואת מחירים', icon: <FiTrendingUp /> }] : []),
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

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
              {activeTab === 'process' && (
                <div className="procurement-view-toggle">
                  <button
                    className={`procurement-view-btn ${processViewMode === 'kanban' ? 'active' : ''}`}
                    onClick={() => toggleProcessViewMode('kanban')}
                    title="תצוגת קנבן"
                  >
                    <FiColumns size={15} />
                  </button>
                  <button
                    className={`procurement-view-btn ${processViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => toggleProcessViewMode('list')}
                    title="תצוגת רשימה"
                  >
                    <FiList size={15} />
                  </button>
                </div>
              )}
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
              {activeTab === 'process' && processViewMode === 'kanban' ? (
                <KanbanBoard
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
                <ProcurementTable
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
