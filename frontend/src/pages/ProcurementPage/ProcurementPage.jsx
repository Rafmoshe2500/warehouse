import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiClock, FiCheckCircle, FiX } from 'react-icons/fi';
import { Button, Input, Pagination, Spinner, ToastContainer } from '../../components/common';
import ProcurementTable from '../../components/procurement/ProcurementTable';
import ProcurementModal from '../../components/procurement/ProcurementModal';
import ProcurementFilesModal from '../../components/procurement/ProcurementFilesModal';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import OrderHistoryModal from '../../components/procurement/OrderHistoryModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import procurementService from '../../api/services/procurementService';
import './ProcurementPage.css';

const ProcurementPage = () => {
  const { isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({
    catalog_number: '',
    manufacturer: ''
  });

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedOrderForFiles, setSelectedOrderForFiles] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState(null);

  // Tab state: 'process' (default) or 'completed'
  const [activeTab, setActiveTab] = useState('process');

  const canEdit = hasPermission('procurement:rw');

  useEffect(() => {
    fetchOrders();
  }, [page, pageSize, activeTab]); // Reload when tab changes

  const fetchOrders = async (filtersOverride = null) => {
    setLoading(true);
    try {
      const currentFilters = filtersOverride || filters;
      const queryParams = {
        page,
        page_size: pageSize,
        ...currentFilters
      };

      // Add status filter based on active tab
      if (activeTab === 'process') {
        queryParams.status_ne = 'received';
      } else {
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
    const emptyFilters = {
      catalog_number: '',
      manufacturer: ''
    };
    setFilters(emptyFilters);
    setPage(1);
    fetchOrders(emptyFilters);
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

  const openFilesModal = (order) => {
    setSelectedOrderForFiles(order);
    setIsFilesModalOpen(true);
  };

  const openHistoryModal = (order) => {
    setSelectedOrderForHistory(order);
    setIsHistoryModalOpen(true);
  };

  const handleFileChange = async () => {
    try {
      fetchOrders();
      
      const data = await procurementService.getOrders({
         page,
         page_size: pageSize,
         catalog_number: filters.catalog_number 
      });
      setOrders(data.orders);
      
      const updatedOrder = data.orders.find(o => o.id === selectedOrderForFiles.id);
      if (updatedOrder) {
        setSelectedOrderForFiles(updatedOrder);
      }
    } catch (err) {
      console.error(err);
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
      
      <div className="procurement-header">
        {canEdit && (
          <Button 
            variant="primary" 
            onClick={openCreateModal}
            icon={<FiPlus />}
          >
            הזמנה חדשה
          </Button>
        )}
      </div>

      <div className="access-tabs">
        <button 
          className={`tab-btn ${activeTab === 'process' ? 'active' : ''}`}
          onClick={() => handleTabChange('process')}
        >
          <FiClock />
          בתהליך
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabChange('completed')}
        >
          <FiCheckCircle />
          הסתיים
        </button>
      </div>

      <div className="procurement-controls">
        <form onSubmit={handleSearch} className="search-form">
          <Input
            placeholder="חפש לפי מק&quot;ט..."
            value={filters.catalog_number}
            onChange={(e) => setFilters({...filters, catalog_number: e.target.value})}
            className="search-input"
          />
          <Input
            placeholder="חפש לפי יצרן..."
            value={filters.manufacturer}
            onChange={(e) => setFilters({...filters, manufacturer: e.target.value})}
            className="search-input"
          />
          <Button type="submit" variant="secondary" icon={<FiSearch />}>
            חפש
          </Button>
          {(filters.catalog_number || filters.manufacturer) && (
            <Button 
              type="button" 
              variant="tertiary" 
              onClick={handleClearFilters}
              icon={<FiX />}
            >
              נקה
            </Button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spinner size="large" />
        </div>
      ) : (
        <>
          <ProcurementTable
            orders={orders}
            canEdit={canEdit}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
            onManageFiles={openFilesModal}
            onHistory={openHistoryModal}
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

      {/* Modals */}
      <ProcurementModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={editingOrder ? handleUpdate : handleCreate}
        initialData={editingOrder}
        isEdit={!!editingOrder}
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
    </div>
  );
};

export default ProcurementPage;
