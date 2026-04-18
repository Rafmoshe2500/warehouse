import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryHeader from '../InventoryHeader/InventoryHeader';

// Mock child components
vi.mock('../../common/Button/Button', () => ({
  default: ({ children, onClick, disabled, className, ...props }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../common/Spinner/Spinner', () => ({
  default: () => <span data-testid="spinner">Loading...</span>,
}));

vi.mock('../ColumnToggle/ColumnToggle', () => ({
  default: ({ allColumns, visibleColumns, onToggle }) => (
    <div data-testid="column-toggle">Column Toggle</div>
  ),
}));

vi.mock('react-icons/fi', () => ({
  FiPlus: () => <span>+</span>,
  FiUpload: () => <span>↑</span>,
  FiDownload: () => <span>↓</span>,
  FiEdit2: () => <span>✎</span>,
  FiTrash2: () => <span>🗑</span>,
  FiFilter: () => <span>⫶</span>,
  FiX: () => <span data-testid="fi-x">×</span>,
}));

describe('InventoryHeader', () => {
  const defaultProps = {
    canEdit: true,
    selectedItems: [],
    showFilters: false,
    uploadingExcel: false,
    searchQuery: '',
    onSearch: vi.fn(),
    onFilterToggle: vi.fn(),
    onUploadClick: vi.fn(),
    onExportClick: vi.fn(),
    onAddClick: vi.fn(),
    onBulkEdit: vi.fn(),
    onBulkDelete: vi.fn(),
    onImportProjectsClick: vi.fn(),
    allColumns: [{ key: 'desc', label: 'תיאור' }],
    visibleColumns: ['desc'],
    onColumnToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all action buttons for RW user', () => {
    render(<InventoryHeader {...defaultProps} />);

    expect(screen.getByTestId('import-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
    expect(screen.getByTestId('add-item-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  it('should hide edit/delete/import/add buttons for RO user', () => {
    render(<InventoryHeader {...defaultProps} canEdit={false} />);

    expect(screen.queryByTestId('import-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-item-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bulk-edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
    // Export should still be visible
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<InventoryHeader {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('חיפוש חופשי...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should call onSearch when typing in search', () => {
    render(<InventoryHeader {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('חיפוש חופשי...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
  });

  it('should toggle filter visibility', () => {
    render(<InventoryHeader {...defaultProps} />);

    const filterBtn = screen.getByText('פילטרים').closest('button');
    fireEvent.click(filterBtn);

    expect(defaultProps.onFilterToggle).toHaveBeenCalled();
  });

  it('should show "הסתרה" when filters are active', () => {
    render(<InventoryHeader {...defaultProps} showFilters={true} />);

    expect(screen.getByText('הסתרה')).toBeInTheDocument();
  });

  it('should render column toggle when allColumns provided', () => {
    render(<InventoryHeader {...defaultProps} />);

    expect(screen.getByTestId('column-toggle')).toBeInTheDocument();
  });

  it('should disable bulk edit when no items selected', () => {
    render(<InventoryHeader {...defaultProps} selectedItems={[]} />);

    expect(screen.getByTestId('bulk-edit-button')).toBeDisabled();
  });

  it('should enable bulk edit and show count when items selected', () => {
    render(<InventoryHeader {...defaultProps} selectedItems={['1', '2']} />);

    const bulkEditBtn = screen.getByTestId('bulk-edit-button');
    expect(bulkEditBtn).not.toBeDisabled();
    expect(bulkEditBtn).toHaveTextContent('(2)');
  });

  it('should disable delete when no items selected', () => {
    render(<InventoryHeader {...defaultProps} selectedItems={[]} />);

    expect(screen.getByTestId('delete-button')).toBeDisabled();
  });

  it('should enable delete and show count when items selected', () => {
    render(<InventoryHeader {...defaultProps} selectedItems={['1', '2', '3']} />);

    const deleteBtn = screen.getByTestId('delete-button');
    expect(deleteBtn).not.toBeDisabled();
    expect(deleteBtn).toHaveTextContent('(3)');
  });

  it('should show spinner when uploading excel', () => {
    render(<InventoryHeader {...defaultProps} uploadingExcel={true} />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should disable import button when uploading', () => {
    render(<InventoryHeader {...defaultProps} uploadingExcel={true} />);

    expect(screen.getByTestId('import-button')).toBeDisabled();
  });

  it('should call onAddClick when add button clicked', () => {
    render(<InventoryHeader {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-item-button'));

    expect(defaultProps.onAddClick).toHaveBeenCalled();
  });

  it('should call onExportClick when export button clicked', () => {
    render(<InventoryHeader {...defaultProps} />);

    fireEvent.click(screen.getByTestId('export-button'));

    expect(defaultProps.onExportClick).toHaveBeenCalled();
  });

  it('should hide import when hideImport is true', () => {
    render(<InventoryHeader {...defaultProps} hideImport={true} />);

    expect(screen.queryByTestId('import-button')).not.toBeInTheDocument();
  });

  it('should hide add when hideAdd is true', () => {
    render(<InventoryHeader {...defaultProps} hideAdd={true} />);

    expect(screen.queryByTestId('add-item-button')).not.toBeInTheDocument();
  });

  it('should render import projects button', () => {
    render(<InventoryHeader {...defaultProps} />);

    expect(screen.getByText('יבוא שריונים')).toBeInTheDocument();
  });

  it('should not show clear button when searchQuery is empty', () => {
    render(<InventoryHeader {...defaultProps} searchQuery="" />);

    expect(screen.queryByTestId('search-clear-btn')).not.toBeInTheDocument();
  });

  it('should show clear button when searchQuery is not empty', () => {
    render(<InventoryHeader {...defaultProps} searchQuery="some text" />);

    expect(screen.getByTestId('search-clear-btn')).toBeInTheDocument();
  });

  it('should call onSearch with empty string when clear button clicked', () => {
    render(<InventoryHeader {...defaultProps} searchQuery="some text" />);

    fireEvent.click(screen.getByTestId('search-clear-btn'));

    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });
});
