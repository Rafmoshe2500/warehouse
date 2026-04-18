import { useCellSelection } from './useCellSelection';
import { COLLECTION_TABLE_COLUMNS } from '../constants/tableConfig';
import { useToast } from '../context/ToastContext';

/**
 * Adapter over useCellSelection for the CollectionItemsTable.
 * Preserves the original API: handlers receive (e, itemId, colKey, value).
 */
export const useCollectionCellSelection = (processedItems, visibleColumns) => {
  const { showToast } = useToast();

  return useCellSelection({
    idField: 'item_id',
    items: processedItems,
    allColumns: COLLECTION_TABLE_COLUMNS,
    onShowToast: showToast,
    tableSelector: '.collection-items-table',
    visibleColumns,
    enableCtrlArrow: true,
  });
};

