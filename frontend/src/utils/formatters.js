export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL');
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('he-IL');
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  return num.toLocaleString('he-IL');
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatCellValue = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
        if (Array.isArray(value)) return value.join(', ');
        // For dictionary (Allocations)
        return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    return String(value);
};
