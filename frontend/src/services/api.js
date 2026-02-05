import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor לטיפול בשגיאות אימות
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Items
export const getItems = async (params) => {
  const response = await api.get('/items', { params });
  return response.data;
};

export const createItem = async (item) => {
  const response = await api.post('/items', item);
  return response.data;
};

export const updateItemField = async (itemId, field, value) => {
  const response = await api.patch(`/items/${itemId}`, { field, value });
  return response.data;
};

export const bulkUpdateItems = async (ids, field, value) => {
  const response = await api.post('/items/bulk-update', { ids, field, value });
  return response.data;
};

export const deleteItem = async (itemId, password, confirmation) => {
  const response = await api.delete(`/items/${itemId}`, {
    data: { password, confirmation }
  });
  return response.data;
};

export const bulkDeleteItems = async (ids, password, confirmation) => {
  const response = await api.post('/items/bulk-delete', {
    ids,
    password,
    confirmation
  });
  return response.data;
};

export const deleteAllItems = async (password, confirmation) => {
  const response = await api.post('/items/delete-all', {
    password,
    confirmation,
    delete_all: true
  });
  return response.data;
};

export const importExcel = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/items/import-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const exportExcel = async (params) => {
  const response = await api.get('/items/export-excel', {
    params,
    responseType: 'blob',
  });
  
  // יצירת קישור להורדה
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `inventory_export_${new Date().getTime()}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

export const getLogs = async (params) => {
  const response = await api.get('/logs', { params });
  return response.data;
};

export default api;
