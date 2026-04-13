import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ColumnToggle from '../ColumnToggle/ColumnToggle';

// Mock dependencies
vi.mock('react-icons/fi', () => ({
  FiColumns: () => <span data-testid="icon-columns">cols</span>,
  FiCheck: () => <span data-testid="icon-check">✓</span>,
}));

vi.mock('../../common/Button/Button', () => ({
  default: ({ children, onClick, title, className }) => (
    <button onClick={onClick} title={title} className={className}>
      {children}
    </button>
  ),
}));

describe('ColumnToggle', () => {
  const allColumns = [
    { key: 'catalog_number', label: 'מק"ט' },
    { key: 'description', label: 'תיאור' },
    { key: 'manufacturer', label: 'יצרן' },
    { key: 'location', label: 'מיקום' },
  ];

  const defaultProps = {
    allColumns,
    visibleColumns: ['catalog_number', 'description'],
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle button', () => {
    render(<ColumnToggle {...defaultProps} />);

    expect(screen.getByTitle('בחירת עמודות')).toBeInTheDocument();
    expect(screen.getByText('עמודות')).toBeInTheDocument();
  });

  it('should show menu when button is clicked', () => {
    render(<ColumnToggle {...defaultProps} />);

    expect(screen.queryByText('הצג עמודות')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    expect(screen.getByText('הצג עמודות')).toBeInTheDocument();
  });

  it('should display all column options', () => {
    render(<ColumnToggle {...defaultProps} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    expect(screen.getByText('מק"ט')).toBeInTheDocument();
    expect(screen.getByText('תיאור')).toBeInTheDocument();
    expect(screen.getByText('יצרן')).toBeInTheDocument();
    expect(screen.getByText('מיקום')).toBeInTheDocument();
  });

  it('should show check icon for visible columns', () => {
    render(<ColumnToggle {...defaultProps} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    const checkIcons = screen.getAllByTestId('icon-check');
    expect(checkIcons).toHaveLength(2); // catalog_number and description
  });

  it('should call onToggle when a column is clicked', () => {
    render(<ColumnToggle {...defaultProps} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    fireEvent.click(screen.getByText('יצרן'));

    expect(defaultProps.onToggle).toHaveBeenCalledWith('manufacturer');
  });

  it('should toggle menu closed on second button click', () => {
    render(<ColumnToggle {...defaultProps} />);

    fireEvent.click(screen.getByTitle('בחירת עמודות'));
    expect(screen.getByText('הצג עמודות')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('בחירת עמודות'));
    expect(screen.queryByText('הצג עמודות')).not.toBeInTheDocument();
  });

  it('should close on outside click', () => {
    render(
      <div>
        <div data-testid="outside">outside area</div>
        <ColumnToggle {...defaultProps} />
      </div>
    );

    fireEvent.click(screen.getByTitle('בחירת עמודות'));
    expect(screen.getByText('הצג עמודות')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('הצג עמודות')).not.toBeInTheDocument();
  });

  it('should mark active class on visible columns', () => {
    render(<ColumnToggle {...defaultProps} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    const items = document.querySelectorAll('.column-toggle-item');
    // First two are visible
    expect(items[0].classList.contains('active')).toBe(true);
    expect(items[1].classList.contains('active')).toBe(true);
    // Last two are not visible
    expect(items[2].classList.contains('active')).toBe(false);
    expect(items[3].classList.contains('active')).toBe(false);
  });

  it('should handle empty visible columns', () => {
    render(<ColumnToggle {...defaultProps} visibleColumns={[]} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    expect(screen.queryByTestId('icon-check')).not.toBeInTheDocument();
  });

  it('should handle toggling already-visible column', () => {
    render(<ColumnToggle {...defaultProps} />);
    fireEvent.click(screen.getByTitle('בחירת עמודות'));

    fireEvent.click(screen.getByText('מק"ט'));

    expect(defaultProps.onToggle).toHaveBeenCalledWith('catalog_number');
  });
});
