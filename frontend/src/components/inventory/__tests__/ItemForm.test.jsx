import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemForm from '../ItemForm/ItemForm';

// Mock dependencies
vi.mock('../../common/Button/Button', () => ({
  default: ({ children, onClick, type, variant }) => (
    <button onClick={onClick} type={type} data-variant={variant}>
      {children}
    </button>
  ),
}));

vi.mock('../../common/Input/Input', () => ({
  default: ({ name, value, onChange, required, placeholder, type, multiline, rows }) => (
    multiline
      ? <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} data-testid={`input-${name}`} />
      : <input name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} type={type || 'text'} data-testid={`input-${name}`} />
  ),
}));

describe('ItemForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByTestId('input-catalog_number')).toBeInTheDocument();
    expect(screen.getByTestId('input-serial')).toBeInTheDocument();
    expect(screen.getByTestId('input-description')).toBeInTheDocument();
    expect(screen.getByTestId('input-manufacturer')).toBeInTheDocument();
    expect(screen.getByTestId('input-location')).toBeInTheDocument();
    expect(screen.getByTestId('input-current_stock')).toBeInTheDocument();
    expect(screen.getByTestId('input-warranty_expiry')).toBeInTheDocument();
    expect(screen.getByTestId('input-reserved_stock')).toBeInTheDocument();
    expect(screen.getByTestId('input-purpose')).toBeInTheDocument();
    expect(screen.getByTestId('input-notes')).toBeInTheDocument();
  });

  it('should render field labels', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByText('מק"ט (חובה)')).toBeInTheDocument();
    expect(screen.getByText('מספר סריאלי')).toBeInTheDocument();
    expect(screen.getByText('תיאור פריט')).toBeInTheDocument();
    expect(screen.getByText('יצרן')).toBeInTheDocument();
    expect(screen.getByText('מיקום')).toBeInTheDocument();
    expect(screen.getByText('מלאי נוכחי')).toBeInTheDocument();
    expect(screen.getByText('תוקף אחריות')).toBeInTheDocument();
    expect(screen.getByText('מלאי משורין')).toBeInTheDocument();
    expect(screen.getByText('ייעוד')).toBeInTheDocument();
    expect(screen.getByText('הערות')).toBeInTheDocument();
  });

  it('should initialize with empty values when no initialData', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByTestId('input-catalog_number')).toHaveValue('');
    expect(screen.getByTestId('input-serial')).toHaveValue('');
    expect(screen.getByTestId('input-description')).toHaveValue('');
  });

  it('should pre-fill form fields from initialData', () => {
    const initialData = {
      catalog_number: 'CAT-001',
      serial: 'SER-123',
      description: 'Test item',
      manufacturer: 'Acme',
      location: 'A1',
      current_stock: '10',
      warranty_expiry: '2025-12-31T00:00:00Z',
      reserved_stock: '3',
      purpose: 'Testing',
      notes: 'Some notes',
    };

    render(<ItemForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByTestId('input-catalog_number')).toHaveValue('CAT-001');
    expect(screen.getByTestId('input-serial')).toHaveValue('SER-123');
    expect(screen.getByTestId('input-description')).toHaveValue('Test item');
    expect(screen.getByTestId('input-manufacturer')).toHaveValue('Acme');
    expect(screen.getByTestId('input-location')).toHaveValue('A1');
    expect(screen.getByTestId('input-purpose')).toHaveValue('Testing');
  });

  it('should update field value on change', () => {
    render(<ItemForm {...defaultProps} />);

    const input = screen.getByTestId('input-catalog_number');
    fireEvent.change(input, { target: { name: 'catalog_number', value: 'NEW-CAT' } });

    expect(input).toHaveValue('NEW-CAT');
  });

  it('should update multiple fields independently', () => {
    render(<ItemForm {...defaultProps} />);

    fireEvent.change(screen.getByTestId('input-catalog_number'), {
      target: { name: 'catalog_number', value: 'CAT-X' },
    });
    fireEvent.change(screen.getByTestId('input-manufacturer'), {
      target: { name: 'manufacturer', value: 'NewCo' },
    });

    expect(screen.getByTestId('input-catalog_number')).toHaveValue('CAT-X');
    expect(screen.getByTestId('input-manufacturer')).toHaveValue('NewCo');
  });

  it('should call onSubmit with form data on submit', () => {
    render(<ItemForm {...defaultProps} />);

    fireEvent.change(screen.getByTestId('input-catalog_number'), {
      target: { name: 'catalog_number', value: 'CAT-SUBMIT' },
    });
    fireEvent.change(screen.getByTestId('input-description'), {
      target: { name: 'description', value: 'Desc' },
    });

    const form = document.querySelector('.item-form');
    fireEvent.submit(form);

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        catalog_number: 'CAT-SUBMIT',
        description: 'Desc',
      })
    );
  });

  it('should call onCancel when cancel button clicked', () => {
    render(<ItemForm {...defaultProps} />);

    fireEvent.click(screen.getByText('ביטול'));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should render submit and cancel buttons', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByText('שמור פריט')).toBeInTheDocument();
    expect(screen.getByText('ביטול')).toBeInTheDocument();
  });

  it('should mark catalog_number as required', () => {
    render(<ItemForm {...defaultProps} />);

    expect(screen.getByTestId('input-catalog_number')).toHaveAttribute('required');
  });

  it('should submit all 10 fields in form data', () => {
    render(<ItemForm {...defaultProps} />);

    const form = document.querySelector('.item-form');
    fireEvent.submit(form);

    const submittedData = defaultProps.onSubmit.mock.calls[0][0];
    expect(Object.keys(submittedData)).toEqual(
      expect.arrayContaining([
        'catalog_number', 'serial', 'description', 'manufacturer',
        'location', 'current_stock', 'warranty_expiry', 'reserved_stock',
        'purpose', 'notes',
      ])
    );
  });

  it('should render notes as multiline textarea', () => {
    render(<ItemForm {...defaultProps} />);

    const notesInput = screen.getByTestId('input-notes');
    expect(notesInput.tagName).toBe('TEXTAREA');
  });

  it('should handle warranty_expiry date formatting', () => {
    const initialData = {
      warranty_expiry: '2025-06-15T10:30:00Z',
    };

    render(<ItemForm {...defaultProps} initialData={initialData} />);

    const warrantyInput = screen.getByTestId('input-warranty_expiry');
    expect(warrantyInput).toHaveValue('2025-06-15');
  });
});
