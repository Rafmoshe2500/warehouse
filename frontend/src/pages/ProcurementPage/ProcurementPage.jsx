import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiClock, FiCheckCircle, FiX, FiLayers, FiTrendingUp } from 'react-icons/fi';
import { Button, Input, Pagination, Spinner, ToastContainer, SkeletonTable, Tabs } from '../../components/common';
import ProcurementTable from '../../components/procurement/ProcurementTable';
import ProcurementModal from '../../components/procurement/ProcurementModal';
import OrderTypeModal from '../../components/procurement/OrderTypeModal';
import BomPrescanModal from '../../components/procurement/BomPrescanModal';
import ProcurementFilesModal from '../../components/procurement/ProcurementFilesModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import OrderHistoryModal from '../../components/procurement/OrderHistoryModal';
import BomScannerTab from '../../components/procurement/BomScannerTab/BomScannerTab';
import BomPreviewModal from '../../components/procurement/BomPreviewModal';
import ProcurementAnalyticsTab from '../../components/procurement/AnalyticsTab/ProcurementAnalyticsTab';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import procurementService from '../../api/services/procurementService';
import './ProcurementPage.css';

const ProcurementPage = () => {
  const { isAdmin, isSuperAdmin, hasPermission, hasVendorAccess, hasPricePermission } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

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
    const vendor = order?.bom_vendor?.toLowerCase() || order?.manufacturer?.toLowerCase() || '';
    if (!vendor) return hasPermission('procurement:rw'); // no vendor → only global rw
    return hasVendorAccess(vendor, 'rw');
  };
  
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedOrderForFiles, setSelectedOrderForFiles] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);

  // BOM preview modal
  const [isBomPreviewOpen, setIsBomPreviewOpen] = useState(false);
  const [selectedOrderForBom, setSelectedOrderForBom] = useState(null);

  // Order type selection + BOM prescan
  const [isOrderTypeModalOpen, setIsOrderTypeModalOpen] = useState(false);
  const [newOrderType, setNewOrderType] = useState(null);       // 'bom' | 'manual'
  const [isBomPrescanOpen, setIsBomPrescanOpen] = useState(false);
  const [bomPrescanData, setBomPrescanData] = useState(null);   // { result, vendor }

  // Tab state: 'process' (default) or 'completed'
  const [activeTab, setActiveTab] = useState('process');




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
      setIsEditModalOpen(false);
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה ביצירת הזמנה');
    }
  };

  const handleUpdate = async (orderData) => {
    try {
      await procurementService.updateOrder(editingOrder.id, orderData);
      success('הזמנה עודכנה בהצלחה');
      setIsEditModalOpen(false);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה בעדכון הזמנה');
    }
  };

  const handleDelete = async (reason) => {
    try {
      await procurementService.deleteOrder(orderToDelete.id);
      success('הזמנה נמחקה בהצלחה');
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.detail || 'שגיאה במחיקת הזמנה');
    }
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    setIsOrderTypeModalOpen(true); // Show type selection first
  };

  const handleOrderTypeSelect = (type) => {
    setNewOrderType(type);
    setIsOrderTypeModalOpen(false);
    if (type === 'bom') {
      // BOM flow: prescan first, then open form pre-filled
      setBomPrescanData(null);
      setIsBomPrescanOpen(true);
    } else {
      // Manual flow: open form directly
      setBomPrescanData(null);
      setIsEditModalOpen(true);
    }
  };

  const handleBomPrescanDone = (data) => {
    // data = { result, vendor } from BomPrescanModal
    setIsBomPrescanOpen(false);
    setBomPrescanData(data);
    setIsEditModalOpen(true);
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

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

  const openFilesModal = (order) => {
    setSelectedOrderForFiles(order);
    setIsFilesModalOpen(true);
  };

  const openHistoryModal = (order) => {
    setSelectedOrderForHistory(order);
    setIsHistoryModalOpen(true);
  };

  const openBomPreviewModal = (order) => {
    setSelectedOrderForBom(order);
    setIsBomPreviewOpen(true);
  };

  const handleFileChange = async () => {
    try {
      // Refetch with current tab filters
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
      
      const updatedOrder = data.orders.find(o => o.id === selectedOrderForFiles.id);
      if (updatedOrder) {
        setSelectedOrderForFiles(updatedOrder);
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
            {canEdit && (
              <Button 
                variant="primary" 
                onClick={openCreateModal}
                icon={<FiPlus />}
              >
                הזמנה חדשה
              </Button>
            )}

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
            <SkeletonTable rows={8} columns={7} />
          ) : (
            <>
              <ProcurementTable
                orders={orders}
                canEdit={canEdit}
                canEditOrder={canEditOrder}
                isAdmin={isAdmin || isSuperAdmin}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
                onManageFiles={openFilesModal}
                onHistory={openHistoryModal}
                onViewBom={openBomPreviewModal}
                onMarkAsOrdered={handleMarkAsOrdered}
                onMarkAsReceived={handleMarkAsReceived}
              />

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

      {/* Order type selection (new orders only) */}
      <OrderTypeModal
        isOpen={isOrderTypeModalOpen}
        onClose={() => setIsOrderTypeModalOpen(false)}
        onSelect={handleOrderTypeSelect}
      />

      {/* BOM pre-scan (for BOM orders before form opens) */}
      <BomPrescanModal
        isOpen={isBomPrescanOpen}
        onClose={() => setIsBomPrescanOpen(false)}
        onDone={handleBomPrescanDone}
      />

      {/* Main procurement form (create/edit) */}
      <ProcurementModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setNewOrderType(null); setBomPrescanData(null); }}
        onSubmit={editingOrder ? handleUpdate : handleCreate}
        initialData={editingOrder}
        isEdit={!!editingOrder}
        orderType={editingOrder ? null : newOrderType}
        bomPrescanData={editingOrder ? null : bomPrescanData}
      />

      <ProcurementFilesModal
        isOpen={isFilesModalOpen}
        onClose={() => setIsFilesModalOpen(false)}
        order={selectedOrderForFiles}
        onFileChange={handleFileChange}
        canEdit={canEdit}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        entityName={orderToDelete?.catalog_number}
        entityType="הזמנת רכש"
      />
      
      <OrderHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        orderId={selectedOrderForHistory?.id}
        orderNumber={selectedOrderForHistory?.catalog_number}
      />

      <BomPreviewModal
        isOpen={isBomPreviewOpen}
        onClose={() => setIsBomPreviewOpen(false)}
        bomData={selectedOrderForBom?.bom_data}
        vendor={selectedOrderForBom?.bom_vendor}
        orderId={selectedOrderForBom?.id}
      />
    </div>
  );
};

export default ProcurementPage;
